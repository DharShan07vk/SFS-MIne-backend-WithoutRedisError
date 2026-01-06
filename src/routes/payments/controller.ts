import { and, eq } from "drizzle-orm";
import { Request, RequestHandler, Response } from "express";
import { nanoid } from "nanoid";
 import crypto from "crypto";
 import { validateWebhookSignature, validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { z } from "zod";
import { db } from "../../db/connection";
import {
  enquiryTransactionTable,
  trainingEnrolmentTable,
  trainingTable,
  transactionTable,
} from "../../db/schema";
import { razorpay, RZPY_WH_SECRET, RAZORPAY_KEYSEC } from "../../razporpay"; // Fix: Import from razporpay.ts
import { INVALID_SESSION_MSG } from "../../utils/constants";
import { createValidationError } from "../../utils/validation";
import { partialRzpyWebhookSchema } from "./validation";

export const createPayment: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  console.log("Running Create")
  try {
    const studentAuth = req.auth?.["STUDENT"];
    if (!studentAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }

    /** Validate training ID */
    const trainingId = z
      .object({
        trainingId: z.string().uuid("Invalid training ID"),
      })
      .safeParse(req.body);
    if (!trainingId.success) {
      res.status(400).json(createValidationError(trainingId));
      return;
    }

    /** Check if already enrolled and check if valid training */
    const [[alreadyEnrolled], [training]] = await Promise.all([
      db.query.trainingEnrolmentTable.findMany({
        where: () =>
          and(
            eq(trainingEnrolmentTable.trainingId, trainingId.data.trainingId),
            eq(trainingEnrolmentTable.userId, studentAuth.id),
          ),
        with: {
          transactions: {
            columns: {
              amount: true,
              status: true,
            },
          },
        },
      }),
      db
        .select()
        .from(trainingTable)
        .where(eq(trainingTable.id, trainingId.data.trainingId)),
    ]);
    console.log("🚀 ~ training:", training);
    if (!training) {
      res.status(404).json({
        error: "Could not find the training",
      });
      return;
    }
    if (
      new Date(training.startDate!) < new Date() ||
      new Date(training.endDate!) < new Date()
    ) {
      res.status(400).json({
        error: "Could not enroll because training has already started",
      });
      return;
    }
    // need to check the existing transactions for the enrolment id and see if atleast one success status with the training cost is present already
    if (
      alreadyEnrolled &&
      alreadyEnrolled.transactions.some(
        (d) =>
          Number(d.amount) === Number(training.cost) && d.status === "success",
      )
    ) {
      res.status(400).json({
        error: "Already enrolled in the training",
      });
      return;
    }

    /** Create enrolment if not already created */
    const [enrolment] = await db
      .insert(trainingEnrolmentTable)
      .values({
        trainingId: trainingId.data.trainingId,
        userId: studentAuth.id,
      })
      .onConflictDoUpdate({
        target: [
          trainingEnrolmentTable.userId,
          trainingEnrolmentTable.trainingId,
        ],
        where: and(
          eq(trainingEnrolmentTable.userId, studentAuth.id),
          eq(trainingEnrolmentTable.trainingId, training.id),
        ),
        set: {
          userId: trainingEnrolmentTable.userId,
          trainingId: trainingEnrolmentTable.trainingId,
        },
      })
      .returning();
    console.log("🚀 ~ enrolment:", enrolment);

    const receiptId = nanoid(21);

    /** Init rzpy and create order */
    const order = await razorpay.orders.create({
      amount: Number(training.cost) * 100,
      currency: "INR",
      customer_details: {
        name: studentAuth.firstName + " " + (studentAuth.lastName ?? ""),
        email: studentAuth.email,
        contact: studentAuth.mobile,
        billing_address: {
          country: "India",
        },
        shipping_address: {
          country: "India",
        },
      },
      partial_payment: false,
      notes: {
        reason: `Payment by ${studentAuth.firstName} for training: ${training.title}`,
      },
      receipt: receiptId,
    });

    /** Create new transaction */
    await db.insert(transactionTable).values({
      amount: String(training.cost),
      enrolmentId: enrolment.id,
      status: "pending",
      txnNo: receiptId,
      orderId: order.id,
    });
    res.json({
      data: {
        amount: String(training.cost),
        orderId: order.id,
      },
    });
  } catch (error) {
    console.log("🚀 ~ createPayment ~ error:", error);
    res.status(500).json({
      error: "Server error in creating payment",
    });
  }
};

export const verifyPayment: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    let errorMessage;

    // Debug: Log environment variables (first few characters only for security)
    console.log("[WH]: Debug - Environment check:");
    console.log("[WH]: RZPY_WH_SECRET exists:", !!RZPY_WH_SECRET);
    console.log("[WH]: RZPY_WH_SECRET length:", RZPY_WH_SECRET?.length);
    console.log("[WH]: RZPY_WH_SECRET preview:", RZPY_WH_SECRET?.substring(0, 10) + "...");

    async function verifyAndProcessPayment(
      data: unknown,
      paymentVerified: boolean,
      rzpyIdempotencyId: string,
    ) {
      const rzpySuccess = partialRzpyWebhookSchema.safeParse(data);

      if (!rzpySuccess.success) {
        console.log("[WH]: failed", "Parsing failed. invalid schema");
        console.dir(rzpySuccess.error, { depth: 5 });
        return;
      }

      const rzpyOrderId = rzpySuccess.data.payload.payment.entity.order_id;

      // fetch rzpy order details
      const rzpyOrder = await razorpay.orders.fetch(rzpyOrderId);

      // obtain reference no
      const referenceId = rzpyOrder.receipt;
      if (!referenceId) {
        console.log(
          "[WH]: failed",
          "Invalid reference Id. Cannot fetch system's reference ID",
        );
        console.dir(rzpyOrder, { depth: 5 });
        return;
      }

      if (!paymentVerified) {
        const data = rzpySuccess.data;

        errorMessage = "Payment verification failed. Invalid WH from server";
        console.log("[WH]: error", errorMessage);

        if (referenceId.includes("INST_")) {
          await db
            .update(enquiryTransactionTable)
            .set({
              status: "failed",
              paymentId: data.payload.payment.entity.id,
              idempotencyId: rzpyIdempotencyId,
            })
            .where(
              and(
                eq(enquiryTransactionTable.txnNo, referenceId),
                eq(enquiryTransactionTable.orderId, rzpyOrderId),
              ),
            );
        } else if (referenceId.includes("PSYC")) {
          await db
            .update(enquiryTransactionTable)
            .set({
              status: "failed",
              paymentId: data.payload.payment.entity.id,
              idempotencyId: rzpyIdempotencyId,
            })
            .where(
              and(
                eq(enquiryTransactionTable.txnNo, referenceId),
                eq(enquiryTransactionTable.orderId, rzpyOrderId),
              ),
            );
        } else if (referenceId.includes("CAREER_")) {
          await db
            .update(enquiryTransactionTable)
            .set({
              status: "failed",
              paymentId: data.payload.payment.entity.id,
              idempotencyId: rzpyIdempotencyId,
            })
            .where(
              and(
                eq(enquiryTransactionTable.txnNo, referenceId),
                eq(enquiryTransactionTable.orderId, rzpyOrderId),
              ),
            );
        } 
        else if(referenceId.includes("IND_")){
          await db.update(enquiryTransactionTable)
          .set({
            status: "failed",
            paymentId: data.payload.payment.entity.id,
            idempotencyId: rzpyIdempotencyId,
          })
          .where(
            and (
              eq(enquiryTransactionTable.txnNo, referenceId),
              eq(enquiryTransactionTable.orderId, rzpyOrderId),
            )
          )

        }
        else if(referenceId.includes("INST_")){
          await db.update(enquiryTransactionTable)
          .set({
            status: "failed",
            paymentId: data.payload.payment.entity.id,
            idempotencyId: rzpyIdempotencyId,
          })
          .where(
            and(
              eq(enquiryTransactionTable.txnNo, referenceId),
              eq(enquiryTransactionTable.orderId, rzpyOrderId),
            )
          )
        }
        else {
          // normal tran process
          await db
            .update(transactionTable)
            .set({
              status: "failed",
              paymentId: data.payload.payment.entity.id,
              idempotencyId: rzpyIdempotencyId,
            })
            .where(
              and(
                eq(transactionTable.orderId, rzpyOrderId),
                eq(transactionTable.txnNo, referenceId),
              ),
            );
        }
        return;
      }

      const transactionAlready = await db.query.transactionTable.findFirst({
        where(fields, ops) {
          return ops.eq(fields.idempotencyId, rzpyIdempotencyId);
        },
      });

      if (transactionAlready?.id) {
        errorMessage = "WH already received";
        console.log("[WH]: already:", errorMessage);
        return;
      }

      if (rzpySuccess.data.payload.payment.entity.status === "failed") {
        errorMessage = `Payment failed: ${rzpySuccess.data.payload.payment.entity.error_description} - ${rzpySuccess.data.payload.payment.entity.error_description}`;

        if (referenceId.includes("INST_")) {
          await db
            .update(enquiryTransactionTable)
            .set({
              status: "failed",
              paymentId: rzpySuccess.data.payload.payment.entity.id,
              idempotencyId: rzpyIdempotencyId,
            })
            .where(
              and(
                eq(enquiryTransactionTable.txnNo, referenceId),
                eq(enquiryTransactionTable.orderId, rzpyOrderId),
              ),
            );
        } else if (referenceId.includes("PSYC")) {
          await db
            .update(enquiryTransactionTable)
            .set({
              status: "failed",
              paymentId: rzpySuccess.data.payload.payment.entity.id,
              idempotencyId: rzpyIdempotencyId,
            })
            .where(
              and(
                eq(enquiryTransactionTable.txnNo, referenceId),
                eq(enquiryTransactionTable.orderId, rzpyOrderId),
              ),
            );
        } else if (referenceId.includes("CAREER_")) {
          await db
            .update(enquiryTransactionTable)
            .set({
              status: "failed",
              paymentId: rzpySuccess.data.payload.payment.entity.id,
              idempotencyId: rzpyIdempotencyId,
            })
            .where(
              and(
                eq(enquiryTransactionTable.txnNo, referenceId),
                eq(enquiryTransactionTable.orderId, rzpyOrderId),
              ),
            );
        } else {
          // normal tran process
          await db
            .update(transactionTable)
            .set({
              status: "failed",
              paymentId: rzpySuccess.data.payload.payment.entity.id,
              idempotencyId: rzpyIdempotencyId,
            })
            .where(
              and(
                eq(transactionTable.orderId, rzpyOrderId),
                eq(transactionTable.txnNo, referenceId),
              ),
            );
        }
        errorMessage = "Payment failed. Invalid WH schema";
        console.log("[WH]: error", errorMessage);
        return;
      }

      if (referenceId.includes("INST_")) {
        await db
          .update(enquiryTransactionTable)
          .set({
            status: "success",
            paymentId: rzpySuccess.data.payload.payment.entity.id,
            idempotencyId: rzpyIdempotencyId,
          })
          .where(
            and(
              eq(enquiryTransactionTable.txnNo, referenceId),
              eq(enquiryTransactionTable.orderId, rzpyOrderId),
            ),
          );
      } else if (referenceId.includes("PSYC")) {
        await db
          .update(enquiryTransactionTable)
          .set({
            status: "success",
            paymentId: rzpySuccess.data.payload.payment.entity.id,
            idempotencyId: rzpyIdempotencyId,
          })
          .where(
            and(
              eq(enquiryTransactionTable.txnNo, referenceId),
              eq(enquiryTransactionTable.orderId, rzpyOrderId),
            ),
          );
      } else if (referenceId.includes("CAREER_")) {
        await db
          .update(enquiryTransactionTable)
          .set({
            status: "success",
            paymentId: rzpySuccess.data.payload.payment.entity.id,
            idempotencyId: rzpyIdempotencyId,
          })
          .where(
            and(
              eq(enquiryTransactionTable.txnNo, referenceId),
              eq(enquiryTransactionTable.orderId, rzpyOrderId),
            ),
          );
      } 
      else if(referenceId.includes("IND_")){
        await db.update(enquiryTransactionTable)
        .set({  
          status: "success",
          paymentId: rzpySuccess.data.payload.payment.entity.id,
          idempotencyId: rzpyIdempotencyId,
        })
        .where(
          and(
            eq(enquiryTransactionTable.txnNo, referenceId),
            eq(enquiryTransactionTable.orderId, rzpyOrderId),
          ) 
        )}
        else if(referenceId.includes("INST_")){
        await db.update(enquiryTransactionTable)
        .set({  
          status: "success",
          paymentId: rzpySuccess.data.payload.payment.entity.id,
          idempotencyId: rzpyIdempotencyId,
        })
        .where(
          and(
            eq(enquiryTransactionTable.txnNo, referenceId),
            eq(enquiryTransactionTable.orderId, rzpyOrderId),
          ) 
        )}
      else {
        // normal tran process
        await db.transaction(async (tx) => {
          const [transaction] = await tx
            .update(transactionTable)
            .set({
              status: "success",
              paymentId: rzpySuccess.data.payload.payment.entity.id,
            })
            .where(
              and(
                eq(transactionTable.orderId, rzpyOrderId),
                eq(transactionTable.txnNo, referenceId),
              ),
            )
            .returning();

          if (!transaction || !transaction.enrolmentId) {
            tx.rollback();
            return;
          }
          await tx
            .update(trainingEnrolmentTable)
            .set({
              paidOn: new Date(),
            })
            .where(eq(trainingEnrolmentTable.id, transaction.enrolmentId));
        });
      }
      return;
    }

    const rzpyIdempotency = req.headers["x-razorpay-event-id"];
    const rzpyWHSignature = req.headers["x-razorpay-signature"];
    console.log(`Payload for Event ID: ${rzpyIdempotency}`);
    console.log(`Signature for Event ID: ${rzpyWHSignature}`);

    if (!rzpyWHSignature || !rzpyIdempotency) {
      errorMessage = "Invalid request - No signature found";
      console.log("[WH]: errorMessage:", errorMessage);
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    
    // For webhook verification, req.body will be a Buffer due to express.raw() middleware
    const rawBody = req.body;
    
    if (!rawBody) {
      errorMessage = "Raw body not found - middleware issue";
      console.log("[WH]: errorMessage:", errorMessage);
      res.status(400).json({ error: "Invalid request - no raw body" });
      return;
    }

    console.log("[WH]: Raw body type:", typeof rawBody);
    console.log("[WH]: Is Buffer:", Buffer.isBuffer(rawBody));
    console.log("[WH]: Raw body length:", rawBody.length);

    // Parse the JSON data from the raw body for processing
    let rawData;
    try {
      rawData = JSON.parse(rawBody.toString());
      console.log("[WH]: data:");
      console.dir(rawData, { depth: 6 });
    } catch (parseError) {
      errorMessage = "Failed to parse webhook data";
      console.log("[WH]: errorMessage:", errorMessage, parseError);
      res.status(400).json({ error: "Invalid JSON data" });
      return;
    }

    // Use multiple verification methods for debugging
    let webhookVerified = false;
    let razorpayVerified = false;
    let manualVerified = false;

    try {
      // Method 1: Use Razorpay's validateWebhookSignature
      const bodyString = rawBody.toString();
      razorpayVerified = validateWebhookSignature(
        bodyString,
        String(rzpyWHSignature),
        RZPY_WH_SECRET!,
      );
      console.log("[WH]: Razorpay validateWebhookSignature result:", razorpayVerified);
    } catch (verificationError) {
      console.log("[WH]: Razorpay verification error:", verificationError);
    }

    try {
      // Method 2: Manual HMAC verification
      const expectedSignature = crypto
        .createHmac("sha256", RZPY_WH_SECRET!)
        .update(rawBody)
        .digest("hex");
      
      manualVerified = expectedSignature === String(rzpyWHSignature);
      
      console.log("[WH]: Manual verification:");
      console.log("[WH]: Our calculated signature:", expectedSignature);
      console.log("[WH]: Razorpay signature:", rzpyWHSignature);
      console.log("[WH]: Manual verification result:", manualVerified);
    } catch (manualError) {
      console.log("[WH]: Manual verification error:", manualError);
    }

    // Use either verification method
    webhookVerified = razorpayVerified || manualVerified;
    
    console.log("[WH]: Final verification result:", webhookVerified);
    console.log("[WH]: Razorpay method:", razorpayVerified);
    console.log("[WH]: Manual method:", manualVerified);


    if (!webhookVerified) {
      errorMessage = "Invalid webhook. Could not be verified!";
      console.log("[WH]: errorMessage:", errorMessage);
      res.status(400).json({ error: errorMessage });
      return;
    }

    // @ts-expect-error llosu
    await verifyAndProcessPayment(rawData, webhookVerified, rzpyIdempotency);

    res.json({ success: true });
  } catch (error) {
    console.log("🚀 ~ verifyPayment ~ error:", error);
    res.status(500).json({
      error: "Server error in verifying payment",
    });
  }
};

// Add this to your payment controller
export const getPaymentStatus: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { orderId } = req.params;
    
    const transaction = await db.query.transactionTable.findFirst({
      where: eq(transactionTable.orderId, orderId),
      columns: {
        status: true,
        paymentId: true,
        orderId: true,
      },
    });

    if (!transaction) {
      res.status(404).json({
        error: "Transaction not found",
      });
      return;
    }

    res.json({
      data: {
        status: transaction.status,
        paymentId: transaction.paymentId,
        orderId: transaction.orderId,
      },
    });
  } catch (error) {
    console.log("🚀 ~ getPaymentStatus ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching payment status",
    });
  }
};

// Updated verifyClientPayment function
export const verifyClientPayment: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const studentAuth = req.auth?.["STUDENT"];
    if (!studentAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }

    const { orderId, paymentId, signature } = req.body;
    console.log("Client verification:", { orderId, paymentId, signature });

    if (!orderId || !paymentId || !signature) {
      res.status(400).json({
        error: "Missing required payment verification data",
      });
      return;
    }

    // Verify the payment signature using the correct secret key
    const isValidSignature = validatePaymentVerification(
      {
        order_id: orderId,
        payment_id: paymentId,
      },
      signature,
      RAZORPAY_KEYSEC! // Now correctly imported from razporpay.ts
    );

    if (!isValidSignature) {
      res.status(400).json({
        error: "Invalid payment signature",
      });
      return;
    }

    // Check if transaction exists and belongs to the current user
    const existingTransaction = await db.query.transactionTable.findFirst({
      where: eq(transactionTable.orderId, orderId),
      with: {
        enrolment: {
          with: {
            user: {
              columns: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!existingTransaction) {
      res.status(404).json({
        error: "Payment record not found",
      });
      return;
    }

    // Verify the transaction belongs to the current user
    if (existingTransaction.enrolment?.user?.id !== studentAuth.id) {
      res.status(403).json({
        error: "Unauthorized access to transaction",
      });
      return;
    }

    // Check if payment is already processed
    if (existingTransaction.status === "success") {
      res.json({
        message: "Payment already verified",
        data: {
          orderId,
          paymentId: existingTransaction.paymentId,
          status: "success",
        },
      });
      return;
    }

    // Update transaction status within a database transaction
    await db.transaction(async (tx) => {
      const [updatedTransaction] = await tx
        .update(transactionTable)
        .set({
          status: "success",
          paymentId: paymentId,
        })
        .where(eq(transactionTable.orderId, orderId))
        .returning();

      if (!updatedTransaction || !updatedTransaction.enrolmentId) {
        throw new Error("Failed to update transaction");
      }

      // Update enrollment with payment date
      await tx
        .update(trainingEnrolmentTable)
        .set({
          paidOn: new Date(),
        })
        .where(eq(trainingEnrolmentTable.id, updatedTransaction.enrolmentId));
    });

    console.log("Payment verified successfully:", { orderId, paymentId });

    res.json({
      message: "Payment verified successfully",
      data: {
        orderId,
        paymentId,
        status: "success",
      },
    });
  } catch (error) {
    console.log("🚀 ~ verifyClientPayment ~ error:", error);
    res.status(500).json({
      error: "Server error in payment verification",
    });
  }
};

// Debug endpoint to check environment variables and webhook setup
export const debugWebhook: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const debugInfo = {
      webhookSecretExists: !!RZPY_WH_SECRET,
      webhookSecretLength: RZPY_WH_SECRET?.length || 0,
      webhookSecretPreview: RZPY_WH_SECRET?.substring(0, 10) + "..." || "Not found",
      environment: process.env.NODE_ENV || "development",
      paymentMode: process.env.PAYMENT_MODE || "Not set",
      timestamp: new Date().toISOString(),
    };

    console.log("[DEBUG]: Webhook debug info:", debugInfo);

    res.json({
      message: "Webhook debug information",
      data: debugInfo,
    });
  } catch (error) {
    console.log("🚀 ~ debugWebhook ~ error:", error);
    res.status(500).json({
      error: "Server error in debug endpoint",
    });
  }
};

// ...rest of existing code...


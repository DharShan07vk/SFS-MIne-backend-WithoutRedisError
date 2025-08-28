import { Request, RequestHandler, Response } from "express";
import { INVALID_SESSION_MSG } from "../../utils/constants";
import { db } from "../../db/connection";
import { z } from "zod";
import { instructorTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { PartnerPayoutEligibilityStatus } from "../../utils/types";
import { razorpay } from "../../razporpay";

export const getAdminPartners: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const adminAuth = req.auth["ADMIN"];
    if (!adminAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const partners = await db.query.instructorTable.findMany({
      columns: {
        hash: false,
        salt: false,
        createdAt: false,
        updatedAt: false,
      },
      with: {
        trainings: {
          columns: {
            id: true,
          },
        },
      },
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt);
      },
    });
    res.json({ data: partners });
  } catch (error) {
    console.log("🚀 ~ getAdminPartners ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching partner details",
    });
  }
};

export const getAdminPartner: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const adminAuth = req.auth["ADMIN"];
    console.log("🚀 ~ adminAuth:", adminAuth);
    if (!adminAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const { partnerId: partnerIdUnsafe } = req.params;
    const partnerId = z.string().uuid().safeParse(partnerIdUnsafe);
    if (!partnerId.success) {
      res.status(400).json({
        error: "Invalid partner ID",
      });
      return;
    }
    const partner = await db.query.instructorTable.findFirst({
      columns: {
        hash: false,
        salt: false,
        updatedAt: false,
      },
      with: {
        trainings: {
          with: {
            enrolments: true,
          },
        },
        account: true,
        address: true,
      },
      where(fields, operators) {
        return operators.eq(fields.id, partnerId.data);
      },
    });

    if (!partner) {
      res.status(404).json({
        error: "Partner details could not be found!",
      });
      return;
    }

    let payoutEligibility: PartnerPayoutEligibilityStatus;
    if (!partner?.account) {
      payoutEligibility = "no-data";
    } else if (
      partner?.account.rzpyContactId &&
      !partner?.account.rzpyFundingAcctId
    ) {
      payoutEligibility = "pending-details";
    } else if (
      (partner?.account.rzpyBankAcctId &&
        !partner?.account.bankAccVerifiedOn) ||
      (partner?.account.rzpyCardId && !partner?.account.cardVerifiedOn) ||
      (partner?.account.rzpyVPAId && !partner?.account.VPAVerifiedOn)
    ) {
      payoutEligibility = "pending-approval";
    } else {
      payoutEligibility = "approved";
    }
    res.json({ data: { ...partner, payoutEligibility } });
  } catch (error) {
    console.log("🚀 ~ getAdminPartners ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching partner details",
    });
  }
};

export const approvePartner: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const adminAuth = req.auth["ADMIN"];
    if (!adminAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const { partnerId: partnerIdUnsafe } = req.params;
    const partnerId = z.string().uuid().safeParse(partnerIdUnsafe);
    if (!partnerId.success) {
      res.status(400).json({
        error: "Invalid partner ID",
      });
      return;
    }
    const decision = z
      .object({ decision: z.literal("approve").or(z.literal("deny")) })
      .safeParse(req.body);
    if (!decision.success) {
      res.status(400).json({
        error: "Invalid choice!",
      });
      return;
    }
    await db
      .update(instructorTable)
      .set({
        approvedBy: decision.data.decision === "approve" ? adminAuth.id : null,
      })
      .where(eq(instructorTable.id, partnerId.data));
    res.json({
      message:
        decision.data.decision === "approve"
          ? "Partner approval successful!"
          : "Partner request denied",
    });
  } catch (error) {
    console.log("🚀 ~ approvePartner ~ error:", error);
    res.status(500).json({
      error: "Server error in approving partner",
    });
  }
};

export const verifyPartnerAccount: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const adminAuth = req.auth["ADMIN"];
    if (!adminAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const { partnerId: partnerIdUnsafe } = req.params;
    const partnerId = z.string().uuid().safeParse(partnerIdUnsafe);
    if (!partnerId.success) {
      res.status(400).json({
        error: "Invalid partner ID",
      });
      return;
    }
    const decision = z
      .object({ type: z.literal("bank_account").or(z.literal("vpa")) })
      .safeParse(req.body);
    if (!decision.success) {
      res.status(400).json({
        error: "Invalid choice!",
      });
      return;
    }
    const account = await db.query.accountTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.partnerId, partnerId.data);
      },
    });
    if (!account) {
      res.status(404).json({
        error: "Account details not found",
      });
      return;
    }
    // if (decision.data.type === "bank_account") {
    //   // const verification = await razorpay.ca
    // }
    res.json({ message: "Verified successfully!" });
  } catch (error) {
    console.log("🚀 ~ verifyPartnerAccount ~ error:", error);
    res.status(500).json({
      error: "Server error in verifying account details",
    });
  }
};

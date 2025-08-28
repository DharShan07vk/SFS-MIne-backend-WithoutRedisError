import { z } from "zod";

export const verifyWebhookSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
});

export const verifyPaymentSchema = z
  .object({
    razorpay_signature: z.string(),
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
  })
  .or(
    z.object({
      error: z.object({
        code: z.string(),
        description: z.string(),
        field: z.string().nullish(),
        source: z.string(),
        step: z.string(),
        reason: z.string(),
        metadata: z.object({
          payment_id: z.string(),
          order_id: z.string(),
        }),
      }),
    }),
  );

export const partialRzpyWebhookSchema = z.object({
  payload: z.object({
    payment: z.object({
      entity: z.object({
        amount: z.number(),
        amount_refunded: z.number(),
        id: z.string(),
        order_id: z.string(),
        status: z.enum(["captured", "failed"]),
        error_code: z.string().nullable(),
        error_description: z.string().nullable(),
        error_reason: z.string().nullable(),
      }),
    }),
  }),
});

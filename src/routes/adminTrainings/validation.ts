import { z } from "zod";

export const approveTrainingSchema = z
  .object({
    decision: z.literal("approve"),
    startDate: z.coerce.date({
      required_error: "Start date is required",
    }),
    endDate: z.coerce.date({
      required_error: "End date is required",
    }),
    cut: z
      .number()
      .positive("Percentage cannot be 0 or below 0")
      .int(
        "Only whole numbers allowed. Percentage in decimal places are prohibited",
      )
      .min(10)
      .max(90),
  })
  .refine(({ endDate, startDate }) => endDate > startDate, {
    message: "End date should be greated than start date!",
  })
  .or(z.object({ decision: z.literal("deny") }));

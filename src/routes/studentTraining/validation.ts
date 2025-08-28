import { z } from "zod";

export const studentTrainingFeedbackSchema = z.object({
  rating: z.number().positive().max(5),
  feedback: z.string().min(5, "Atleast 5 characters are required for feedback"),
});

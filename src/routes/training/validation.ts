import { z } from "zod";


export const newCourseFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    cover: z
      .instanceof(File, { message: "Image required!" })
      .refine((file) => file.size <= 5 * 1024 * 1024, {
        message: "Cover image size must be less than 5MB",
      })
      .refine((file) => file.type.includes("image/"), {
        message: "Not valid image format",
      }),
    trainingLink: z
      .string()
      .url("Training link must be a valid URL")
      .nullish()
      .or(z.literal("")),
    type: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
    course_type : z.enum(['Skill Development', 'Finishing School']),
    location: z
      .string()
      .min(1, "Location is required")
      .nullish()
      .or(z.literal("")),
    startDate: z.coerce
      .date({
        required_error: "Start date is required",
      })
      .refine((date) => date >= new Date(), {
        message: "Start date must be in the future",
      }),
    category: z.string().min(1, "Category is required"),
    endDate: z.coerce
      .date({
        required_error: "End date is required",
      })
      .refine((endDate) => endDate >= new Date(), {
        message: "End date must be in the future",
      }),
    cost: z.coerce
      .number({
        required_error: "Cost is required",
      })
      .min(10, "Cost must be a non-negative number"),
    whoIsItFor: z
    .string()
    .transform((val) => {
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        return val;
      }
    })
    .pipe(z.array(z.string().min(1, "Each 'Who is it for' entry must be at least 1 character long"))
      .min(1, "At least one 'Who is it for' entry is required")),
    whatYouWillLearn: z
    .string()
    .transform((val) => {
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        return val;
      }
    })
    .pipe(z.array(z.string().min(1, "Each 'What you will learn' entry must be at least 1 character long"))
      .min(1, "At least one 'What you will learn' entry is required")),
  })
  .refine(({ endDate, startDate }) => endDate > startDate, {
    message: "End date should be greater than start date!",
  })

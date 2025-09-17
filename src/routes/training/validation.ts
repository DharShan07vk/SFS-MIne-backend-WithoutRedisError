import { z } from "zod";

const onlineLessonSchema = z.object({
  type: z.literal("ONLINE"),
  title: z.string().min(1, "Lesson title is required"),
  content: z.string().min(1, "Lesson content is required"),
  video: z.string().url("Valid video URL is required"),
  id: z.number(),
});

const offlineLessonSchema = z.object({
  type: z.literal("OFFLINE"),
  title: z.string().min(1, "Lesson title is required"),
  location: z.string().min(1, "Location is required"),
  id: z.number(),
});

const lessonSchema = z.union([onlineLessonSchema, offlineLessonSchema]);

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
    category: z.enum([
      "Seminars/Webinar/Mentorship",
      "Certificate Program",
      "Corporate Training Program",
      "Instrumentation Hands-on",
    ]),
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
    lessons: z
      .array(
        z
          .object({
            title: z.string().min(1, "Title is required"),
            content: z.string().min(1, "Content is required"),
            video: z
              .string({ message: "Video not found!" })
              .url("Video is necessary!"),
            type: z.literal("ONLINE"),
            id: z.number().positive(),
          })
          .or(
            z.object({
              title: z.string().min(1, "Title is required"),
              location: z
                .string()
                .min(1, "Location is required")
                .nullish()
                .or(z.literal("")),
              type: z.literal("OFFLINE"),
              id: z.number().positive(),
            }),
          ),
      )
      .optional(),
  })
  .refine(({ endDate, startDate }) => endDate > startDate, {
    message: "End date should be greater than start date!",
  })
  .refine(
    (data) =>
      !["ONLINE", "HYBRID"].includes(data.type) ||
      (data.lessons && data.lessons.length > 0),
    {
      message: "Lessons are required for ONLINE/HYBRID courses",
    },
  )
  .refine(
    (data) =>
      !["OFFLINE"].includes(data.type) || (data.location && data.location.length > 0),
    {
      message: "Location is required for OFFLINE courses",
    },
  );

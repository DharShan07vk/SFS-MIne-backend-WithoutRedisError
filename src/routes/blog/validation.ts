import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z
    .instanceof(File, { message: "Image required!" })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Cover image size must be less than 5MB",
    })
    .refine((file) => file.type.includes("image/"), {
      message: "Not valid image format",
    }),
  references: z.array(z.string().min(1, "Reference DOI number is required")),
  authorName: z
    .string({ required_error: "Name is required!" })
    .min(5, "Name is too short")
    .max(100, "Name is too long"),
  authorEmail: z.string().email("Invalid email"),
  authorMobile: z
    .string({ required_error: "Mobile is required!" })
    .regex(/^[6789]\d{9}$/, "Mobile number is invalid"),
  authorLinkedin: z
    .string()
    .url("Invalid URl")
    .refine(
      (url) =>
        url.startsWith("https://linkedin.") ||
        url.startsWith("https://www.linkedin."),
      {
        message: "Only valid linkedin links are allowed",
      },
    ),
  authorDesignation: z
    .string()
    .min(1, "Valid designation is required")
    .nullish()
    .or(z.literal("")),
  category: z.string().min(1, "Category is required").max(50, "Category is too long"),
});

import { z } from "zod";

export const registerUserSchema = z.object({
  companyName: z
    .string()
    .refine((value) => /^[a-zA-Z\s]{2,100}$/g.test(value), {
      message:
        "Company name should not contain special characters and must be within 100 letters",
    }),
  email: z.string().email("Invalid email address"),
  cinOrGst: z.string().min(10, "CIN / GST Number must be provided"),
  owner: z.string().refine((value) => /^[a-zA-Z\s]{2,100}$/g.test(value), {
    message:
      "Contact name should not contain special characters and must be within 100 letters",
  }),
  phone: z.string().refine((value) => /^[6-9]\d{9}$/.test(value), {
    message: "Phone number must be 10 digits and start with 6, 7, 8, or 9",
  }),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "You must accept terms to continue",
  }),
  city: z
    .string()
    .min(2, "Invalid city")
    .max(100, "Maximum city name limit reached"),
  state: z
    .string()
    .min(2, "Invalid state")
    .max(100, "Maximum state name limit reached"),
  pincode: z.string().regex(/[0-9]{6}/g, "Invalid pincode"),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must be at least 8 characters long and contain both letters and numbers",
    ),
});

export const signInUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must be at least 8 characters long and contain both letters and numbers",
    ),
});

export const getUserInfoSchema = z
  .string({ required_error: "Invalid request" })
  .uuid("Invalid user id");

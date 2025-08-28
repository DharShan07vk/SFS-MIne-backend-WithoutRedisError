import { z } from "zod";

export const registerUserSchema = z
  .object({
    firstName: z
      .string({ required_error: "First name is required!" })
      .min(5, "Name is too short")
      .max(50, "Name is too long"),
    email: z.string({ required_error: "Email is required!" }).email(),
    mobile: z
      .string({ required_error: "Mobile is required!" })
      .regex(/^[6789]\d{9}$/, "Mobile number is invalid"),
    password: z.string({ required_error: "Password is required!" }).min(8),
    confirmPassword: z
      .string({ required_error: "Please confirm same password!" })
      .min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
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

import { z } from "zod";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters long and contain both letters and numbers";

export const registerUserSchema = z
  .object({
    firstName: z
      .string({ required_error: "First name is required!" })
      .min(3, "First name must be at least 3 characters"),
    email: z.string({ required_error: "Email is required!" }).email(),
    mobile: z
      .string({ required_error: "Mobile is required!" })
      .regex(/^[6789]\d{9}$/, "Mobile number is invalid"),
    password: z
      .string({ required_error: "Password is required!" })
      .regex(PASSWORD_REGEX, PASSWORD_RULE_MESSAGE),
    confirmPassword: z
      .string({ required_error: "Please confirm same password!" })
      .min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });

export const signInUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().regex(PASSWORD_REGEX, PASSWORD_RULE_MESSAGE),
});

export const getUserInfoSchema = z
  .string({ required_error: "Invalid request" })
  .uuid("Invalid user id");


export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  newPassword: z
    .string()
    .max(100, "Password too long")
    .regex(PASSWORD_REGEX, PASSWORD_RULE_MESSAGE),
});

import { z, ZodSchema } from "zod";

export const createValidationError = (
  schema: ReturnType<ZodSchema["safeParse"]>,
) => {
  return schema.error?.errors.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));
};

export const authRoleEnum = z.enum(["STUDENT", "PARTNER", "ADMIN"]);

export const commonAuthCookieSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string().nullish(),
  email: z.string(),
  mobile: z.string(),
  createdAt: z.coerce.date().nullish(),
  role: authRoleEnum,
});

export type AuthCookieType = z.infer<typeof commonAuthCookieSchema>;

export const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

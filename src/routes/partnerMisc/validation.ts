import { z } from "zod";

export const accountSchema = z.union([
  z.object({
    bank_account: z.object({
      ifsc: z.string().min(1),
      bank_name: z.string().min(1),
      name: z.string().min(3, "Account holder name must be at least 3 characters"),
      account_number: z.string().min(1),
    }),
  }),
  z.object({
    vpa: z.object({
      address: z.string().min(1),
    }),
  }),
]);

// File validation for logo and digitalSign
const fileValidation = z
  .instanceof(File, { message: "File is required!" })
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: "File size must be less than 5MB",
  })
  .refine(
    (file) =>
      file.type.includes("image/") ||
      file.type.includes("application/pdf"),
    {
      message: "File must be an image (JPG, PNG, GIF, WebP) or PDF",
    }
  )
  .optional();

export const partnerProfileSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().refine((value) => /^[a-zA-Z\s]{3,100}$/g.test(value), {
    message:
      "Contact name should not contain special characters and must be within 100 letters",
  }),
  lastName: z
    .string()
    .refine((value) => /^[a-zA-Z\s]{3,100}$/g.test(value), {
      message:
        "Contact name should not contain special characters and must be within 100 letters",
    })
    .nullish()
    .or(z.literal("")),
  phone: z.string().refine((value) => /^[6-9]\d{9}$/.test(value), {
    message: "Phone number must be 10 digits and start with 6, 7, 8, or 9",
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
  // File upload validations
  logo: fileValidation,
  digitalSign: fileValidation,
  // Additional fields that might be in the form
  institutionName: z.string().max(100).optional(),
  gst: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST format (Example: 22AAAAA0000A1Z5)",
    )
    .optional()
    .or(z.literal("")),
  hasGst: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
  topics: z.array(z.string()).max(10, "Maximum 10 topics allowed").optional(),
}).refine(
  (data) => {
    if (data.hasGst === true && (!data.gst || data.gst.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "GST number is required when 'Has GST' is selected",
    path: ["gst"],
  },
);

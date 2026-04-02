import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.string().email("Invalid email"),
  instructorName: z.string().min(3, "Instructor name must be at least 3 characters").max(50),
  phone: z.string().regex(/^[6789]\d{9}$/, "Invalid mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  signUpAs: z.enum(["institution", "individual"]),
  companyName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  gst: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST format (Example: 22AAAAA0000A1Z5)",
    )
    .optional()
    .or(z.literal("")),
  hasGst: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
  trainingTopics: z.array(z.string()).max(10, "Maximum 10 topics allowed"),
  // File upload fields
  logo: z
    .instanceof(File, { message: "Logo is required!" })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Logo size must be less than 5MB",
    })
    .refine((file) => file.type.includes("image/"), {
      message: "Logo must be a valid image format",
    })
    .optional(),
  digitalSign: z
    .instanceof(File, { message: "Digital signature is required!" })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Digital signature size must be less than 5MB",
    })
    .refine(
      (file) => file.type.includes("image/") || file.type.includes("pdf"),
      {
        message: "Digital signature must be an image or PDF",
      },
    )
    .optional(),
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

export const signInUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

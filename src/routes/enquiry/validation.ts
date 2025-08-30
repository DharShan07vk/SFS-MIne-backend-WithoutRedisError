import { z } from "zod";

export const institutionPlanSchema = z.object({
  schoolName: z
    .string({ required_error: "School name is required!" })
    .min(5, "School name is too short")
    .max(100, "School name is too long"),
  contactName: z
    .string({ required_error: "Name is required!" })
    .min(5, "Name is too short")
    .max(100, "Name is too long"),
  contactMobile: z
    .string({ required_error: "Mobile is required!" })
    .regex(/^[6789]\d{9}$/, "Mobile number is invalid"),
  contactEmail: z.string().email("Invalid email"),
  studentsCount: z.number().positive("Student count must be more than 0"),
  addressLine1: z.string().min(10).max(200),
  addressLine2: z.string().min(5).max(100).nullish().or(z.literal("")),
  city: z
    .string()
    .min(2, "Invalid city")
    .max(100, "Maximum city name limit is 100 characters"),
  state: z
    .string()
    .min(2, "Invalid state")
    .max(100, "Maximum state name limit is 100 characters only"),
  pincode: z.string().regex(/[0-9]{6}/g, "Invalid pincode"),
  plan: z.enum(["Basics", "Premium"]),
});

export const psychologyTrainingSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required!" })
    .min(2, "First name is too short")
    .max(100, "First name is too long"),
  lastName: z
    .string()
    .min(5, "Last name is too short")
    .max(100, "Last name is too long")
    .nullish()
    .or(z.literal("")),
  mobile: z
    .string({ required_error: "Mobile is required!" })
    .regex(/^[6789]\d{9}$/, "Mobile number is invalid"),
  email: z.string().email("Invalid email"),
  city: z
    .string()
    .min(2, "Invalid city")
    .max(100, "Maximum city name limit is 100 characters"),
  state: z
    .string()
    .min(2, "Invalid state")
    .max(100, "Maximum state name limit is 100 characters only"),
  idCard: z
    .instanceof(File, { message: "Image required!" })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Cover image size must be less than 5MB",
    })
    .refine((file) => file.type.includes("image/"), {
      message: "Not valid image format",
    })
    .nullish(),
});

export const careerCounsellingSchema = z
  .object({
    firstName: z
      .string({ required_error: "First name is required!" })
      .min(2, "First name is too short")
      .max(100, "First name is too long"),
    lastName: z
      .string()
      .min(2, "Last name is too short")
      .max(100, "Last name is too long")
      .nullish()
      .or(z.literal("")),
    studentId: z.string().optional(),
    mobile: z
      .string({ required_error: "Mobile is required!" })
      .regex(/^[6789]\d{9}$/, "Mobile number is invalid"),
    email: z.string().email("Invalid email"),
    service: z
      .enum([
        "Career choice",
        "CV/Resume prep",
        "Research Proposal editing",
        "LOR/SOP editing & preparation",
        "Shortlisting Abroad PhD",
        "PG/PhD abroad application guidance",
        "Post Doc Application",
        "Industry jobs",
      ])
      .nullish(),
    plan: z.enum(["Basics", "Premium"]).nullish(),
  })
  .superRefine((fields, ctx) => {
    if (!fields.plan && !fields.service) {
      ctx.addIssue({
        message: "Either 'plan' or 'service' must be provided.",
        code: "custom",
        path: ["service", "plan"],
      });
    }
    if (fields.plan && fields.service) {
      ctx.addIssue({
        message: "'plan' and 'service' cannot both be provided.",
        code: "custom",
        path: ["service", "plan"],
      });
    }
  });

export const caRegistrationSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required!" })
    .min(2, "First name is too short")
    .max(100, "First name is too long"),
  lastName: z
    .string()
    .min(5, "Last name is too short")
    .max(100, "Last name is too long")
    .nullish()
    .or(z.literal("")),
  email: z.string().email("Invalid email"),
  mobile: z
    .string({ required_error: "Mobile is required!" })
    .regex(/^[6789]\d{9}$/, "Mobile number is invalid"),
  eduType: z.enum(["UG", "PG", "PhD"]), // Assuming caEducationType() returns a string
  department: z.string().max(100, "Department must be at most 100 characters"),
  collegeName: z
    .string()
    .max(200, "College name must be at most 200 characters"),
  yearInCollege: z.number().positive().optional(),
  collegeCity: z
    .string()
    .max(200, "College city must be at most 200 characters"),
  dob: z.coerce.date().nullish(),
  linkedin: z
    .string()
    .url("Invalid URl")
    .refine((url) => url.startsWith("https://linkedin"), {
      message: "Only valid linkedin links are allowed",
    }),
});

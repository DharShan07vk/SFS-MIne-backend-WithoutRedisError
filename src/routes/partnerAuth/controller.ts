import { Request, RequestHandler, Response } from "express";
import { DatabaseError } from "pg";
import { db } from "../../db/connection";
import {
  accountTable,
  addressTable,
  instructorTable,
  userTable,
} from "../../db/schema";
import { JWT_SECRET_PT, JWT_SECRET_STU } from "../../middleware";
import {
  INVALID_SESSION_MSG,
  STUDENT_AUTH_COOKIE_NAME,
} from "../../utils/constants";
import { signJWT } from "../../utils/jwt";
import { generateHashPassword, verifyPassword } from "../../utils/password";
import { authRoleEnum, createValidationError } from "../../utils/validation";
import { registerUserSchema, signInUserSchema } from "./validation";
import { razorpay } from "../../razporpay";
import { supabase, SUPABASE_PROJECT_URL } from "../../supabase";
import { nanoid } from "nanoid";

export const registerUser: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const rawData = req.body;

    // Parse form data and files
    const registerUserValidation = registerUserSchema.safeParse({
      ...rawData,
      trainingTopics: rawData.trainingTopics ? JSON.parse(rawData.trainingTopics) : [],
      logo: files?.logo?.[0] 
        ? new File([files.logo[0].buffer], files.logo[0].originalname, {
            type: files.logo[0].mimetype,
          })
        : undefined,
      digitalSign: files?.digitalSign?.[0]
        ? new File([files.digitalSign[0].buffer], files.digitalSign[0].originalname, {
            type: files.digitalSign[0].mimetype,
          })
        : undefined,
    });

    if (!registerUserValidation.success) {
      res.status(400).json({
        error: "Validation Error",
        errors: createValidationError(registerUserValidation),
      });
      return;
    }

    const { data } = registerUserValidation;
    const pwd = await generateHashPassword(data.password);

    // Upload files to Supabase if provided
    let logoURL: string | undefined;
    let digitalSignURL: string | undefined;

    const instructorId = nanoid(21);

    if (files?.logo?.[0]) {
      const logoFile = files.logo[0];
      const logoExtension = logoFile.originalname.split('.').pop() || 'jpg';
      
      const { data: logoData, error: logoError } = await supabase.storage
        .from("s4s-media")
        .upload(
          `public/photos/${instructorId}-logo.${logoExtension}`,
          logoFile.buffer,
          { 
            upsert: true,
            contentType: logoFile.mimetype 
          },
        );

      if (logoError) {
        console.log("Logo upload error:", logoError);
        res.status(500).json({
          error: "Something went wrong when uploading logo",
        });
        return;
      }

      logoURL = SUPABASE_PROJECT_URL + "/storage/v1/object/public/" + logoData.fullPath;
    }

    if (files?.digitalSign?.[0]) {
      const signFile = files.digitalSign[0];
      const signExtension = signFile.originalname.split('.').pop() || 'jpg';
      
      const { data: signData, error: signError } = await supabase.storage
        .from("s4s-media")
        .upload(
          `public/photos/${instructorId}-signature.${signExtension}`,
          signFile.buffer,
          { 
            upsert: true,
            contentType: signFile.mimetype 
          },
        );

      if (signError) {
        console.log("Digital signature upload error:", signError);
        res.status(500).json({
          error: "Something went wrong when uploading digital signature",
        });
        return;
      }

      digitalSignURL = SUPABASE_PROJECT_URL + "/storage/v1/object/public/" + signData.fullPath;
    }

    await db.transaction(async (tx) => {
      let instructor;
      if (data.signUpAs === "institution") {
        const [address] = await tx
          .insert(addressTable)
          .values({
            addressLine1: data.addressLine1 ?? "",
            addressLine2: data.addressLine2 ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            pincode: data.pincode ?? "",
          })
          .returning();
        
        instructor = await tx
          .insert(instructorTable)
          .values({
            email: data.email,
            firstName: data.instructorName,
            mobile: data.phone,
            institutionName: data.companyName,
            hash: pwd.hash,
            salt: pwd.salt,
            addressId: address.id,
            gst: data.gst || null,
            topics: data.trainingTopics,
            logo: logoURL,
            digitalSign: digitalSignURL,
          })
          .returning();
      } else {
        const [address] = await tx
          .insert(addressTable)
          .values({
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            addressLine1: "",
          })
          .returning();
        
        instructor = await tx
          .insert(instructorTable)
          .values({
            email: data.email,
            firstName: data.instructorName,
            mobile: data.phone,
            hash: pwd.hash,
            salt: pwd.salt,
            addressId: address.id,
            topics: data.trainingTopics,
            logo: logoURL,
            digitalSign: digitalSignURL,
          })
          .returning();
      }

      // Fix GSTIN issue - only send if valid
      const contactPayload: any = {
        name: instructor[0].firstName + " " + (instructor[0].lastName ?? ""),
        contact: instructor[0].mobile,
        email: instructor[0].email,
        gstin : instructor[0].gst,
        fail_existing: 0,
      };
      
      // Only add gstin if it's valid (15 alphanumeric characters)
      // if (instructor[0].gst && /^[0-9A-Z]{15}$/.test(instructor[0].gst)) {
      //   contactPayload.gstin = instructor[0].gst;
      // }

      const contact = await razorpay.customers.create(contactPayload);

      await tx.insert(accountTable).values({
        partnerId: instructor[0].id,
        rzpyContactId: contact.id,
      });
    });

    res.json({
      message: "Account created successfully!",
    });
  } catch (error) {
    console.log("🚀 ~ registerUser ~ error:", error);
    if (error instanceof DatabaseError) {
      if (error.code === "23505" && error.constraint === "instructor_mobile_unique") {
        res.status(500).json({
          error: "Mobile number already exists",
        });
        return;
      }
      if (error.code === "23505" && error.constraint === "instructor_email_unique") {
        res.status(500).json({
          error: "Email already registered",
        });
        return;
      }
    }
    res.status(500).json({
      error: "Server error in registering instructor: " + error,
    });
  }
};

export const signIn: RequestHandler = async (req: Request, res: Response) => {
  try {
    const signInUserValidation = signInUserSchema.safeParse(req.body);
    if (!signInUserValidation.success) {
      res.status(400).json({
        errors: createValidationError(signInUserValidation),
      });
      return;
    }
    const user = await db.query.instructorTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.email, signInUserValidation.data.email);
      },
    });
    if (!user) {
      res.status(404).json({
        error: "Invalid credentials",
      });
      return;
    }
    const doPwdMatch = await verifyPassword(
      { hash: user?.hash!, salt: user?.salt! },
      signInUserValidation.data.password,
    );
    if (!doPwdMatch) {
      res.status(404).json({
        error: "Invalid user name or password",
      });
      return;
    }
    const userAuth = {
      email: user.email,
      firstName: user.firstName,
      id: user.id,
      mobile: user.mobile,
      role: authRoleEnum.Enum.PARTNER,
      lastName: user.lastName,
      createdAt: user.createdAt,
      isApproved: user.approvedBy ?? false,
      logo: user.logo,
      digitalSign: user.digitalSign,
    };
    const token = await signJWT(userAuth, JWT_SECRET_PT!);
    res.cookie(STUDENT_AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
    });
    res.json({
      data: {
        token,
        user: userAuth,
      },
    });
  } catch (error) {
    console.log("🚀 ~ signIn ~ error:", error);
    res.status(500).json({
      error: "Server error in signing in",
    });
  }
};

export const getUserInfo: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const studentAuth = req.auth["STUDENT"];
    if (!studentAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }

    const userInfo = await db.query.userTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, studentAuth.id);
      },
      columns: {
        hash: false,
        salt: false,
        updatedAt: false,
      },
    });
    res.json({ ...userInfo, role: "STUDENT" });
  } catch (error) {
    console.log("🚀 ~ getUserInfo ~ error:", error);
    res.status(500).json({
      error: "Server error in obtaining user information",
    });
  }
};

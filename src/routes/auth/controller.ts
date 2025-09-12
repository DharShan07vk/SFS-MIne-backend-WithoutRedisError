import { RequestHandler, Request, Response } from "express";
import {
  getUserInfoSchema,
  registerUserSchema,
  signInUserSchema,
  resetPasswordSchema,
} from "./validation";
import { db } from "../../db/connection";
import { userTable } from "../../db/schema";
import { generateHashPassword, verifyPassword } from "../../utils/password";
import { authRoleEnum, createValidationError } from "../../utils/validation";
import { DatabaseError } from "pg";
import { signJWT } from "../../utils/jwt";
import { JWT_SECRET_STU } from "../../middleware";
import {
  INVALID_SESSION_MSG,
  STUDENT_AUTH_COOKIE_NAME,
} from "../../utils/constants";
import { eq } from "drizzle-orm";

export const registerUser: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const registerUserValidation = registerUserSchema.safeParse(req.body);
    if (!registerUserValidation.success) {
      res.status(400).json({
        errors: createValidationError(registerUserValidation),
      });
      return;
    }
    const pwd = await generateHashPassword(
      registerUserValidation.data.password,
    );
    await db.insert(userTable).values({
      ...registerUserValidation.data,
      hash: pwd.hash,
      salt: pwd.salt,
    });
    res.json({
      message: "Account created successfully!",
    });
  } catch (error) {
    console.log("🚀 ~ constregisterUser:RequestHandler= ~ error:", error);
    if (error instanceof DatabaseError) {
      if (error.code === "23505" && error.constraint === "user_mobile_unique") {
        res.status(500).json({
          error: "Mobile number already exists",
        });
        return;
      }
      if (error.code === "23505" && error.constraint === "user_email_unique") {
        res.status(500).json({
          error: "Email already registered",
        });
        return;
      }
    }
    res.json({
      error: "Server error in signing In",
    });
  }
};

export const signIn: RequestHandler = async (req: Request, res: Response) => {
  try {
    console.log(`Sign-in attempt for: ${req.body?.email}`);
    const signInUserValidation = signInUserSchema.safeParse(req.body);
    if (!signInUserValidation.success) {
      console.log("Validation failed:", signInUserValidation.error.errors);
      res.status(400).json({
        errors: createValidationError(signInUserValidation),
      });
      return;
    }
    const user = await db.query.userTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.email, signInUserValidation.data.email);
      },
    });
    if (!user) {
      console.log(`User not found: ${signInUserValidation.data.email}`);
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
      console.log(`Password mismatch for: ${signInUserValidation.data.email}`);
      res.status(404).json({
        error: "Invalid credentials",
      });
      return;
    }
    const userAuth = {
      email: user.email,
      firstName: user.firstName,
      id: user.id,
      mobile: user.mobile,
      role: authRoleEnum.Enum.STUDENT,
      lastName: user.lastName,
      createdAt: user.createdAt,
    };
    const token = await signJWT(userAuth, JWT_SECRET_STU!);
    const _30minsFromNow = new Date(new Date().getTime() + 30 * 60000);
    res.cookie(STUDENT_AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: _30minsFromNow,
      sameSite: "lax",
    });
    console.log(`Successful sign-in for: ${signInUserValidation.data.email}`);
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

export const resetPassword: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Validate input using Zod
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const { email, newPassword } = parsed.data;

    // Check if user exists
    const user = await db.query.userTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.email, email);
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Hash new password
    const hashedPassword = await generateHashPassword(newPassword);

    // Update user password
    await db
      .update(userTable)
      .set({ hash: hashedPassword.hash, salt: hashedPassword.salt })
      .where(eq(userTable.id, user.id));
    console.log("🚀 ~ resetPassword ~ user.id:", user.id);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("🚀 ~ resetPassword ~ error:", error);
    res.status(500).json({ error: "Server error in resetting password" });
  }
};

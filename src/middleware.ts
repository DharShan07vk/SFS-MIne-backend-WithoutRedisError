import { NextFunction, Request, RequestHandler, Response } from "express";
import {
  ADMIN_AUTH_COOKIE_NAME,
  INVALID_SESSION_MSG,
  PARTNER_AUTH_COOKIE_NAME,
  STUDENT_AUTH_COOKIE_NAME,
} from "./utils/constants";
import { verifyJWT } from "./utils/jwt";
import { authRoleEnum, commonAuthCookieSchema } from "./utils/validation";

const JWT_SECRET_STU = process.env.AUTH_SECRET_STU;
const JWT_SECRET_PT = process.env.AUTH_SECRET_PT;
const JWT_SECRET_AD = process.env.AUTH_SECRET_AD;

if (!JWT_SECRET_STU || !JWT_SECRET_AD || !JWT_SECRET_PT)
  throw new Error("Incorrectly configured variables. Contact developer!");

export { JWT_SECRET_AD, JWT_SECRET_PT, JWT_SECRET_STU };

const nameMap: {
  [key in typeof authRoleEnum._type]: {
    cookieName: string;
    secret: string;
  };
} = {
  STUDENT: { cookieName: STUDENT_AUTH_COOKIE_NAME, secret: JWT_SECRET_STU },
  ADMIN: { cookieName: ADMIN_AUTH_COOKIE_NAME, secret: JWT_SECRET_AD },
  PARTNER: { cookieName: PARTNER_AUTH_COOKIE_NAME, secret: JWT_SECRET_PT },
};

export const requireAuthToken: (
  role: typeof authRoleEnum._type,
  shouldThrow?: boolean,
) => RequestHandler =
  (role, shouldThrow = true) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")?.[1];
    if (!token) {
      if (!shouldThrow) {
        next();
        return;
      }
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    try {
      const jwtUnsafe = await verifyJWT(token, nameMap[role].secret);
      const jwtParsed = commonAuthCookieSchema.safeParse(jwtUnsafe);
      if (!jwtParsed.success) {
        throw new Error("JWT Shape misconfig from client");
      }

      req.auth = req.auth ?? {};
      // @ts-expect-error bicj
      req.auth[role] = { ...jwtParsed.data, role };
      next();
      return;
    } catch (error) {
      console.log("🚀 ~ error:", error);
      if (!shouldThrow) {
        next();
        return;
      }
      res.clearCookie(nameMap[role].cookieName);
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
    }
  };

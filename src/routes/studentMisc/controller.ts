import { Request, RequestHandler, Response } from "express";
export const saveUserProfile: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
  } catch (error) {
    console.log("🚀 ~ saveUserProfile ~ error:", error);
    res.status(500).json({
      error: "Server error in saving user profile",
    });
  }
};

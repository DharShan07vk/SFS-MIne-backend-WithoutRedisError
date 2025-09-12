import { Router } from "express";
import { sendOTP,sendOTPReset,verifyOTP } from "./controller";

const otpRouter = Router();

otpRouter.post("/send", sendOTP);
otpRouter.post("/verify", verifyOTP);
otpRouter.post("/reset", sendOTPReset);

export default otpRouter;

import { Router } from "express";
import { sendOTP,verifyOTP } from "./controller";

const otpRouter = Router();

otpRouter.post("/send", sendOTP);
otpRouter.post("/verify", verifyOTP);

export default otpRouter;

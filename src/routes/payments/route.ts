import { Router } from "express";
import { requireAuthToken, rawBodyMiddleware } from "../../middleware";
import { createPayment, getPaymentStatus, verifyPayment, verifyClientPayment } from "./controller";

const paymentRouter = Router();

paymentRouter.post("/create", requireAuthToken("STUDENT"), createPayment);
paymentRouter.post("/verify", rawBodyMiddleware,verifyPayment); // Webhook endpoint
paymentRouter.post("/verify-client", requireAuthToken("STUDENT"), verifyClientPayment); // NEW client endpoint
paymentRouter.get("/status/:orderId", requireAuthToken("STUDENT"), getPaymentStatus);

export default paymentRouter;

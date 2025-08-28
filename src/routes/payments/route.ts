import { Router } from "express";
import { requireAuthToken } from "../../middleware";
import { createPayment, getPaymentStatus, verifyPayment, verifyClientPayment } from "./controller";

const paymentRouter = Router();

paymentRouter.post("/create", requireAuthToken("STUDENT"), createPayment);
paymentRouter.post("/verify", verifyPayment); // Webhook endpoint - raw body handled at app level
paymentRouter.post("/verify-client", requireAuthToken("STUDENT"), verifyClientPayment); // NEW client endpoint
paymentRouter.get("/status/:orderId", requireAuthToken("STUDENT"), getPaymentStatus);

export default paymentRouter;

import { Router } from "express";
import { 
    sendOTP, 
    sendOTPReset, 
    verifyOTP, 
    sendCourseRegistrationEmail,
    sendMentalWellbeingEmail,
    sendCareerCounselingEmail,
    sendInstitutionPartnershipEmail,
    sendGeneralPaymentEmail
} from "./controller";

const emailRouter = Router();

// OTP Routes
emailRouter.post("/sendOTP", sendOTP);
emailRouter.post("/verifyOTP", verifyOTP);
emailRouter.post("/resetOTP", sendOTPReset);

// Payment Success Email Routes
emailRouter.post("/send-course-registration", sendCourseRegistrationEmail);
emailRouter.post("/send-mental-wellbeing", sendMentalWellbeingEmail);
emailRouter.post("/send-career-counseling", sendCareerCounselingEmail);
emailRouter.post("/send-institution-booking", sendInstitutionPartnershipEmail);
emailRouter.post("/send-general-payment", sendGeneralPaymentEmail);

export default emailRouter;

import { Router, urlencoded } from "express";
import {
  campusAmbassadorRegistration,
  createInsitutitionRegistration,
  enrollCareerCounselling,
  enrollPsychologyCounselling,
} from "./controller";
import multer from "multer";

const enquiryRouter = Router();

enquiryRouter.post("/ca", campusAmbassadorRegistration);
enquiryRouter.post("/plans", createInsitutitionRegistration);
enquiryRouter.post(
  "/psychology",
  urlencoded({ extended: true }),
  multer().single("idCard"),
  enrollPsychologyCounselling,
);
enquiryRouter.post("/career", enrollCareerCounselling);

export default enquiryRouter;

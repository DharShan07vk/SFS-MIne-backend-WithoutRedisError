import { Router, urlencoded } from "express";
import {
  individualOrInstitutionRegistration,
  campusAmbassadorRegistration,
  createInsitutitionRegistration,
  enrollPsychologyCounselling,
  enrollCareerCounselling,
  
} from "./controller";
import multer from "multer";

const enquiryRouter = Router();

enquiryRouter.post("/ind_inst", urlencoded({ extended: true }), individualOrInstitutionRegistration);
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

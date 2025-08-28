import { Router } from "express";
import { requireAuthToken } from "../../middleware";
import {
  getCAApplications,
  getCareerCounselling,
  getInstitutionRegistrations,
  getPsychologyTrainings,
} from "./controller";

const adminApplicationsRouter = Router();

adminApplicationsRouter.get(
  "/psychology",
  requireAuthToken("ADMIN"),
  getPsychologyTrainings,
);
adminApplicationsRouter.get(
  "/career",
  requireAuthToken("ADMIN"),
  getCareerCounselling,
);
adminApplicationsRouter.get(
  "/ca",
  requireAuthToken("ADMIN"),
  getCAApplications,
);
adminApplicationsRouter.get(
  "/institution-plans",
  requireAuthToken("ADMIN"),
  getInstitutionRegistrations,
);

export default adminApplicationsRouter;

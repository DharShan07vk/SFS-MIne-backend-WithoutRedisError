import { Router } from "express";
import { requireAuthToken } from "../../middleware";
import {
  getCAApplications,
  getInstitutionRegistrations,
  getIndividualTrainings,
} from "./controller";

const adminApplicationsRouter = Router();

adminApplicationsRouter.get(
  "/individual",
  requireAuthToken("ADMIN"),
  getIndividualTrainings,
);
// adminApplicationsRouter.get(
//   "/career",
//   requireAuthToken("ADMIN"),
//   getCareerCounselling,
// );
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

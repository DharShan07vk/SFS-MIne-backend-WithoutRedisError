import { Router } from "express";
import { requireAuthToken } from "../../middleware";
import { captureFeedback, getTraining, getTrainings, getskillDevelopments, getFinishingSchools } from "./controller";

const studentTrainingRouter = Router();


studentTrainingRouter.get(
  "/skill-developments",
  requireAuthToken("STUDENT", false),
  getskillDevelopments,
);
studentTrainingRouter.get(
  "/finishing-schools",
  requireAuthToken("STUDENT", false),
  getFinishingSchools
);
studentTrainingRouter.get(
  "/:trainingId",
  requireAuthToken("STUDENT", false),
  getTraining,
);
studentTrainingRouter.post(
  "/:trainingId/feedback",
  requireAuthToken("STUDENT"),
  captureFeedback,
);

export default studentTrainingRouter;

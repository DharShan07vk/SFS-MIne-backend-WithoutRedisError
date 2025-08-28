import { Router } from "express";
import { requireAuthToken } from "../../middleware";
import { captureFeedback, getTraining, getTrainings } from "./controller";

const studentTrainingRouter = Router();

studentTrainingRouter.get(
  "/",
  requireAuthToken("STUDENT", false),
  getTrainings,
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

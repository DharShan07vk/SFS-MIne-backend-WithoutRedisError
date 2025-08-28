import { Router, urlencoded } from "express";
import {
  createTraining,
  deleteAsset,
  generateCertificates,
  generateUploadSignature,
  getTraining,
  getTrainings,
} from "./controller";
import { requireAuthToken } from "../../middleware";
import multer from "multer";

const trainingRouter = Router();

trainingRouter.get("/", requireAuthToken("PARTNER"), getTrainings);
trainingRouter.get("/:trainingId", requireAuthToken("PARTNER"), getTraining);
trainingRouter.post(
  "/",
  urlencoded({ extended: true }),
  multer().single("cover"),
  requireAuthToken("PARTNER"),
  createTraining,
);
trainingRouter.post(
  "/:trainingId/generate",
  requireAuthToken("PARTNER"),
  generateCertificates,
);
trainingRouter.post(
  "/sign-asset",
  requireAuthToken("PARTNER"),
  generateUploadSignature,
);
trainingRouter.post("/delete-asset", requireAuthToken("PARTNER"), deleteAsset);

export default trainingRouter;

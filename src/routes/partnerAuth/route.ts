import { Router, urlencoded } from "express";
import { registerUser, signIn} from "./controller";
import multer from "multer";
import { requireAuthToken } from "../../middleware";

const partnerAuthRouter = Router();

// Configure multer for multiple file uploads
const upload = multer().fields([
  { name: "logo", maxCount: 1 },
  { name: "digitalSign", maxCount: 1 },
]);

partnerAuthRouter.post(
  "/register",
  urlencoded({ extended: true }),
  upload,
  registerUser,
);
partnerAuthRouter.post("/sign-in", signIn);

export default partnerAuthRouter;

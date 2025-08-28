import { Router } from "express";
import { getAdminStudent, getAdminStudents } from "./controller";
import { requireAuthToken } from "../../middleware";

const adminStudentsRouter = Router();

adminStudentsRouter.get("/", requireAuthToken("ADMIN"), getAdminStudents);
adminStudentsRouter.get(
  "/:studentId",
  requireAuthToken("ADMIN"),
  getAdminStudent,
);

export default adminStudentsRouter;

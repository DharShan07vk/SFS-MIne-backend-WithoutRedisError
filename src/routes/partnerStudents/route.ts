import { Router } from "express";
import { requireAuthToken } from "../../middleware";
import { getStudents } from "./controller";

const partnerStudentsRouter = Router();

partnerStudentsRouter.get("/", requireAuthToken("PARTNER"), getStudents);

export default partnerStudentsRouter;

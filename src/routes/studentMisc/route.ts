import { Router } from "express";
import { requireAuthToken } from "../../middleware";

const studentMiscRouter = Router();

studentMiscRouter.post("/profile", requireAuthToken("STUDENT"));

export default studentMiscRouter;

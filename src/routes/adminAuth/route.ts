import { Router } from "express";
import { signIn } from "./controller";

const adminAuthRouter = Router();

// adminAuthRouter.post("/register", registerUser);
adminAuthRouter.post("/sign-in", signIn);

export default adminAuthRouter;

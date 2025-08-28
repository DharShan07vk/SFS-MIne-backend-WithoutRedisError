import { Router } from "express";
import { getUserInfo, registerUser, signIn } from "./controller";
import { requireAuthToken } from "../../middleware";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/sign-in", signIn);
authRouter.get("/me", requireAuthToken("STUDENT"), getUserInfo);

export default authRouter;

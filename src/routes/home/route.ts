import { Router } from "express";
import { getCarouselCourses } from "./controller";

const homeRouter = Router();

homeRouter.get("/carousel", getCarouselCourses);

export default homeRouter;

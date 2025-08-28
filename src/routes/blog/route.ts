import { Router, urlencoded } from "express";
import { approveBlog, createBlog, getBlog, getBlogs } from "./controller";
import multer from "multer";
import { requireAuthToken } from "../../middleware";

const blogsRouter = Router();

blogsRouter.get("/", requireAuthToken("ADMIN", false), getBlogs);
blogsRouter.get("/:blogSlug", requireAuthToken("ADMIN", false), getBlog);
blogsRouter.post(
  "/",
  urlencoded({ extended: true }),
  multer().single("coverImage"),
  createBlog,
);
blogsRouter.post("/:blogSlug/approve", requireAuthToken("ADMIN"), approveBlog);

export default blogsRouter;

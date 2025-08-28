import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
import { z } from "zod";
import { createBlogSchema } from "./validation";
import { createValidationError, slugify } from "../../utils/validation";
import { blogAuthorTable, blogTable } from "../../db/schema";
import { nanoid } from "nanoid";
import { supabase, SUPABASE_PROJECT_URL } from "../../supabase";
import { INVALID_SESSION_MSG } from "../../utils/constants";
import { eq, sql } from "drizzle-orm";

export const getBlogs: RequestHandler = async (req: Request, res: Response) => {
  try {
    const adminAuth = req.auth?.["ADMIN"];
    const blogs = await db.query.blogTable.findMany({
      with: {
        blogAuthor: {
          columns: {
            name: true,
          },
        },
      },
      columns: {
        category: true,
        coverImage: true,
        createdAt: true,
        title: true,
        id: true,
        slug: true,
        references: true,
        approvedBy: adminAuth ? true : false,
      },
      where(fields, operators) {
        return adminAuth ? sql`true` : operators.isNotNull(fields.approvedBy);
      },
    });
    res.json({ data: blogs });
  } catch (error) {
    console.log("🚀 ~ getBlogs ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching blogs",
    });
  }
};

export const getBlog: RequestHandler = async (req: Request, res: Response) => {
  try {
    const adminAuth = req.auth?.["ADMIN"];
    const { blogSlug: blogSlugUnsafe } = req.params;
    const blogSlug = z
      .string()
      .regex(/^[a-zA-Z]+[a-zA-Z0-9-_]*$/, "Invalid blog link")
      .safeParse(blogSlugUnsafe);
    if (!blogSlug.success) {
      res.status(400).json({
        error: "Invalid blog ID",
      });
      return;
    }
    const blog = await db.query.blogTable.findFirst({
      with: {
        blogAuthor: {
          columns: {
            name: true,
            designation: true,
            linkedin: true,
            email: true,
            mobile: true,
          },
        },
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.slug, blogSlug.data),
          adminAuth ? sql`true` : operators.isNotNull(fields.approvedBy),
        );
      },
    });
    if (!blog) {
      res.status(404).json({
        error:
          "No such blog is found! It is either deleted or your URL is invalid!",
      });
      return;
    }
    res.json({ data: blog });
  } catch (error) {
    console.log("🚀 ~ getBlogs ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching blog",
    });
  }
};

export const createBlog: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const rawData = req.body;
    const blogEntry = createBlogSchema.safeParse({
      ...rawData,
      coverImage: new File([req.file!.buffer], req.file!.filename, {
        type: req.file!.mimetype,
      }),
      references: JSON.parse(rawData.references),
      category: rawData.category, // Add category parsing
    });
    
    if (!blogEntry.success) {
      res.status(400).json({
        errors: createValidationError(blogEntry),
      });
      return;
    }

    let blogCoverImageURL;
    const blogSlug = slugify(blogEntry.data.title) + "-" + nanoid(10);
    const { data, error } = await supabase.storage
      .from("s4s-media")
      .upload(
        "public/blog-covers/" + blogSlug + ".jpg",
        blogEntry.data.coverImage,
        { upsert: true },
      );
    if (error) {
      res.status(500).json({
        error: "Something went wrong when uploading cover image",
      });
      return;
    }
    blogCoverImageURL =
      SUPABASE_PROJECT_URL + "/storage/v1/object/public/" + data.fullPath;

    await db.transaction(async (tx) => {
      let [existingBlogAuthor] = await tx
        .select()
        .from(blogAuthorTable)
        .where(eq(blogAuthorTable.email, blogEntry.data.authorEmail));
      if (!existingBlogAuthor) {
        [existingBlogAuthor] = await tx
          .insert(blogAuthorTable)
          .values({
            name: blogEntry.data.authorName,
            email: blogEntry.data.authorEmail,
            mobile: blogEntry.data.authorMobile,
            designation: blogEntry.data.authorDesignation,
            linkedin: blogEntry.data.authorLinkedin,
          })
          .returning();
      }

      await tx.insert(blogTable).values({
        content: blogEntry.data.content,
        slug: slugify(blogEntry.data.title) + nanoid(10),
        title: blogEntry.data.title,
        author: existingBlogAuthor.id,
        coverImage: blogCoverImageURL,
        references: blogEntry.data.references,
        category: blogEntry.data.category, // Add category to database insert
      });
    });
    
    res.json({
      message: "Blog created successfully",
    });
  } catch (error) {
    console.log("🚀 ~ createBlog ~ error:", error);
    res.status(500).json({
      error: "Server error in creating blog",
    });
  }
};

export const approveBlog: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const adminAuth = req.auth["ADMIN"];
    if (!adminAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const { blogSlug: blogSlugUnsafe } = req.params;
    const blogSlug = z
      .string()
      .regex(/^[a-zA-Z]+[a-zA-Z0-9-_]*$/, "Invalid blog link")
      .safeParse(blogSlugUnsafe);
    if (!blogSlug.success) {
      res.status(400).json({
        error: "Invalid blog ID",
      });
      return;
    }
    const intent = req.body;
    const intentParsed = z
      .object({ intent: z.literal("approve").or(z.literal("reject")) })
      .safeParse(intent);
    if (!intentParsed.success) {
      res.status(400).json({
        error: "Invalid intent",
      });
      return;
    }
    await db
      .update(blogTable)
      .set({
        approvedBy:
          intentParsed.data.intent === "approve" ? adminAuth.id : null,
      })
      .where(eq(blogTable.slug, blogSlug.data));
    res.json({
      message: `Blog ${intentParsed.data.intent === "approve" ? "approval" : "rejection"} successful!`,
    });
  } catch (error) {
    console.log("🚀 ~ approveBlog ~ error:", error);
    res.status(500).json({
      error: "Server error in approving blog",
    });
  }
};

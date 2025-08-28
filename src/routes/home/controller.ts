import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";

export const getCarouselCourses: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const courses = await db.query.trainingTable.findMany({
      where(fields, operators) {
        return operators.and(
          operators.isNotNull(fields.approvedBy),
          // operators.gte(fields.startDate, new Date()),
        );
      },
      columns: {
        title: true,
        description: true,
        coverImg: true,
      },
      limit: 6,
      orderBy(fields, operators) {
        return operators.desc(fields.updatedAt);
      },
    });
    res.json({ data: courses });
  } catch (error) {
    console.log("🚀 ~ getCarouselCourses ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching courses data",
    });
  }
};

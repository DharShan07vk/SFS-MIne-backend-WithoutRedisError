import { sql } from "drizzle-orm";
import { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { db } from "../../db/connection";
import { studentTrainingFeedbackSchema } from "./validation";
import { createValidationError } from "../../utils/validation";
import { INVALID_SESSION_MSG } from "../../utils/constants";
import { trainingRatingTable } from "../../db/schema";

export const getTrainings: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const studentAuth = req.auth?.["STUDENT"];
    const trainings = await db.query.trainingTable.findMany({
      with: {
        instructor: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        enrolments: {
          where(fields, operators) {
            return studentAuth
              ? operators.eq(fields.userId, studentAuth?.id)
              : sql`false`;
          },
          with: {
            transactions: {
              columns: {
                amount: true,
                status: true,
              },
            },
          },
        },
      },
      where(fields, operators) {
        return operators.isNotNull(fields.approvedBy);
      },
      orderBy(fields, operators) {
        return operators.desc(fields.startDate);
      },
      columns: {
        id: true,
        title: true,
        coverImg: true,
        startDate: true,
        endDate: true,
        description: true,
        location: true,
        cost: true,
        type: true,
        createdAt: true,
        category: true,
      },
    });
    res.json({ data: trainings });
  } catch (error) {
    console.log("🚀 ~ getTrainings ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching training details",
    });
  }
};

export const getskillDevelopments: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const studentAuth = req.auth?.["STUDENT"];
    const trainings = await db.query.trainingTable.findMany({
      with: {
        instructor: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        enrolments: {
          where(fields, operators) {
            return studentAuth
              ? operators.eq(fields.userId, studentAuth?.id)
              : sql`false`;
          },
          with: {
            transactions: {
              columns: {
                amount: true,
                status: true,
              },
            },
          },
        },
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.courseType, "Skill Development"),
          operators.isNotNull(fields.approvedBy)
        );
      },
      orderBy(fields, operators) {
        return operators.desc(fields.startDate);
      },
      columns: {
        id: true,
        title: true,
        coverImg: true,
        startDate: true,
        endDate: true,
        description: true,
        whoIsItFor:true,
        whatYouWillLearn:true,
        location: true,
        cost: true,
        type: true,
        courseType:true,
        createdAt: true,
        category: true,
      },
    });
    console.log("🚀 ~ getskillDevelopments ~ trainings:", trainings);
    res.json({ data: trainings });
  } catch (error) {
    console.log("🚀 ~ getTrainings ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching training details",
    });
  }
};


export const getFinishingSchools: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const studentAuth = req.auth?.["STUDENT"];
    const trainings = await db.query.trainingTable.findMany({
      with: {
        instructor: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        enrolments: {
          where(fields, operators) {
            return studentAuth
              ? operators.eq(fields.userId, studentAuth?.id)
              : sql`false`;
          },
          with: {
            transactions: {
              columns: {
                amount: true,
                status: true,
              },
            },
          },
        },
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.courseType, "Finishing School"),
          operators.isNotNull(fields.approvedBy)
        )
       
      },
      orderBy(fields, operators) {
        return operators.desc(fields.startDate);
      },
      columns: {
        id: true,
        title: true,
        coverImg: true,
        startDate: true,
        endDate: true,
        description: true,
        location: true,
        courseType: true,
        whoIsItFor:true,
        whatYouWillLearn:true,
        cost: true,
        type: true,
        createdAt: true,
        category: true,
      },
    });
    res.json({ data: trainings });
  } catch (error) {
    console.log("🚀 ~ getTrainings ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching training details",
    });
  }
};

export const getTraining: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const studentAuth = req.auth?.["STUDENT"];
    const { trainingId: trainingIdUnsafe } = req.params;
    const trainingId = z.string().uuid().safeParse(trainingIdUnsafe);
    if (!trainingId.success) {
      res.status(400).json({
        error: "Invalid training ID",
      });
      return;
    }

    const training = await db.query.trainingTable.findFirst({
      with: {
        instructor: {
          columns: {
            firstName: true,
            lastName: true,
            institutionName: true,
          },
        },
        lessons: true,
        enrolments: {
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.trainingId, trainingId.data),
              studentAuth
                ? operators.eq(fields.userId, studentAuth?.id)
                : sql`false`,
            );
          },
          limit: 1,
          with: {
            transactions: {
              columns: {
                amount: true,
                status: true,
                txnNo: true,
              },
            },
          },
        },
        ratings: {
          columns: {
            rating: true,
            feedback: true,
            completedOn: true,
          },
          where(fields, operators) {
            return studentAuth
              ? operators.eq(fields.userId, studentAuth.id)
              : sql`false`;
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.id, trainingId.data);
      },
    });

    if (!training) {
      res.status(404).json({
        error: "Could not find such course!",
      });
      return;
    }

    // Check if user is enrolled by verifying successful payment
    const isEnrolled =
      training?.enrolments?.[0]?.transactions?.some(
        (transaction) =>
          Number(transaction.amount) === Number(training.cost) &&
          transaction.status === "success",
      ) ?? false;

    // Create response object with proper fields
    const responseData = {
      id: training.id,
      title: training.title,
      coverImg: training.coverImg,
      startDate: training.startDate,
      endDate: training.endDate,
      description: training.description,
      location: training.location,
      cost: training.cost,
      createdAt: training.createdAt,
      type: training.type,
      courseType: training.courseType,
      whoIsItFor: training.whoIsItFor,
      whatYouWillLearn: training.whatYouWillLearn,
      category: training.category,
      instructor: training.instructor,
      enrolments: training.enrolments,
      ratings: training.ratings,
      isEnrolled,
      displayFeedback: training?.endDate
        ? new Date(training?.endDate) < new Date()
          ? true
          : false
        : false,
      // Only include link if user is enrolled
      ...( training.link && { link: training.link }),
      // Only include lessons if user is enrolled, and filter by date
      lessons:  (training.lessons)
       
    };
    console.log("🚀 ~ getTraining ~ responseData:", responseData);
    res.json({
      data: responseData,
    });
  } catch (error) {
    console.log("🚀 ~ getTraining ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching training details",
    });
  }
};

export const captureFeedback: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { trainingId: trainingIdUnsafe } = req.params;
    const trainingId = z.string().uuid().safeParse(trainingIdUnsafe);
    if (!trainingId.success) {
      res.status(400).json({
        error: "Invalid training ID",
      });
      return;
    }
    const studentAuth = req.auth?.["STUDENT"];
    if (!studentAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const feedbackParsed = studentTrainingFeedbackSchema.safeParse(req.body);
    if (!feedbackParsed.success) {
      res.status(400).json(createValidationError(feedbackParsed));
      return;
    }
    await db.insert(trainingRatingTable).values({
      rating: feedbackParsed.data.rating,
      feedback: feedbackParsed.data.feedback,
      userId: studentAuth.id,
      trainingId: trainingId.data,
      completedOn: new Date(),
    });
    res.json({ message: "Feedback was shared successfully!" });
  } catch (error) {
    console.log("🚀 ~ captureFeedback ~ error:", error);
    res.status(500).json({
      error: "Server error in saving feedback",
    });
  }
};

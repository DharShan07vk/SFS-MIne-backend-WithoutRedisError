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

// export const getTraining: RequestHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const studentAuth = req.auth?.["STUDENT"];
//     const { trainingId: trainingIdUnsafe } = req.params;
//     const trainingId = z.string().uuid().safeParse(trainingIdUnsafe);
//     if (!trainingId.success) {
//       res.status(400).json({
//         error: "Invalid training ID",
//       });
//       return;
//     }

//     const training = await db.query.trainingTable.findFirst({
//       with: {
//         instructor: {
//           columns: {
//             firstName: true,
//             lastName: true,
//             institutionName: true,
//           },
//         },
//         enrolments: {
//           where(fields, operators) {
//             return operators.and(
//               operators.eq(fields.trainingId, trainingId.data),
//               studentAuth
//                 ? operators.eq(fields.userId, studentAuth?.id)
//                 : sql`false`,
//             );
//           },
//           limit: 1,
//           with: {
//             transactions: {
//               columns: {
//                 amount: true,
//                 status: true,
//                 txnNo: true,
//               },
//             },
//           },
//         },
//         ratings: {
//           columns: {
//             rating: true,
//             feedback: true,
//             completedOn: true,
//           },
//           where(fields, operators) {
//             return studentAuth
//               ? operators.eq(fields.userId, studentAuth.id)
//               : sql`false`;
//           },
//         },
//         lessons: true,
//       },
//       where(fields, operators) {
//         return operators.eq(fields.id, trainingId.data);
//       },
//       columns: {
//         id: true,
//         title: true,
//         coverImg: true,
//         startDate: true,
//         endDate: true,
//         description: true,
//         location: true,
//         cost: true,
//         createdAt: true,
//         type: true,
//         link: studentAuth?.id ? true : false,
//       },
//     });
//     if (!training) {
//       res.status(404).json({
//         error: "Could not find such course!",
//       });
//       return;
//     }
//     const isEnrolled =
//       training?.enrolments?.[0]?.transactions?.some(
//         (d) =>
//           Number(d.amount) === Number(training.cost) && d.status === "success",
//       ) ?? false;
//     // @ts-expect-error nee mooditu iru pa
//     !isEnrolled && delete training?.link;
//     res.json({
//       data: {
//         ...training,
//         isEnrolled,
//         displayFeedback: training?.endDate
//           ? new Date(training?.endDate) < new Date()
//             ? true
//             : false
//           : false,
//         lessons: isEnrolled
//           ? (training.lessons?.filter((lesson) =>
//               lesson.lastDate ? new Date(lesson.lastDate) < new Date() : true,
//             ) ?? [])
//           : undefined,
//       },
//     });
//   } catch (error) {
//     console.log("🚀 ~ getTrainings ~ error:", error);
//     res.status(500).json({
//       error: "Server error in fetching training details",
//     });
//   }
// };

export const getTraining: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const studentAuth = req.auth?.["STUDENT"];
    if (!studentAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
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
            mobile: true,
            email: true,
          },
          with: {
            address: true,
          },
        },
        lessons: true,
        ratings: true,
        enrolments: {
          columns: {
            id: true,
            completedOn: true,
            createdAt: true,
            certificate: true,
            paidOn: true,
          },
          with: {
            user: {
              columns: {
                firstName: true,
                lastName: true,
                mobile: true,
                email: true,
                id: true,
              },
            },
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.id, trainingId.data);
      },
    });
    res.json({ data: training ?? {} });
  } catch (error) {
    console.log("🚀 ~ getTrainings ~ error:", error);
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

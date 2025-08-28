import { Request, RequestHandler, Response } from "express";
import { INVALID_SESSION_MSG } from "../../utils/constants";
import { db } from "../../db/connection";
import { z } from "zod";
import { createValidationError } from "../../utils/validation";
import { trainingTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { approveTrainingSchema } from "./validation";

export const getTrainings: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const partnerAuth = req.auth["ADMIN"];
    if (!partnerAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const trainings = await db.query.trainingTable.findMany({
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
        enrolments: {
          columns: {
            id: true,
          },
        },
      },
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt);
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
    const adminAuth = req.auth["ADMIN"];
    if (!adminAuth) {
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

export const approveTraining: RequestHandler = async (
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
    const { trainingId: trainingIdUnsafe } = req.params;
    const trainingId = z.string().uuid().safeParse(trainingIdUnsafe);
    if (!trainingId.success) {
      res.status(400).json({
        error: "Invalid training ID",
      });
      return;
    }
    const decision = approveTrainingSchema.safeParse(req.body);
    if (!decision.success) {
      res.status(400).json({
        errors: createValidationError(decision),
      });
      return;
    }
    if (decision.data.decision === "approve") {
      await db
        .update(trainingTable)
        .set({
          startDate: decision.data.startDate,
          endDate: decision.data.endDate,
          approvedBy: adminAuth.id,
          cut: decision.data.cut,
        })
        .where(eq(trainingTable.id, trainingId.data));
    } else if (decision.data.decision === "deny") {
      await db
        .update(trainingTable)
        .set({
          approvedBy: null,
        })
        .where(eq(trainingTable.id, trainingId.data));
    }
    res.json({
      message:
        decision.data.decision === "approve"
          ? "Training is approved!"
          : "Training approval was rejected ",
    });
  } catch (error) {
    console.log("🚀 ~ approveTraining ~ error:", error);
    res.status(500).json({
      error: "Server error in approving training",
    });
  }
};

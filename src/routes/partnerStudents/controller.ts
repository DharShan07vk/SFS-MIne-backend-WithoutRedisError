import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
import { INVALID_SESSION_MSG } from "../../utils/constants";
import {
  trainingEnrolmentTable,
  trainingTable,
  userTable,
} from "../../db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export const getStudents: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const partnerAuth = req.auth?.["PARTNER"];
    if (!partnerAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const trainingIds = await db
      .select({ trainingId: trainingTable.id })
      .from(trainingTable)
      .where(eq(trainingTable.createdBy, partnerAuth.id));
    if (trainingIds.length === 0) {
      res.json({ data: [] });
      return;
    }
    const students = await db
      .select({
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
        id: userTable.id,
      })
      .from(trainingEnrolmentTable)
      .where(
        inArray(
          trainingEnrolmentTable.trainingId,
          trainingIds?.length !== 0
            ? trainingIds.map((tra) => tra.trainingId)
            : sql`false`,
        ),
      )
      .leftJoin(userTable, eq(trainingEnrolmentTable.userId, userTable.id))
      .groupBy(
        trainingEnrolmentTable.userId,
        userTable.firstName,
        userTable.lastName,
        userTable.email,
        userTable.id,
      );
    res.json({ data: students });
  } catch (error) {
    console.log("🚀 ~ getStudents ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching student details",
    });
  }
};

import { Request, RequestHandler, Response } from "express";
import { INVALID_SESSION_MSG } from "../../utils/constants";
import { db } from "../../db/connection";
import { z } from "zod";

export const getAdminStudents: RequestHandler = async (
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
    const students = await db.query.userTable.findMany({
      columns: {
        hash: false,
        salt: false,
        createdAt: false,
        updatedAt: false,
      },
    });
    res.json({ data: students });
  } catch (error) {
    console.log("🚀 ~ getAdminStudents ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching student details",
    });
  }
};

export const getAdminStudent: RequestHandler = async (
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
    const { studentId: studentIdUnsafe } = req.params;
    const studentId = z.string().uuid().safeParse(studentIdUnsafe);
    if (!studentId.success) {
      res.status(400).json({
        error: "Invalid student ID",
      });
      return;
    }
    const student = await db.query.userTable.findFirst({
      columns: {
        hash: false,
        salt: false,
        createdAt: false,
        updatedAt: false,
      },
      with: {
        enrolments: {
          with: {
            training: true,
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.id, studentId.data);
      },
    });
    res.json({ data: student ?? {} });
  } catch (error) {
    console.log("🚀 ~ getAdminStudents ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching student details",
    });
  }
};

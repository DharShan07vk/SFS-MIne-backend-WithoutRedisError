import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
import { INVALID_SESSION_MSG } from "../../utils/constants";

export const getPsychologyTrainings: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  // try {
  //   const partnerAuth = req.auth["ADMIN"];
  //   if (!partnerAuth) {
  //     res.status(401).json({
  //       error: INVALID_SESSION_MSG,
  //     });
  //     return;
  //   }
  //   const psychologyTrainings = await db.query.psychologyTrainingTable.findMany(
  //     {
  //       with: {
  //         transactions: true,
  //       },
  //       orderBy(fields, operators) {
  //         return operators.desc(fields.createdAt);
  //       },
  //     },
  //   );

  //   res.json({ data: psychologyTrainings });
  // } catch (error) {
  //   console.log("🚀 ~ getPsychologyTrainings ~ error:", error);
  //   res.status(500).json({
  //     error: "Server error in fetching psychology training details",
  //   });
  // }
  try {
    const partnerAuth = req.auth["ADMIN"];
    if (!partnerAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const psychologyTrainings = await db.query.psychologyTrainingTable.findMany({
      with: {
        transactions: {
          with: {
            transaction: true,
          },
          limit: 1,
          orderBy(fields, operators) {
            return operators.desc(fields.updatedAt);
          },
        },
      },
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt);
      },
    });

    res.json({ data: psychologyTrainings });
  } catch (error) {
    console.log("🚀 ~ getPsychologyTrainings ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching psychology training details",
    });
  }
};

export const getCareerCounselling: RequestHandler = async (
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
    const careerCounselling = await db.query.careerCounsellingTable.findMany({
      with: {
        transactions: {
          with: {
            transaction: true,
          },
          limit: 1,
          orderBy(fields, operators) {
            return operators.desc(fields.updatedAt);
          },
        },
      },
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt);
      },
    });

    res.json({ data: careerCounselling });
  } catch (error) {
    console.log("🚀 ~ getCareerCounselling ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching career counselling details",
    });
  }
};

export const getCAApplications: RequestHandler = async (
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
    const caApplications = await db.query.campusAmbassadorTable.findMany({
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt);
      },
    });

    res.json({ data: caApplications });
  } catch (error) {
    console.log("🚀 ~ getCAApplications ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching campus ambassador application details",
    });
  }
};

export const getInstitutionRegistrations: RequestHandler = async (
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
    const insitutionRegistrations =
      await db.query.institutionPlanTable.findMany({
        with: {
          address: true,
          transactions: {
            with: {
              transaction: true,
            },
          },
        },
      });

    res.json({ data: insitutionRegistrations });
  } catch (error) {
    console.log("🚀 ~ getInstitutionRegistrations ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching campus ambassador application details",
    });
  }
};

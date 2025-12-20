// import { Request, RequestHandler, Response } from "express";
// import { db } from "../../db/connection";
// import { eq, inArray, sql } from "drizzle-orm";
// import {
//   accountTable,
//   addressTable,
//   instructorTable,
//   trainingEnrolmentTable,
//   trainingTable,
// } from "../../db/schema";
// import { INVALID_SESSION_MSG } from "../../utils/constants";
// import { PartnerPayoutEligibilityStatus } from "../../utils/types";
// import { accountSchema, partnerProfileSchema } from "./validation";
// import { createValidationError } from "../../utils/validation";
// import { razorpay } from "../../razporpay";
// import { RazorpayError } from "../../utils/types";

// export const getHomeStatistics: RequestHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const partnerAuth = req.auth["PARTNER"];
//     if (!partnerAuth) {
//       res.status(401).json({
//         error: INVALID_SESSION_MSG,
//       });
//       return;
//     }
//     const trainingIds = await db
//       .select({ trainingId: trainingTable.id })
//       .from(trainingTable)
//       .where(eq(trainingTable.createdBy, partnerAuth.id));
//     const [[{ studentsCount }], accounts] = await Promise.all([
//       db
//         .select({
//           studentsCount: sql`COUNT(distinct ${trainingEnrolmentTable.userId})::int`,
//         })
//         .from(trainingEnrolmentTable)
//         .where(
//           trainingIds?.length !== 0
//             ? inArray(
//                 trainingEnrolmentTable.trainingId,
//                 trainingIds.map((tra) => tra.trainingId),
//               )
//             : sql`false`,
//         ),
//       db.query.accountTable.findFirst({
//         where(fields, operators) {
//           return operators.eq(fields.partnerId, partnerAuth.id);
//         },
//       }),
//     ]);
//     let payoutEligibility: PartnerPayoutEligibilityStatus;
//     if (!accounts) {
//       payoutEligibility = "no-data";
//     } else if (
//       accounts.rzpyContactId &&
//       !(accounts.rzpyVPAId || accounts.rzpyCardId || accounts.rzpyBankAcctId)
//     ) {
//       payoutEligibility = "pending-details";
//     } else if (
//       (accounts.rzpyBankAcctId && !accounts.bankAccVerifiedOn) ||
//       (accounts.rzpyCardId && !accounts.cardVerifiedOn) ||
//       (accounts.rzpyVPAId && !accounts.VPAVerifiedOn)
//     ) {
//       payoutEligibility = "pending-approval";
//     } else {
//       payoutEligibility = "approved";
//     }
//     res.json({
//       data: {
//         studentsCount,
//         trainingsCount: trainingIds.length,
//         payoutEligibility,
//       },
//     });
//   } catch (error) {
//     console.log("🚀 ~ getHomeStatistics ~ error:", error);
//     res.status(500).json({
//       error: "Server error in fetching statistics",
//     });
//   }
// };

// export const getProfileDetails: RequestHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const partnerAuth = req.auth["PARTNER"];
//     if (!partnerAuth) {
//       res.status(401).json({
//         error: INVALID_SESSION_MSG,
//       });
//       return;
//     }
//     const partner = await db.query.instructorTable.findFirst({
//       with: {
//         account: true,
//         address: true,
//       },
//       columns: {
//         hash: false,
//         salt: false,
//         updatedAt: false,
//         approvedBy: false,
//       },
//       where(fields, operators) {
//         return operators.eq(fields.id, partnerAuth.id);
//       },
//     });
//     if (!partner) {
//       res.status(404).json({
//         error: "Partner details could not be found!",
//       });
//       return;
//     }
//     res.json({ data: partner });
//   } catch (error) {
//     console.log("🚀 ~ getProfileDetails ~ error:", error);
//     res.status(500).json({
//       error: "Server error in getting profile details",
//     });
//   }
// };

// export const saveAccountDetails: RequestHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const partnerAuth = req.auth["PARTNER"];
//     if (!partnerAuth) {
//       res.status(401).json({
//         error: INVALID_SESSION_MSG,
//       });
//       return;
//     }
//     const accountDataParsed = accountSchema.safeParse(req.body);
//     if (!accountDataParsed.success) {
//       res.status(400).json({
//         errors: createValidationError(accountDataParsed),
//       });
//       return;
//     }
//     const partner = await db.query.instructorTable.findFirst({
//       where(fields, operators) {
//         return operators.eq(fields.id, partnerAuth.id);
//       },
//       with: {
//         account: true,
//       },
//     });
//     if (!partner) {
//       res.status(404).json({
//         error: "Partner details could not be found!",
//       });
//       return;
//     }
//     if (!partner.account) {
//       const contact = await razorpay.customers.create({
//         contact: partner.mobile,
//         email: partner.email,
//         name: `${partner.firstName} ${partner.lastName}`,
//         fail_existing: 0,
//       });
//       let fundAcct;
//       if ("bank_account" in accountDataParsed.data) {
//         fundAcct = await razorpay.fundAccount.create({
//           account_type: "bank_account",
//           customer_id: contact.id,
//           bank_account: {
//             account_number: accountDataParsed.data.bank_account.account_number,
//             ifsc: accountDataParsed.data.bank_account.ifsc,
//             name: accountDataParsed.data.bank_account.name,
//           },
//         });
//       }
//       await db.insert(accountTable).values({
//         partnerId: partnerAuth.id,
//         rzpyContactId: contact.id,
//         rzpyBankAcctId: fundAcct?.id,
//       });
//     } else {
//       let fundAcct;
//       if ("bank_account" in accountDataParsed.data) {
//         fundAcct = await razorpay.fundAccount.create({
//           account_type: "bank_account",
//           customer_id: partner.account.rzpyContactId!,
//           bank_account: {
//             account_number: accountDataParsed.data.bank_account.account_number,
//             ifsc: accountDataParsed.data.bank_account.ifsc,
//             name: accountDataParsed.data.bank_account.name,
//           },
//         });
//       }
//       await db
//         .update(accountTable)
//         .set({
//           rzpyBankAcctId: fundAcct?.id,
//         })
//         .where(eq(accountTable.partnerId, partnerAuth.id));
//     }
//     res.json({ message: "Account details submission successful!" });
//   } catch (error) {
//     console.log("🚀 ~ saveAccountDetails ~ error:", error);
//     if (error instanceof RazorpayError) {
//       res
//         .status(Number(error.statusCode))
//         .json({ error: error.error.description });
//       return;
//     }
//     res.status(500).json({
//       error: "Server error in saving account details",
//     });
//   }
// };

// export const savePartnerProfile: RequestHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const partnerAuth = req.auth["PARTNER"];
//     if (!partnerAuth) {
//       res.status(401).json({
//         error: INVALID_SESSION_MSG,
//       });
//       return;
//     }
//     const profileDataParsed = partnerProfileSchema.safeParse(req.body);
//     if (!profileDataParsed.success) {
//       res
//         .status(400)
//         .json({ errors: createValidationError(profileDataParsed) });
//       return;
//     }
//     const instructor = await db.query.instructorTable.findFirst({
//       where(fields, operators) {
//         return operators.eq(fields.id, partnerAuth.id);
//       },
//     });
//     if (!instructor) {
//       res.status(404).json({ error: "Could not find partner details" });
//       return;
//     }
//     await db.transaction(async (tx) => {
//       await tx
//         .update(addressTable)
//         .set({
//           city: profileDataParsed.data.city,
//           state: profileDataParsed.data.state,
//           pincode: profileDataParsed.data.pincode,
//         })
//         .where(eq(addressTable.id, instructor.addressId!));
//       await tx
//         .update(instructorTable)
//         .set({
//           email: profileDataParsed.data.email,
//           firstName: profileDataParsed.data.firstName,
//           lastName: profileDataParsed.data.lastName ?? null,
//           mobile: profileDataParsed.data.phone,
//         })
//         .where(eq(instructorTable.id, partnerAuth.id));
//     });
//     res.json({ message: "Profile details saved successfully!" });
//   } catch (error) {
//     console.log("🚀 ~ saveUserProfile ~ error:", error);
//     res.status(500).json({
//       error: "Server error in saving user profile",
//     });
//   }
// };


import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
import { eq, inArray, sql } from "drizzle-orm";
import {
  accountTable,
  addressTable,
  instructorTable,
  trainingEnrolmentTable,
  trainingTable,
} from "../../db/schema";
import { INVALID_SESSION_MSG } from "../../utils/constants";
import { PartnerPayoutEligibilityStatus } from "../../utils/types";
import { accountSchema, partnerProfileSchema } from "./validation";
import { createValidationError } from "../../utils/validation";
import { razorpay } from "../../razporpay";
import { RazorpayError } from "../../utils/types";
import { supabase, SUPABASE_PROJECT_URL } from "../../supabase";
import { nanoid } from "nanoid";

export const getHomeStatistics: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const partnerAuth = req.auth["PARTNER"];
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
    const [[{ studentsCount }], accounts] = await Promise.all([
      db
        .select({
          studentsCount: sql`COUNT(distinct ${trainingEnrolmentTable.userId})::int`,
        })
        .from(trainingEnrolmentTable)
        .where(
          trainingIds?.length !== 0
            ? inArray(
                trainingEnrolmentTable.trainingId,
                trainingIds.map((tra) => tra.trainingId),
              )
            : sql`false`,
        ),
      db.query.accountTable.findFirst({
        where(fields, operators) {
          return operators.eq(fields.partnerId, partnerAuth.id);
        },
      }),
    ]);
    let payoutEligibility: PartnerPayoutEligibilityStatus;
    if (!accounts) {
      payoutEligibility = "no-data";
    } else if (
      accounts.rzpyContactId &&
      !(accounts.rzpyVPAId || accounts.rzpyCardId || accounts.rzpyBankAcctId)
    ) {
      payoutEligibility = "pending-details";
    } else if (
      (accounts.rzpyBankAcctId && !accounts.bankAccVerifiedOn) ||
      (accounts.rzpyCardId && !accounts.cardVerifiedOn) ||
      (accounts.rzpyVPAId && !accounts.VPAVerifiedOn)
    ) {
      payoutEligibility = "pending-approval";
    } else {
      payoutEligibility = "approved";
    }
    res.json({
      data: {
        studentsCount,
        trainingsCount: trainingIds.length,
        payoutEligibility,
      },
    });
  } catch (error) {
    console.log("🚀 ~ getHomeStatistics ~ error:", error);
    res.status(500).json({
      error: "Server error in fetching statistics",
    });
  }
};

export const getProfileDetails: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const partnerAuth = req.auth["PARTNER"];
    if (!partnerAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const partner = await db.query.instructorTable.findFirst({
      with: {
        account: true,
        address: true,
      },
      columns: {
        hash: false,
        salt: false,
        updatedAt: false,
        approvedBy: false,
      },
      where(fields, operators) {
        return operators.eq(fields.id, partnerAuth.id);
      },
    });
    if (!partner) {
      res.status(404).json({
        error: "Partner details could not be found!",
      });
      return;
    }
    
    // Files are already full URLs from Supabase, no need to modify
    res.json({ data: partner });
  } catch (error) {
    console.log("🚀 ~ getProfileDetails ~ error:", error);
    res.status(500).json({
      error: "Server error in getting profile details",
    });
  }
};

export const saveAccountDetails: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const partnerAuth = req.auth["PARTNER"];
    if (!partnerAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    const accountDataParsed = accountSchema.safeParse(req.body);
    if (!accountDataParsed.success) {
      res.status(400).json({
        errors: createValidationError(accountDataParsed),
      });
      return;
    }
    const partner = await db.query.instructorTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, partnerAuth.id);
      },
      with: {
        account: true,
      },
    });
    if (!partner) {
      res.status(404).json({
        error: "Partner details could not be found!",
      });
      return;
    }
    if (!partner.account) {
      const contact = await razorpay.customers.create({
        contact: partner.mobile,
        email: partner.email,
        name: `${partner.firstName} ${partner.lastName}`,
        fail_existing: 0,
      });
      let fundAcct;
      if ("bank_account" in accountDataParsed.data) {
        fundAcct = await razorpay.fundAccount.create({
          account_type: "bank_account",
          customer_id: contact.id,
          bank_account: {
            account_number: accountDataParsed.data.bank_account.account_number,
            ifsc: accountDataParsed.data.bank_account.ifsc,
            name: accountDataParsed.data.bank_account.name,
          },
        });
      }
      await db.insert(accountTable).values({
        partnerId: partnerAuth.id,
        rzpyContactId: contact.id,
        rzpyBankAcctId: fundAcct?.id,
      });
    } else {
      let fundAcct;
      if ("bank_account" in accountDataParsed.data) {
        fundAcct = await razorpay.fundAccount.create({
          account_type: "bank_account",
          customer_id: partner.account.rzpyContactId!,
          bank_account: {
            account_number: accountDataParsed.data.bank_account.account_number,
            ifsc: accountDataParsed.data.bank_account.ifsc,
            name: accountDataParsed.data.bank_account.name,
          },
        });
      }
      await db
        .update(accountTable)
        .set({
          rzpyBankAcctId: fundAcct?.id,
        })
        .where(eq(accountTable.partnerId, partnerAuth.id));
    }
    res.json({ message: "Account details submission successful!" });
  } catch (error) {
    console.log("🚀 ~ saveAccountDetails ~ error:", error);
    if (error instanceof RazorpayError) {
      res
        .status(Number(error.statusCode))
        .json({ error: error.error.description });
      return;
    }
    res.status(500).json({
      error: "Server error in saving account details",
    });
  }
};

export const savePartnerProfile: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const partnerAuth = req.auth["PARTNER"];
    if (!partnerAuth) {
      res.status(401).json({
        error: INVALID_SESSION_MSG,
      });
      return;
    }
    
    const profileDataParsed = partnerProfileSchema.safeParse(req.body);
    console.log(profileDataParsed)
    if (!profileDataParsed.success) {
      res
        .status(400)
        .json({ errors: createValidationError(profileDataParsed) });
      return;
    }
    
    const instructor = await db.query.instructorTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, partnerAuth.id);
      },
    });
    if (!instructor) {
      res.status(404).json({ error: "Could not find partner details" });
      return;
    }
    
    // Handle file uploads to Supabase
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let logoURL = instructor.logo; // Keep existing URL if no new file
    let digitalSignURL = instructor.digitalSign; // Keep existing URL if no new file
    
    if (files?.logo?.[0]) {
      const logoFile = files.logo[0];
      const logoExtension = logoFile.originalname.split('.').pop() || 'jpg';
      
      // Delete old logo from Supabase if exists
      if (instructor.logo) {
        const oldLogoPath = instructor.logo.split('/').pop()?.split('?')[0];
        if (oldLogoPath) {
          await supabase.storage
            .from("s4s-media")
            .remove([`public/photos/${oldLogoPath}`]);
        }
      }
      
      const { data: logoData, error: logoError } = await supabase.storage
        .from("s4s-media")
        .upload(
          `public/photos/${partnerAuth.id}-logo-${Date.now()}.${logoExtension}`,
          logoFile.buffer,
          { 
            upsert: true,
            contentType: logoFile.mimetype 
          },
        );

      if (logoError) {
        console.log("Logo upload error:", logoError);
        res.status(500).json({
          error: "Something went wrong when uploading logo",
        });
        return;
      }

      logoURL = SUPABASE_PROJECT_URL + "/storage/v1/object/public/" + logoData.fullPath;
    }
    
    if (files?.digitalSign?.[0]) {
      const signFile = files.digitalSign[0];
      const signExtension = signFile.originalname.split('.').pop() || 'jpg';
      
      // Delete old digital signature from Supabase if exists
      if (instructor.digitalSign) {
        const oldSignPath = instructor.digitalSign.split('/').pop()?.split('?')[0];
        if (oldSignPath) {
          await supabase.storage
            .from("s4s-media")
            .remove([`public/photos/${oldSignPath}`]);
        }
      }
      
      const { data: signData, error: signError } = await supabase.storage
        .from("s4s-media")
        .upload(
          `public/photos/${partnerAuth.id}-signature-${Date.now()}.${signExtension}`,
          signFile.buffer,
          { 
            upsert: true,
            contentType: signFile.mimetype 
          },
        );

      if (signError) {
        console.log("Digital signature upload error:", signError);
        res.status(500).json({
          error: "Something went wrong when uploading digital signature",
        });
        return;
      }

      digitalSignURL = SUPABASE_PROJECT_URL + "/storage/v1/object/public/" + signData.fullPath;
    }
    
    await db.transaction(async (tx) => {
      // Update address if addressId exists
      if (instructor.addressId) {
        await tx
          .update(addressTable)
          .set({
            city: profileDataParsed.data.city,
            state: profileDataParsed.data.state,
            pincode: profileDataParsed.data.pincode,
          })
          .where(eq(addressTable.id, instructor.addressId!));
      }
      
      // Prepare instructor update data
      const updateData: any = {
        email: profileDataParsed.data.email,
        firstName: profileDataParsed.data.firstName,
        lastName: profileDataParsed.data.lastName ?? null,
        mobile: profileDataParsed.data.phone,
        logo: logoURL,
        digitalSign: digitalSignURL,
      };
      
      // Add company fields if they exist in validation schema
      if ('institutionName' in profileDataParsed.data) {
        updateData.institutionName = profileDataParsed.data.institutionName;
      }
      if ('gst' in profileDataParsed.data) {
        updateData.gst = profileDataParsed.data.gst;
      }
      if ('topics' in profileDataParsed.data) {
        updateData.topics = profileDataParsed.data.topics;
      }
      
      await tx
        .update(instructorTable)
        .set(updateData)
        .where(eq(instructorTable.id, partnerAuth.id));
    });
    
    res.json({ message: "Profile details saved successfully!" });
  } catch (error) {
    console.log("🚀 ~ savePartnerProfile ~ error:", error);
    res.status(500).json({
      error: "Server error in saving user profile",
    });
  }
};

import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
import { newCourseFormSchema } from "./validation";
import { createValidationError, slugify } from "../../utils/validation";
import { trainingLessonTable, trainingTable } from "../../db/schema";
import { INVALID_SESSION_MSG } from "../../utils/constants";
import { z } from "zod";
import { supabase, SUPABASE_PROJECT_URL } from "../../supabase";
import { pdfQ } from "../../redis";
import { nanoid } from "nanoid";
import cloudinary, {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../../cloudinary";
import { trainingEnrolmentTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { generateCertificate } from "../../utils/pdf";

// Add this helper function at the top of the file
const formatDateToString = (date: Date | null): string => {
  if (!date) return new Date().toISOString();
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
};

export const getTrainings: RequestHandler = async (
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
    const trainings = await db.query.trainingTable.findMany({
      with: {
        instructor: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        enrolments: {
          columns: {
            id: true,
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.createdBy, partnerAuth.id);
      },
      orderBy(fields, operators) {
        return operators.desc(fields.updatedAt);
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
    const partnerAuth = req.auth["PARTNER"];
    if (!partnerAuth) {
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
        enrolments: {
          columns: {
            id: true,
            paidOn: true,
            certificate: true,
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
        lessons: true,
        ratings: {
          columns: {
            feedback: true,
            rating: true,
            userId: true,
          },
        },
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.createdBy, partnerAuth.id),
          operators.eq(fields.id, trainingId.data),
        );
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

export const createTraining: RequestHandler = async (
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
    const rawData = req.body;
    
    console.log("🚀 ~ createTraining ~ rawData:", rawData);

    const courseCreationParsed = newCourseFormSchema.safeParse({
      ...rawData,
      cost: Number(rawData.cost),
      cover:
        !req.file || !req.file.buffer
          ? null
          : new File([req.file!.buffer], req.file!.filename, {
              type: req.file!.mimetype,
            }),
    });
    
    console.log("🚀 ~ createTraining ~ parsed:", courseCreationParsed);

    if (!courseCreationParsed.success) {
      console.log("🚀 ~ createTraining ~ errors:", courseCreationParsed.error);
      res.status(400).json({
        errors: createValidationError(courseCreationParsed),
      });
      return;
    }

    const instructor = await db.query.instructorTable.findFirst({
      where(fields, ops) {
        return ops.and(
          ops.eq(fields.id, partnerAuth.id),
          ops.isNotNull(fields.approvedBy),
        );
      },
    });

    if (!instructor) {
      res.status(403).json({
        error: "You have not been approved and cannot create course yet!",
      });
      return;
    }

    const { data } = courseCreationParsed;
    
    let coverImageURL = null;
    if (data.cover) {
      const { data: uploadResult, error } = await supabase.storage
        .from("s4s-media")
        .upload(`public/photos/${slugify(data.title)}.jpg`, data.cover, {
          upsert: true,
        });

      if (error) {
        console.log("🚀 ~ createTraining ~ supabase upload error:", error);
        res.status(500).json({
          error: "Server error in uploading file!",
        });
        return;
      }
      coverImageURL = SUPABASE_PROJECT_URL + "/storage/v1/object/public/" + uploadResult.fullPath;
    }

    await db.transaction(async (tx) => {
      const [training] = await tx
        .insert(trainingTable)
        .values({
          title: data.title,
          cost: data.cost.toFixed(2),
          createdBy: partnerAuth.id,
          description: data.description,
          endDate: data.endDate,
          startDate: data.startDate,
          location: data.location || null,
          type: data.type,
          link: data.trainingLink || null,
          courseType: data.course_type,
          whoIsItFor: data.whoIsItFor,
          whatYouWillLearn: data.whatYouWillLearn,
          coverImg: coverImageURL,
          category: data.category,
        })
        .returning();

      // if (data.type !== "OFFLINE" && data.lessons && data.lessons.length > 0) {
      //   await tx.insert(trainingLessonTable).values(
      //     data.lessons.map((lesson, index) => {
      //       const currDate = new Date(data.startDate);
      //       currDate.setDate(currDate.getDate() + index);
            
      //       return {
      //         type: lesson.type,
      //         title: lesson.title,
      //         content: lesson.type === "ONLINE" ? lesson.content : undefined,
      //         video: lesson.type === "ONLINE" ? lesson.video : undefined,
      //         location: lesson.type === "OFFLINE" ? lesson.location : undefined,
      //         trainingId: training.id,
      //         lastDate: currDate,
      //       };
      //     }),
      //   );
      // }
    });
    
    res.json({ message: "Course module created successfully!" });
  } catch (error) {
    console.log("🚀 ~ createTraining ~ error:", error);
    res.status(500).json({
      error: "Server error in creating training course",
    });
  }
};

// export const generateCertificates: RequestHandler = async (
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
//     const { trainingId: trainingIdUnsafe } = req.params;
//     const trainingId = z.string().uuid().safeParse(trainingIdUnsafe);
//     if (!trainingId.success) {
//       res.status(400).json({
//         error: "Invalid training ID",
//       });
//       return;
//     }
//     const enrolmentIdsUnsafe = req.body;
//     const enrolmentIdsParsed = z
//       .array(z.string().uuid("Invalid IDs"))
//       .min(1, "Atleast one enrolment need to be selected")
//       .safeParse(enrolmentIdsUnsafe);
//     if (!enrolmentIdsParsed.success) {
//       res
//         .status(400)
//         .json({ errors: createValidationError(enrolmentIdsParsed) });
//       return;
//     }
    
//     const trainingEnrolments = await db.query.trainingTable.findFirst({
//       with: {
//         enrolments: {
//           columns: {
//             id: true,
//             paidOn: true,
//             certificate: true,
//             userId: true,
//           },
//           with: {
//             user: {
//               columns: {
//                 firstName: true,
//                 lastName: true,
//                 mobile: true,
//                 email: true,
//               },
//             },
//           },
//           where(fields, operators) {
//             return operators.inArray(fields.id, enrolmentIdsParsed.data);
//           },
//         },
//         ratings: {
//           columns: {
//             feedback: true,
//             rating: true,
//             userId: true,
//             completedOn: true,
//           },
//         },
//         instructor: {
//           columns: {
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//       where(fields, operators) {
//         return operators.and(
//           operators.eq(fields.createdBy, partnerAuth.id),
//           operators.eq(fields.id, trainingId.data),
//         );
//       },
//     });
    
//     if (!trainingEnrolments || !(trainingEnrolments.enrolments.length > 0)) {
//       res.status(404).json({
//         error: "Could not find such course or course has no enrolments!",
//       });
//       return;
//     }
    
//     if (
//       !trainingEnrolments.enrolments.every((enr) => {
//         const ratingByUser = trainingEnrolments.ratings.find(
//           (rat) => rat.userId === enr.userId,
//         );
//         return ratingByUser?.feedback && ratingByUser.rating;
//       })
//     ) {
//       res.status(403).json({
//         error:
//           "Not all selected enrolments have given rating and feedbacks! Please reselect appropriate candidates!",
//       });
//       return;
//     }

//     // Filter enrolments that don't have certificates yet
//     const enrolmentsToProcess = trainingEnrolments.enrolments.filter(
//       (enr) => !enr.certificate
//     );
    
//     if (enrolmentsToProcess.length === 0) {
//       res.status(400).json({
//         error: "All selected students already have certificates generated!",
//       });
//       return;
//     }

//     console.log(`🚀 Processing ${enrolmentsToProcess.length} certificates`);

//     // First, update database to show "generating" status
//     await Promise.all(
//       enrolmentsToProcess.map(async (enr) => {
//         await db
//           .update(trainingEnrolmentTable)
//           .set({ certificate: "generating" })
//           .where(eq(trainingEnrolmentTable.id, enr.id));
//       })
//     );

//     // Then add jobs to queue
//     const queueJobs = enrolmentsToProcess.map((enr) => {
//       const certificateId = nanoid(30);
//       const enrolmentId = enr.id;
//       const ratingByUser = trainingEnrolments.ratings.find(
//         (rat) => rat.userId === enr.userId,
//       )!;
      
//       console.log(`🚀 Adding certificate job for enrolment: ${enrolmentId}`);
      
//       return pdfQ.add(`certificate-${certificateId}`, {
//         name: enr.user?.firstName + " " + (enr.user?.lastName ?? ""),
//         courseName: trainingEnrolments.title,
//         completedOn: ratingByUser.completedOn!,
//         certificateId,
//         enrolmentId,
//         instructor:
//           trainingEnrolments.instructor?.firstName +
//           " " +
//           (trainingEnrolments.instructor?.lastName ?? ""),
//       });
//     });

//     await Promise.all(queueJobs);
    
//     console.log(`🚀 Successfully queued ${queueJobs.length} certificate jobs`);
    
//     res.json({
//       message: `Certificates are being generated for ${enrolmentsToProcess.length} students and will be available for download soon.`,
//     });
//     return;
//   } catch (error) {
//     console.log("🚀 ~ generateCertificates ~ error:", error);
//     res.status(500).json({
//       error: "Server error in generating certificates",
//     });
//   }
// };



// export const generateCertificates: RequestHandler = async (
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
//     const { trainingId: trainingIdUnsafe } = req.params;
//     const trainingId = z.string().uuid().safeParse(trainingIdUnsafe);
//     if (!trainingId.success) {
//       res.status(400).json({
//         error: "Invalid training ID",
//       });
//       return;
//     }
//     const enrolmentIdsUnsafe = req.body;
//     const enrolmentIdsParsed = z
//       .array(z.string().uuid("Invalid IDs"))
//       .min(1, "Atleast one enrolment need to be selected")
//       .safeParse(enrolmentIdsUnsafe);
//     if (!enrolmentIdsParsed.success) {
//       res
//         .status(400)
//         .json({ errors: createValidationError(enrolmentIdsParsed) });
//       return;
//     }
//     const trainingEnrolments = await db.query.trainingTable.findFirst({
//       with: {
//         enrolments: {
//           columns: {
//             id: true,
//             paidOn: true,
//             certificate: true,
//             userId: true,
//           },
//           with: {
//             user: {
//               columns: {
//                 firstName: true,
//                 lastName: true,
//                 mobile: true,
//                 email: true,
//               },
//             },
//           },
//           where(fields, operators) {
//             return operators.inArray(fields.id, enrolmentIdsParsed.data);
//           },
//         },
//         ratings: {
//           columns: {
//             feedback: true,
//             rating: true,
//             userId: true,
//             completedOn: true,
//           },
//         },
//         instructor: {
//           columns: {
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//       where(fields, operators) {
//         return operators.and(
//           operators.eq(fields.createdBy, partnerAuth.id),
//           operators.eq(fields.id, trainingId.data),
//         );
//       },
//     });
//     if (!trainingEnrolments || !(trainingEnrolments.enrolments.length > 0)) {
//       res.status(404).json({
//         error: "Could not find such course or course has no enrolments!",
//       });
//       return;
//     }
//     if (
//       !trainingEnrolments.enrolments.every((enr) => {
//         const ratingByUser = trainingEnrolments.ratings.find(
//           (rat) => rat.userId === enr.userId,
//         );
//         return ratingByUser?.feedback && ratingByUser.rating;
//       })
//     ) {
//       res.status(403).json({
//         error:
//           "Not all selected enrolments have given rating and feedbacks! Please reselect appropriate candidates!",
//       });
//       return;
//     }
//     await Promise.all(
//       trainingEnrolments.enrolments
//         .filter((enr) => !enr.certificate)
//         .map((enr) => {
//           const certificateId = nanoid(30);
//           const enrolmentId = enr.id;
//           const ratingByUser = trainingEnrolments.ratings.find(
//             (rat) => rat.userId === enr.userId,
//           )!;
//           console.log("yes");
//           return pdfQ.add(`certificate-${certificateId}`, {
//             name: enr.user?.firstName + " " + (enr.user?.lastName ?? ""),
//             courseName: trainingEnrolments.title,
//             completedOn: ratingByUser.completedOn!,
//             certificateId,
//             enrolmentId,
//             instructor:
//               trainingEnrolments.instructor?.firstName +
//               " " +
//               (trainingEnrolments.instructor?.lastName ?? ""),
//           });
//           return null;
//         }),
//     );
//     res.json({
//       message:
//         "Certificates are being generated and will be available for students to download",
//     });
//     return;
//   } catch (error) {
//     console.log("🚀 ~ generateCertificates ~ error:", error);
//     res.status(500).json({
//       error: "Server error in generating certificates",
//     });
//   }
// };

export const generateCertificates: RequestHandler = async (
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
    const { trainingId: trainingIdUnsafe } = req.params;
    const trainingId = z.string().uuid().safeParse(trainingIdUnsafe);
    if (!trainingId.success) {
      res.status(400).json({
        error: "Invalid training ID",
      });
      return;
    }
    const enrolmentIdsUnsafe = req.body;
    const enrolmentIdsParsed = z
      .array(z.string().uuid("Invalid IDs"))
      .min(1, "Atleast one enrolment need to be selected")
      .safeParse(enrolmentIdsUnsafe);
    if (!enrolmentIdsParsed.success) {
      res
        .status(400)
        .json({ errors: createValidationError(enrolmentIdsParsed) });
      return;
    }
    
    const trainingEnrolments = await db.query.trainingTable.findFirst({
      columns: {
        id: true,
        title: true,
        startDate: true,  // Add these fields
        endDate: true,    // Add these fields
      },
      with: {
        enrolments: {
          columns: {
            id: true,
            paidOn: true,
            certificate: true,
            userId: true,
          },
          with: {
            user: {
              columns: {
                firstName: true,
                lastName: true,
                mobile: true,
                email: true,
              },
            },
          },
          where(fields, operators) {
            return operators.inArray(fields.id, enrolmentIdsParsed.data);
          },
        },
        ratings: {
          columns: {
            feedback: true,
            rating: true,
            userId: true,
            completedOn: true,
          },
        },
        instructor: {
          columns: {
            firstName: true,
            lastName: true,
            logo: true, // Instructor logo URL
            digitalSign: true, // Digital signature URL
          },
        },
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.createdBy, partnerAuth.id),
          operators.eq(fields.id, trainingId.data),
        );
      },
    });
    
    if (!trainingEnrolments || !(trainingEnrolments.enrolments.length > 0)) {
      res.status(404).json({
        error: "Could not find such course or course has no enrolments!",
      });
      return;
    }
    
    if (
      !trainingEnrolments.enrolments.every((enr) => {
        const ratingByUser = trainingEnrolments.ratings.find(
          (rat) => rat.userId === enr.userId,
        );
        return ratingByUser?.feedback && ratingByUser.rating;
      })
    ) {
      res.status(403).json({
        error:
          "Not all selected enrolments have given rating and feedbacks! Please reselect appropriate candidates!",
      });
      return;
    }

    // Filter enrolments that don't have certificates yet
    const enrolmentsToProcess = trainingEnrolments.enrolments.filter(
      (enr) => !enr.certificate
    );
    
    if (enrolmentsToProcess.length === 0) {
      res.status(400).json({
        error: "All selected students already have certificates generated!",
      });
      return;
    }

    console.log(`🚀 Generating ${enrolmentsToProcess.length} certificates directly...`);

    // First, update database to show "generating" status
    await Promise.all(
      enrolmentsToProcess.map(async (enr) => {
        await db
          .update(trainingEnrolmentTable)
          .set({ certificate: "generating" })
          .where(eq(trainingEnrolmentTable.id, enr.id));
      })
    );

    // Generate certificates directly (no Redis)
    const results = await Promise.allSettled(
      enrolmentsToProcess.map(async (enr) => {
        const certificateId = nanoid(30);
        const ratingByUser = trainingEnrolments.ratings.find(
          (rat) => rat.userId === enr.userId,
        )!;
        
        const certificateData = {
          name: enr.user?.firstName + " " + (enr.user?.lastName ?? ""),
          courseName: trainingEnrolments.title,
          completedOn: formatDateToString(ratingByUser.completedOn), // Convert Date to string
          certificateId,
          enrolmentId: enr.id,
          instructor:
            trainingEnrolments.instructor?.firstName +
            " " +
            (trainingEnrolments.instructor?.lastName ?? ""),
          startDate: formatDateToString(trainingEnrolments.startDate), // Convert Date to string
          endDate: formatDateToString(trainingEnrolments.endDate),     // Convert Date to string
          digitalSignUrl: trainingEnrolments.instructor?.digitalSign || null,
          logo : trainingEnrolments.instructor?.logo || null,
        };
        
        console.log(`🚀 Generating certificate for: ${certificateData.name}`);
        console.log(`🚀 Course dates: ${certificateData.startDate} to ${certificateData.endDate}`);
        console.log(`🚀 Digital sign URL: ${certificateData.digitalSignUrl}`);
        console.log(`🚀 Logo URL: ${certificateData.logo}`);
        
        // Call your existing generateCertificate function directly
        const success = await generateCertificate(certificateData);
        
        if (!success) {
          // Reset certificate status on failure
          await db
            .update(trainingEnrolmentTable)
            .set({ certificate: null })
            .where(eq(trainingEnrolmentTable.id, enr.id));
          throw new Error(`Failed to generate certificate for ${certificateData.name}`);
        }
        
        return { success: true, name: certificateData.name };
      })
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      console.error(`❌ ${failed} certificates failed to generate`);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed certificate ${index + 1}:`, result.reason);
        }
      });
    }

    console.log(`✅ Successfully generated ${successful} certificates`);
    
    res.json({
      message: `Successfully generated ${successful} certificates${failed > 0 ? `. ${failed} failed.` : '.'}`,
      successful,
      failed,
    });
    return;
  } catch (error) {
    console.log("🚀 ~ generateCertificates ~ error:", error);
    res.status(500).json({
      error: "Server error in generating certificates",
    });
  }
};

export const generateUploadSignature: RequestHandler = async (
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
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: "signed_upload_demo",
        return_delete_token: true,
      },
      CLOUDINARY_API_SECRET!,
    );
    res.json({
      data: {
        signature,
        timestamp,
        cloudName: CLOUDINARY_CLOUD_NAME,
        apiKey: CLOUDINARY_API_KEY,
      },
    });
  } catch (error) {
    console.log("🚀 ~ generateUploadSignature ~ error:", error);
    res.status(500).json({
      error: "Server error in generating upload signature",
    });
  }
};

export const deleteAsset: RequestHandler = async (
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
    const publicId = req.body.public_id;
    await cloudinary.uploader.destroy(publicId, {}, (res) => {
      console.log(res);
    });
    res.json({ message: "Deleted successully!" });
  } catch (error) {
    console.log("🚀 ~ deleteAsset ~ error:", error);
    res.status(500).json({
      error: "Server error in deleting asset",
    });
  }
};

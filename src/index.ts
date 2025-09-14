import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { trainingEnrolmentTable } from "./db/schema";
import express, { Application, Request, Response } from "express";
import { db } from "./db/connection";
import adminAuthRouter from "./routes/adminAuth/route";
import adminPartnersRouter from "./routes/adminPartners/route";
import adminStudentsRouter from "./routes/adminStudents/route";
import adminTrainingRouter from "./routes/adminTrainings/route";
import authRouter from "./routes/auth/route";
import blogsRouter from "./routes/blog/route";
import partnerAuthRouter from "./routes/partnerAuth/route";
import partnerMiscRouter from "./routes/partnerMisc/route";
import partnerStudentsRouter from "./routes/partnerStudents/route";
import paymentRouter from "./routes/payments/route";
import studentTrainingRouter from "./routes/studentTraining/route";
import testRouter from "./routes/test/route";
import trainingRouter from "./routes/training/route";
import { Worker } from "bullmq";
import { CERT_QUEUE_NAME, PDFGenerationType} from "./redis";
import {redis} from "./redis"
import { generateCertificate } from "./utils/pdf";
import homeRouter from "./routes/home/route";
import otpRouter from "./routes/otp/route"

import enquiryRouter from "./routes/enquiry/route";
import adminApplicationsRouter from "./routes/adminEnquiry/route";

const app: Application = express();
const port = process.env.PORT || 8000;

// Special middleware for webhook that preserves raw body for signature verification
app.use("/payments/verify", express.raw({ 
  type: "application/json",
  limit: "50mb" // Increase limit if needed
}));

// Standard JSON middleware for all other routes
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin:  "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  optionsSuccessStatus: 200
};

console.log('CORS configuration:', corsOptions);

app.use(cors(corsOptions));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server");
});

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Test database connection
    const testQuery = await db.query.userTable.findFirst();
    res.json({
      status: "healthy",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: "connected",
      routes: {
        auth: "/auth/sign-in",
        health: "/health"
      }
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: process.env.NODE_ENV === 'development' ? error : "Database connection failed"
    });
  }
});

// Handle preflight requests
app.options("*", cors(corsOptions));

app.use("/auth", authRouter);
app.use("/trainings", studentTrainingRouter);

app.use("/partner/auth", partnerAuthRouter);
app.use("/partner/trainings", trainingRouter);
app.use("/partner/students", partnerStudentsRouter);
app.use("/partner/misc", partnerMiscRouter);

app.use("/admin/auth", adminAuthRouter);
app.use("/admin/students", adminStudentsRouter);
app.use("/admin/partners", adminPartnersRouter);
app.use("/admin/trainings", adminTrainingRouter);
app.use("/admin/applications", adminApplicationsRouter);

app.use("/blogs", blogsRouter);
app.use("/enquiry", enquiryRouter);
app.use("/payments", paymentRouter);
app.use("/home", homeRouter);

app.use("/otp", otpRouter);

app.use("/testing", testRouter);

// Catch-all route for debugging 404 errors
app.use("*", (req: Request, res: Response) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.log(`Headers:`, req.headers);
  console.log(`Body:`, req.body);
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      "GET /",
      "POST /auth/register",
      "POST /auth/sign-in", 
      "GET /auth/me",
      "GET /trainings/*",
      "POST /partner/auth/sign-in",
      "POST /admin/auth/sign-in",
      "GET /home/carousel",
      "POST /enquiry",
      "POST /payments/*"
    ]
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});


const worker = new Worker<PDFGenerationType>(
  CERT_QUEUE_NAME!,
  async (job) => {
    console.log(
      `🚀 Processing certificate for enrolment ID: ${job.data.enrolmentId}`,
    );
    try {
      const response = await generateCertificate(job.data);
      if (response) {
        console.log(`✅ PDF generation succeeded: ${job.data.enrolmentId}`);
        return { success: true, enrolmentId: job.data.enrolmentId };
      } else {
        console.error(`❌ PDF generation failed: ${job.data.enrolmentId}`);
        // Update database to show error state
        await db
          .update(trainingEnrolmentTable)
          .set({ certificate: null })
          .where(eq(trainingEnrolmentTable.id, job.data.enrolmentId));
        throw new Error(`PDF generation failed for ${job.data.enrolmentId}`);
      }
    } catch (error) {
      console.error(`💥 Error in PDF worker for ${job.data.enrolmentId}:`, error);
      // Reset certificate status on error
      await db
        .update(trainingEnrolmentTable)
        .set({ certificate: null })
        .where(eq(trainingEnrolmentTable.id, job.data.enrolmentId));
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2,
    lockDuration: 5 * 60 * 1000, // 5 minutes
  }
);



worker.on("error", (err) => {
  console.log("Connection error --- :", err.message);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully!`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

app.listen(port, () => {
  console.log(`Server is firing at http://localhost:${port}`);
});

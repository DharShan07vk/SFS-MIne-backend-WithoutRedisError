import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { Application, Request, Response } from "express";
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
//import {redis} from "./redis"
import { generateCertificate } from "./utils/pdf";
import homeRouter from "./routes/home/route";

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
app.use(cors(
    {origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server");
});

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

app.use("/testing", testRouter);

// const worker = new Worker<PDFGenerationType>(
//   CERT_QUEUE_NAME!,
//   async (job) => {
//     console.log(
//       `Processing certificate for enrolment ID: ${job.data.enrolmentId}`,
//     );
//     const response = await generateCertificate(job.data);
//     if (response) {
//       console.log(`✅PDF generation succeeded: ${job.data.enrolmentId}`);
//     } else {
//       console.error(`❌PDF generated failed: ${job.data.enrolmentId}`);
//     }
//   },
//   //{ connection: redis },
// );

// worker.on("error", (err) => {
//   console.log("Connection error:", err.message);
// });

// worker.on("completed", (job) => {
//   console.log(`Job ${job.id} completed successfully!`);
// });

// worker.on("failed", (job, err) => {
//   console.error(`Job ${job?.id} failed:`, err);
// });

app.listen(port, () => {
  console.log(`Server is firing at http://localhost:${port}`);
});

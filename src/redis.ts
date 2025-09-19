import { Queue } from "bullmq";
import Redis from "ioredis";
import { createClient } from "redis";

const REDIS_URI =
  process.env.REDIS_MODE === "local"
    ? process.env.REDIS_URI_LOCAL
    : process.env.REDIS_URI_PROD;

export const CERT_QUEUE_NAME = process.env.QUEUE_NAME_CERT;
export interface PDFGenerationType {
  name: string;
  courseName: string;
  completedOn: string;
  certificateId: string;
  enrolmentId: string;
  instructor: string;
  startDate: string;  // Add this
  endDate: string;    // Add this
  logo?: string | null; // Add this
  digitalSignUrl?: string | null;  // Add this
}

if (!REDIS_URI || !CERT_QUEUE_NAME) {
  throw new Error(
    "Redis connection could not be established! Invalid variables configuration",
  );
}

export const redis = new Redis(REDIS_URI, {
  maxRetriesPerRequest: null,
  retryStrategy() {
    return 10;
  },
  reconnectOnError: (err) =>
    err.message.includes("ECONNREFUSED") ? false : true,
  enableOfflineQueue: true,
});

export const redisClient = createClient({
   url: REDIS_URI,disableOfflineQueue: false,
});

export const pdfQ = new Queue<PDFGenerationType, boolean>(CERT_QUEUE_NAME, {
  connection: redis,
});

import "dotenv/config";
import type { RequestHandler } from "express";
import {
  sendOTP,
  sendOTPReset,
  sendCourseRegistrationEmail,
  sendMentalWellbeingEmail,
  sendCareerCounselingEmail,
  sendInstitutionPartnershipEmail,
  sendGeneralPaymentEmail,
} from "../src/routes/email/controller";

type JsonMap = Record<string, unknown>;

type EndpointSpec = {
  name: string;
  handler: RequestHandler;
  body: JsonMap;
};

function getArg(flag: string, fallback?: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function createMockRes() {
  let statusCode = 200;
  let payload: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: unknown) {
      payload = data;
      return res;
    },
  } as any;

  return { res, getStatus: () => statusCode, getPayload: () => payload };
}

async function runHandler(name: string, handler: RequestHandler, body: JsonMap) {
  const req = { body } as any;
  const { res, getStatus, getPayload } = createMockRes();

  await handler(req, res, () => undefined);

  const status = getStatus();
  const payload = getPayload();
  if (status >= 400) {
    throw new Error(`HTTP ${status} - ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function main() {
  const email = getArg("--email", "chidambaramb2@gmail.com");
  const name = getArg("--name", "barath");

  const now = new Date();
  const inDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const endpoints: EndpointSpec[] = [
    {
      name: "Institution OTP",
      handler: sendOTP,
      body: {
        email,
        mobile: "9999999999",
        institutionName: "SFS Demo Institute",
      },
    },
    {
      name: "Password Reset OTP",
      handler: sendOTPReset,
      body: {
        email,
      },
    },
    {
      name: "Course Registration",
      handler: sendCourseRegistrationEmail,
      body: {
        userEmail: email,
        userName: name,
        courseName: "STEM Foundation 101",
        amount: "1499",
        currency: "INR",
        paymentId: "pay_test_001",
        courseDuration: "6 weeks",
        startDate: inDays(7),
        phoneNumber: "9999999999",
      },
    },
    {
      name: "Mental Wellbeing",
      handler: sendMentalWellbeingEmail,
      body: {
        userEmail: email,
        userName: name,
        sessionType: "Mindfulness Starter",
        amount: "999",
        currency: "INR",
        paymentId: "pay_test_002",
        sessionDate: inDays(3),
      },
    },
    {
      name: "Career Counseling",
      handler: sendCareerCounselingEmail,
      body: {
        userEmail: email,
        userName: name,
        counselingType: "Career Switch",
        amount: "1299",
        currency: "INR",
        paymentId: "pay_test_003",
        sessionDate: inDays(5),
      },
    },
    {
      name: "Institution Partnership",
      handler: sendInstitutionPartnershipEmail,
      body: {
        userEmail: email,
        userName: name,
        institutionName: "SFS Demo Institute",
        serviceType: "Workshop",
        amount: "25000",
        currency: "INR",
        paymentId: "pay_test_004",
        sessionDate: inDays(10),
      },
    },
    {
      name: "General Payment",
      handler: sendGeneralPaymentEmail,
      body: {
        userEmail: email,
        userName: name,
        amount: "499",
        currency: "INR",
        paymentId: "pay_test_005",
        description: "General payment test",
      },
    },
  ];

  console.log(`Sending ${endpoints.length} test emails to ${email} using local handlers`);

  for (const endpoint of endpoints) {
    try {
      const result = await runHandler(endpoint.name, endpoint.handler, endpoint.body);
      console.log(`[OK] ${endpoint.name}:`, result);
    } catch (error) {
      console.error(`[FAIL] ${endpoint.name}:`, error);
    }
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});

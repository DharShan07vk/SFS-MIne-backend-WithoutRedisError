import { AuthCookieType, authRoleEnum } from "./validation";

export type AuthRoles = Partial<{
  [K in typeof authRoleEnum._type]: AuthCookieType & {
    role: K;
    isApproved: K extends "PARTNER" ? boolean : unknown;
  };
}>;

export type PartnerPayoutEligibilityStatus =
  | "approved"
  | "pending-details"
  | "pending-approval"
  | "failed"
  | "no-data";

export class RazorpayError extends Error {
  statusCode: string | number;
  error: {
    code: string;
    description: string;
    field?: any;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { [key: string]: string };
  };

  constructor(
    statusCode: string | number,
    code: string,
    description: string,
    field?: any,
    source?: string,
    step?: string,
    reason?: string,
    metadata?: { [key: string]: string },
  ) {
    super(description);
    this.statusCode = statusCode;
    this.error = {
      code,
      description,
      field,
      source,
      step,
      reason,
      metadata,
    };
  }
}

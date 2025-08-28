// index.d.ts
import { AuthRoles } from "../../src/utils/types";

declare global {
  declare namespace Express {
    export interface Request {
      auth: AuthRoles;
    }
  }
}

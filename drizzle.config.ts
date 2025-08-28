import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { DB_URL } from "./constants";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: DB_URL!,
  },
  casing: "snake_case",
  strict: true,
  verbose: true,
});

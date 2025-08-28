import "dotenv/config";

const DB_URL =
  process.env.DB_MODE === "local"
    ? process.env.DB_URL_LOCAL
    : process.env.DB_URL_PROD;

if (!DB_URL)
  throw new Error(
    "Improper variables configuration. Please contact developer.",
  );

export { DB_URL };

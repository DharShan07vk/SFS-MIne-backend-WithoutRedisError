import { drizzle } from "drizzle-orm/node-postgres";
import { DB_URL } from "../../constants";
import * as schema from "./schema";

const db = drizzle(DB_URL!, { schema, logger: true, casing: "snake_case" });

export { db };

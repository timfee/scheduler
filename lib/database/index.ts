import "server-only";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/lib/schemas/database";
import env from "@/env.config";

const sqlite = new Database(env.SQLITE_PATH);
export const db = drizzle(sqlite, { schema });

// Initialize tables for test environment
if (env.NODE_ENV === "test") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const { createTables } = require("./migrations");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  createTables(db);
}

import "server-only";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/lib/schemas/database";
import env from "@/env.config";

const sqlite = new Database(env.SQLITE_PATH);
export const db = drizzle(sqlite, { schema });

// Initialize tables for test environment
if (env.NODE_ENV === "test") {
  const { createTables } = require("./migrations");
  createTables(db);
}

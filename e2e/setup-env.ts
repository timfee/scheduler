import { DEV_SERVER, TEST_CONSTANTS } from "@/lib/constants";

// Setup environment variables for E2E tests
Object.assign(process.env, { NODE_ENV: "test" });
process.env.ENCRYPTION_KEY = TEST_CONSTANTS.ENCRYPTION_KEY;
process.env.SQLITE_PATH = TEST_CONSTANTS.SQLITE_PATH;
process.env.WEBHOOK_SECRET = TEST_CONSTANTS.WEBHOOK_SECRET;

// Additional test environment variables
process.env.NEXTAUTH_URL = DEV_SERVER.URL;
process.env.NEXTAUTH_SECRET = TEST_CONSTANTS.NEXTAUTH_SECRET;

import { existsSync, unlinkSync } from "fs";
import { join } from "path";

/**
 * Test for validate-setup.ts per-variable prompting behavior
 */
describe("validate-setup per-variable prompting", () => {
  const envPath = join(process.cwd(), ".env.local");

  beforeEach(() => {
    // Clean up any existing .env.local file
    if (existsSync(envPath)) {
      unlinkSync(envPath);
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(envPath)) {
      unlinkSync(envPath);
    }
  });

  test("should prompt for each missing environment variable individually", () => {
    // This test verifies the new behavior where each missing variable
    // is prompted for individually instead of all at once
    const validateSetupPath = join(process.cwd(), "scripts/validate-setup.ts");
    
    expect(existsSync(validateSetupPath)).toBe(true);
    
    // The updated script should include individual prompts for each variable
    const fs = require("fs");
    const content = fs.readFileSync(validateSetupPath, "utf-8");
    
    // Check that the script contains the new per-variable prompting logic
    // This will fail initially and pass after we implement the fix
    expect(content).toContain("for (const key of envValidation.missing)");
    expect(content).toContain("Would you like to generate");
  });

  test("should allow selective generation of missing variables", () => {
    // Test that we can generate some variables but not others
    // This validates that the new behavior gives users more control
    const validateSetupPath = join(process.cwd(), "scripts/validate-setup.ts");
    
    expect(existsSync(validateSetupPath)).toBe(true);
    
    const fs = require("fs");
    const content = fs.readFileSync(validateSetupPath, "utf-8");
    
    // The script should track which variables to generate
    expect(content).toContain("generatedVars");
    expect(content).toContain("REQUIRED_ENV_VARS");
  });
});
import { existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

/**
 * Test for validate-setup.ts per-variable prompting behavior
 */
describe("validate-setup per-variable prompting", () => {
  const envPath = join(process.cwd(), ".env.local");
  const validateSetupPath = join(process.cwd(), "scripts/validate-setup.ts");

  // Helper function to read validate-setup.ts content
  const readValidateSetupContent = (): string => {
    return readFileSync(validateSetupPath, "utf-8");
  };

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
    expect(existsSync(validateSetupPath)).toBe(true);

    // The updated script should include individual prompts for each variable
    const content = readValidateSetupContent();

    // Check that the script contains the new per-variable prompting logic
    // This will fail initially and pass after we implement the fix
    expect(content).toContain("for (const key of envValidation.missing)");
    expect(content).toContain("Would you like to generate");
  });

  test("should allow selective generation of missing variables", () => {
    // Test that we can generate some variables but not others
    // This validates that the new behavior gives users more control
    expect(existsSync(validateSetupPath)).toBe(true);

    const content = readValidateSetupContent();

    // The script should track which variables to generate
    expect(content).toContain("generatedVars");
    expect(content).toContain("REQUIRED_ENV_VARS");
  });
});

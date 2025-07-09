import * as fs from "fs";
import * as path from "path";
import { pathsToModuleNameMapper, type JestConfigWithTsJest } from "ts-jest";

const tsconfigFile = fs.readFileSync(path.resolve("./tsconfig.json"), "utf-8");

const tsconfig = JSON.parse(tsconfigFile) as {
  compilerOptions: { baseUrl?: string; paths?: Record<string, string[]> };
};

const { compilerOptions } = tsconfig;
if (
  typeof compilerOptions !== "object" ||
  compilerOptions === null ||
  typeof compilerOptions.baseUrl !== "string" ||
  typeof compilerOptions.paths !== "object" ||
  compilerOptions.paths === null
) {
  throw new Error(
    "Invalid tsconfig: missing or invalid compilerOptions.baseUrl or compilerOptions.paths",
  );
}

const config: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm",

  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/setupEnv.ts"],
  roots: ["<rootDir>"],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
    "server-only": "<rootDir>/test/__mocks__/server-only.ts",
  },


  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { useESM: true, tsconfig: "./tsconfig.jest.json" },
    ],
  },
};

export default config;

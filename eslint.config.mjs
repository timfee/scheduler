import { FlatCompat } from "@eslint/eslintrc";
// @ts-ignore -- no types for this plugin
import drizzle from "eslint-plugin-drizzle";
import importPlugin from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";
import customRules from "./eslint-rules/index.js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [".next", "**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "test/**", "**/__tests__/**"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      drizzle,
      "import-x": importPlugin,
      "custom": customRules,
    },
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "import-x/consistent-type-specifier-style": ["error", "prefer-inline"],
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "drizzle/enforce-delete-with-where": [
        "error",
        { drizzleObjectName: ["db", "ctx.db"] },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        { drizzleObjectName: ["db", "ctx.db"] },
      ],
      // TypeScript safety rules - prevent bad patterns
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      // Component organization rules
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./components/!(ui|layout)/**",
              from: "*",
              message: "Only 'ui' and 'layout' directories are allowed under components/. Place shared components in the root components/ directory or create feature-specific components in features/*/components/",
            },
            // Feature organization rules - prevent server code from importing client code
            {
              target: "./app/**/_server/**",
              from: "./app/**/_components/**",
              message: "Server code cannot import from client components. Move shared logic to /lib/ or create server-only utilities.",
            },
            {
              target: "./app/**/_server/**",
              from: "./app/**/_hooks/**",
              message: "Server code cannot import from client hooks. Move shared logic to /lib/ or create server-only utilities.",
            },
          ],
        },
      ],
      // Consistent imports - prefer absolute paths with @/ alias
      "import-x/no-relative-parent-imports": "error",
      "custom/enforce-alias-imports": ["error", { allowSameDirectoryImports: true }],
      // Custom rule comment for dynamic imports
      // TODO: Add ESLint rule to catch relative dynamic imports (await import('../path'))
      // All dynamic imports should use absolute paths with @/ alias (await import('@/path'))
      
      // Component size and organization rules
      "max-lines": ["warn", { max: 600, skipComments: true, skipBlankLines: true }],
      "max-lines-per-function": ["warn", { max: 300, skipComments: true, skipBlankLines: true }],
      
      // Date/time naming conventions
      "custom/datetime-naming": ["warn", {
        allowAmbiguous: [], // Don't allow any ambiguous names
      }],
      
      // File organization patterns (ADR-006)
      "custom/file-organization": ["error", {
        features: ["booking", "connections", "admin", "appointments"],
      }],
      
      // Server action patterns (ADR-007)
      "custom/server-action-patterns": ["error", {
        requireValidation: true,
        requireCacheInvalidation: true,
        requireErrorHandling: true,
      }],
      
      // Constants naming convention - enforce ALL_CAPS for constants
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": "variable",
          "modifiers": ["const", "exported"],
          "types": ["boolean", "string", "number", "array"],
          "format": ["UPPER_CASE"],
          "filter": {
            "regex": "^(ok|err|.*Schema|.*Table|.*Factory|.*Variants|server)$",
            "match": false
          }
        }
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);

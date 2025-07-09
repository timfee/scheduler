# Cleanup Plan

- [x] **Verify baseline**
  - [x] Ensure dependencies installed with `pnpm install`
  - [x] Run `npx tsc -p tsconfig.json --noEmit` and note errors
  - [x] Run `npx eslint . --ext .js,.jsx,.ts,.tsx` and note errors
  - [x] Run `npm test --silent` and note test failures

- [x] **Normalize error handling**
  - [x] Replace custom `Result` wrappers with thrown `Error` objects (encryption helpers)
  - [x] Update server actions and API routes to use `try/catch`
  - [x] Adjust tests to expect thrown errors

- [x] **Consolidate duplicate logic**
  - [x] Identify overlapping provider functions in `app/` and `lib/`
  - [x] Move common helpers to `lib/db` or `providers`
  - [x] Delete redundant modules

- [x] **Simplify directory structure**
  - [x] Group database code under `lib/db`
  - [x] Keep provider code under `providers/`
  - [x] Collapse stray `app` subfolders

- [x] **Address TypeScript errors**
  - [x] Fix missing exports like `CAPABILITY` in tests
  - [x] Ensure interfaces match database schema
  - [x] Remove `any` types

- [x] **Fix ESLint issues**
  - [x] Run `eslint --fix`
  - [x] Manually resolve remaining warnings

- [x] **Re-enable passing tests**
  - [x] Update mocks and expectations
  - [x] Ensure `npm test` succeeds

- [x] **Add documentation**
  - [x] Document new architecture and error handling in `README.md`

All files in this repository should pass TypeScript compilation, ESLint, and Jest tests.
Before committing changes, run:

```
npx tsc -p tsconfig.json --noEmit
npx eslint . --ext .js,.jsx,.ts,.tsx
pnpm test --silent
```

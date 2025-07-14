#!/bin/bash
# Install git pre-commit hook

echo "Installing git pre-commit hook..."

# Create the pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Pre-commit hook that ensures code quality

echo "Running pre-commit checks..."

# Check formatting
echo "Checking code formatting..."
if ! pnpm format:check; then
    echo "❌ Code formatting check failed. Run 'pnpm format' to fix."
    exit 1
fi

# Check TypeScript compilation
echo "Checking TypeScript compilation..."
if ! npx tsc -p tsconfig.json --noEmit; then
    echo "❌ TypeScript compilation failed. Fix TypeScript errors before committing."
    exit 1
fi

# Check ESLint
echo "Checking ESLint..."
if ! npx eslint . --ext .js,.jsx,.ts,.tsx; then
    echo "❌ ESLint check failed. Fix ESLint errors before committing."
    exit 1
fi

# Run tests
echo "Running tests..."
if ! pnpm test --silent; then
    echo "❌ Tests failed. Fix failing tests before committing."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed successfully!"
echo "Run 'pnpm pre-commit' to test the checks manually."
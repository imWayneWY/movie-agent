# Local CI Validation

Before pushing your code, you can run all CI checks locally to catch issues early.

## Quick Start

Run this single command to validate everything:

```bash
npm run validate:ci
```

This will run (in order):
1. **Type Check** - Verify TypeScript types
2. **Lint** - Check code quality with ESLint
3. **Format Check** - Verify Prettier formatting
4. **Tests** - Run full test suite with coverage
5. **Build** - Compile TypeScript to JavaScript

## Individual Commands

You can also run checks individually:

```bash
# Type checking
npm run type-check

# Linting (with auto-fix)
npm run lint
npm run lint:fix

# Format checking and fixing
npm run format:check
npm run format

# Testing
npm run test:ci           # Full CI test suite
npm run test:coverage     # With coverage report
npm run test             # Watch mode

# Building
npm run build
```

## What CI Checks

Our GitHub Actions CI workflow checks:
- ✅ Type correctness (TypeScript)
- ✅ Code quality (ESLint)
- ✅ Code formatting (Prettier)
- ✅ All tests pass
- ✅ Code coverage meets thresholds
- ✅ Build succeeds

## Tips

- Run `npm run validate:ci` before committing to catch issues early
- Use `npm run lint:fix` to auto-fix many linting issues
- Use `npm run format` to auto-fix formatting issues
- The validation script will stop on the first failing check

## Exit Codes

- `0` - All checks passed ✅
- `1` - At least one check failed ❌


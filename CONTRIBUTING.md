# Contributing to Movie Agent

Thank you for your interest in contributing to Movie Agent! This document provides guidelines and workflows for contributors.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/movie-agent.git
   cd movie-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```

4. **Install pre-commit hook (optional but recommended)**
   ```bash
   cp docs/pre-commit.example .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Follow Test-Driven Development (TDD)

We use TDD for all new features:

1. **Write tests first**
   ```bash
   # Create or update test file in src/__tests__/
   # Run tests in watch mode
   npm run test:watch
   ```

2. **Implement the feature**
   - Write minimal code to make tests pass
   - Refactor for clarity and performance
   - Ensure all tests pass

3. **Verify coverage**
   ```bash
   npm run test:coverage
   ```
   - Maintain >90% coverage for all metrics
   - Add tests for edge cases

### 3. Code Quality Checks

Before committing, ensure your code passes all checks:

```bash
# Type check
npm run type-check

# Lint
npm run lint
# Auto-fix linting issues
npm run lint:fix

# Format
npm run format
# Check formatting without changes
npm run format:check

# Run all validations
npm run validate
```

### 4. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add mood-to-genre mapping"
# or
git commit -m "fix: correct runtime filtering logic"
# or
git commit -m "docs: update API examples in README"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Reference to related issues
- Screenshots (if applicable)
- Test coverage report

## Testing Guidelines

### Test Types

1. **Unit Tests** (`*.test.ts`)
   - Test individual functions and modules
   - Mock external dependencies
   - Fast execution

2. **E2E Tests** (`e2e.test.ts`)
   - Test complete workflows
   - Use mocked MCP client
   - Verify integration between components

3. **Integration Tests** (`*.live.test.ts`)
   - Test with real APIs
   - Require API credentials
   - Run manually or in CI with secrets

### Writing Good Tests

```typescript
describe('Feature Name', () => {
  describe('Specific Behavior', () => {
    test('should do something specific', () => {
      // Arrange: Set up test data
      const input = { /* ... */ };
      
      // Act: Execute the code
      const result = myFunction(input);
      
      // Assert: Verify results
      expect(result).toBe(expected);
    });
  });
});
```

### Coverage Requirements

All code must meet these minimums:
- **Statements**: 90%
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Code Style

### TypeScript Standards

- Use strict TypeScript configuration
- Provide explicit types for function parameters and returns
- Document public APIs with JSDoc comments
- Use interfaces for data structures

### Best Practices

- **Keep functions small**: Aim for single responsibility
- **Use descriptive names**: Variables, functions, and types
- **Avoid magic numbers**: Use named constants
- **Handle errors explicitly**: Don't swallow errors
- **Write self-documenting code**: Code should be readable without comments

### Example

```typescript
/**
 * Converts user mood to TMDb genre IDs
 * @param mood - User's emotional state
 * @returns Array of genre IDs matching the mood
 * @throws {Error} If mood is not recognized
 */
export function moodToGenres(mood: string): number[] {
  const normalizedMood = mood.toLowerCase().trim();
  const genres = MOOD_GENRE_MAP[normalizedMood];
  
  if (!genres) {
    throw new Error(`Unrecognized mood: ${mood}`);
  }
  
  return genres;
}
```

## Pull Request Process

1. **Ensure CI passes**
   - All tests pass
   - Coverage meets threshold
   - No linting errors
   - TypeScript compiles

2. **Request review**
   - At least one maintainer approval required
   - Address review feedback promptly

3. **Update documentation**
   - Update README if adding features
   - Add JSDoc comments for public APIs
   - Update CHANGELOG (if applicable)

4. **Squash commits** (if requested)
   - Keep commit history clean
   - Combine related commits

## Project Structure

```
movie-agent/
├── src/
│   ├── __tests__/          # Test files
│   │   ├── *.test.ts       # Unit tests
│   │   ├── e2e.test.ts     # End-to-end tests
│   │   └── *.live.test.ts  # Integration tests
│   ├── agent.ts            # Main agent orchestration
│   ├── tmdbApi.ts          # TMDb API client
│   ├── mood.ts             # Mood-to-genre mapping
│   ├── discover.ts         # Movie discovery
│   ├── filters.ts          # Filtering logic
│   ├── ranking.ts          # Ranking algorithm
│   ├── format.ts           # Response formatting
│   ├── validate.ts         # Input validation
│   ├── cache.ts            # Caching layer
│   ├── providers.ts        # Streaming providers
│   ├── config.ts           # Configuration
│   └── types.ts            # TypeScript types
├── docs/                   # Documentation
├── dist/                   # Compiled output
└── coverage/               # Coverage reports
```

## Getting Help

- **Issues**: Check [GitHub Issues](https://github.com/your-repo/movie-agent/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/your-repo/movie-agent/discussions)
- **Documentation**: See [README.md](README.md) and [spec.md](spec.md)

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Recognition

Contributors will be recognized in:
- GitHub Contributors page
- CHANGELOG.md (for significant contributions)
- Release notes

Thank you for helping make Movie Agent better! 🎬

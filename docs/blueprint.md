# Movie Agent Build Blueprint

This blueprint translates the `spec.md` into an actionable, test-driven implementation plan. It proceeds in three layers:

1. High-level architecture plan and sequencing
2. Iterative chunks that build on each other
3. Right-sized steps (sub-chunks) optimized for safe delivery with strong tests

Finally, it provides a complete series of code-generation LLM prompts; each prompt is self-contained, incremental, and TDD-oriented.

---

## 1. High-Level Architecture Plan

- Foundation
  - Node.js project (TypeScript)
  - LangChain.js agent skeleton
  - Configuration via `.env`
  - Logging, error handling, and basic telemetry
- Data Integrations (single source)
  - TMDb REST API (metadata + watch providers)
- Core Domain Modules
  - Mood-to-Genre Mapper
  - Query Builder (discover/search/detail)
  - Watch Providers (Canada `CA`)
  - Filters (runtime, release year, platform)
  - Ranking Engine
- Agent Orchestration
  - Prompt + parser (structured outputs)
  - Runnable pipeline (LangChain sequences)
- API/CLI Surface
  - CLI command `movie-agent` for local runs
  - Programmatic interface `MovieAgent.getRecommendations(input)`
- Testing Strategy
  - Unit tests: domain utilities (mapping, filters, ranking)
  - Integration tests: TMDb MCP calls (mockable adapter)
  - E2E tests: agent pipeline returning 3–5 structured recommendations
  - Performance tests: caching effectiveness and <5s response

---

## 2. Iterative Chunks (Milestones)

1. Project Bootstrap
2. Config + Env Management
3. Mood Mapping Module
4. Input Validation Module
5. TMDb API Client
6. Discovery Query Builder (genres/year/runtime)
7. Watch Providers (CA) Retrieval
8. Filtering (platforms/runtime/year)
9. Ranking Engine
10. Structured Output Parser + Types
11. Agent Orchestration Pipeline
12. CLI Entry + Minimal UI Output
13. Caching Layer
14. Performance + Error Handling
15. E2E + Coverage + CI Scripts

Each chunk builds on prior work and is test-driven.

---

## 3. Right-Sized Steps (Sub-Chunks)

### Chunk 1: Project Bootstrap
- Step 1.1: Initialize `package.json`, TypeScript config, linting
- Step 1.2: Setup `src/` folder structure and basic app scaffold
- Step 1.3: Add scripts: build, dev, test, lint, format

### Chunk 2: Config + Env Management
- Step 2.1: Create `config.ts` to read `.env` and validate keys
- Step 2.2: Introduce `TMDB_REGION=CA` defaulting mechanism
- Step 2.3: Unit tests for config validation and fallbacks

### Chunk 3: Mood Mapping Module
- Step 3.1: Implement `moodToGenres(mood)` with mapping from spec
- Step 3.2: Unit tests covering happy/thoughtful/excited/relaxed/scared
- Step 3.3: Unknown mood returns empty array

### Chunk 4: Input Validation Module
- Step 4.1: Validate runtime ranges, year ranges, platform names
- Step 4.2: Unit tests for valid/invalid cases

### Chunk 5: TMDb API Client
- Step 5.1: Implement a thin adapter to call TMDb REST endpoints
- Step 5.2: Add discover, detail, search, genres, watch-providers methods
- Step 5.3: Integration tests (mock HTTP responses)

### Chunk 6: Discovery Query Builder
- Step 6.1: Translate inputs to TMDb discover params (genres/year/runtime)
- Step 6.2: Unit tests for param building

### Chunk 7: Watch Providers (CA) Retrieval
- Step 7.1: For each candidate movie, retrieve watch providers for `CA`
- Step 7.2: Normalize provider names into standard platform set
- Step 7.3: Integration tests (mock providers payload)

### Chunk 8: Filtering
- Step 8.1: Filter by platforms user owns (any match)
- Step 8.2: Filter by runtime range and year
- Step 8.3: Unit tests for all filters

### Chunk 9: Ranking Engine
- Step 9.1: Implement scoring based on mood/genre match, availability, runtime, year, popularity
- Step 9.2: Unit tests verifying ranking consistency

### Chunk 10: Structured Output + Types
- Step 10.1: Define TypeScript interfaces per spec
- Step 10.2: Implement formatter to create concise descriptions and reasons
- Step 10.3: Unit tests validating shape and constraints

### Chunk 11: Agent Orchestration
- Step 11.1: LangChain RunnableSequence assembling steps
- Step 11.2: Prompt + StructuredOutputParser enforcing 3–5 items
- Step 11.3: Integration test: end-to-end pipeline with mocks

### Chunk 12: CLI Entry + Minimal UI Output
- Step 12.1: Create `bin/movie-agent` CLI
- Step 12.2: Pretty printer output per spec (human-readable)
- Step 12.3: Smoke test with mocked data

### Chunk 13: Caching Layer
- Step 13.1: Add simple in-memory cache (TTL) for providers + discover
- Step 13.2: Unit tests for cache hit/miss semantics

### Chunk 14: Performance + Error Handling
- Step 14.1: Performance tests (<5s) and cache effectiveness
- Step 14.2: Error paths (MCP unavailable, rate limits, region missing)

### Chunk 15: E2E + Coverage + CI Scripts
- Step 15.1: E2E tests for typical flows
- Step 15.2: Coverage reports
- Step 15.3: CI scripts (lint/test/build)

---

## 4. TDD-Oriented Prompt Series

Below are fully self-contained prompts for a code-generation LLM. Each prompt:
- Stands alone (no references to other prompts)
- Includes context, requirements, and test-first instructions
- Builds incrementally towards a complete, integrated system

Each prompt is tagged as code text.

### Prompt 1: Project Bootstrap

```text
You are generating a Node.js TypeScript project skeleton for a "Movie Agent". Requirements:
- Create package.json with scripts: build, dev, test, lint, format
- Add dev dependencies: typescript, ts-node, jest, ts-jest, @types/jest, eslint, prettier
- Configure TypeScript (tsconfig.json) targeting ES2020, outDir "dist"
- Setup Jest (jest.config.ts) for TypeScript tests
- Add ESLint + Prettier configurations
- Create src/index.ts that exports a placeholder MovieAgent class
- Ensure all files compile and tests run (even if empty)

Tests to include:
- A trivial test ensuring the placeholder class loads: src/__tests__/bootstrap.test.ts
- Jest runs with `npm test` and passes

Deliverables:
- package.json, tsconfig.json, jest.config.ts, .eslintrc.json, .prettierrc
- src/index.ts
- src/__tests__/bootstrap.test.ts
- Commands to run: npm install, npm test, npm run build
```

### Prompt 2: Config + Env Management

```text
Implement configuration management for the Movie Agent.

Requirements:
- Create src/config.ts that reads environment variables: TMDB_API_KEY, TMDB_BASE_URL, TMDB_REGION, CACHE_TTL, MAX_RECOMMENDATIONS, MIN_RECOMMENDATIONS
- Use dotenv to load .env; validate required key TMDB_API_KEY; default TMDB_BASE_URL to "https://api.themoviedb.org/3"; default TMDB_REGION to "CA", CACHE_TTL to 86400, MAX_RECOMMENDATIONS to 5, MIN_RECOMMENDATIONS to 3
- Export a typed Config object
- Fail-fast with descriptive errors when required keys are missing

Tests:
- src/__tests__/config.test.ts covering: default region, ttl, min/max recs; missing API key throws; TMDB_BASE_URL defaults correctly

Deliverables:
- src/config.ts
- src/__tests__/config.test.ts
- Update package.json to include dotenv dependency
- Ensure tests pass
```

### Prompt 3: Mood Mapping Module

```text
Create a mood-to-genre mapping utility.

Requirements:
- Implement src/mood.ts with function moodToGenres(mood: string): string[] using mappings: happy→["Comedy","Family","Musical"], thoughtful→["Drama","Documentary","Biography"], excited→["Action","Adventure","Thriller"], relaxed→["Romance","Comedy","Animation"], scared→["Horror","Thriller","Mystery"]
- Unknown moods return []
- Ensure duplicates are removed when extending in the future

Tests:
- src/__tests__/mood.test.ts validating mappings, unknown mood returns [], and uniqueness of results

Deliverables:
- src/mood.ts
- src/__tests__/mood.test.ts
```

### Prompt 4: Input Validation Module

```text
Create input validation utilities.

Requirements:
- Define allowed platform names: ["Netflix","Prime Video","Crave","Disney+","Apple TV+","Paramount+","Hayu","Tubi","Pluto TV"]
- Implement src/validate.ts with:
  - validateRuntime({min?:number,max?:number}) throws if min>max
  - validateYear(year:number) or validateYearRange({from:number,to:number}) throws if invalid (from>to)
  - validatePlatforms(platforms:string[]) throws if any not in allowed set
- Export helper isValidPlatform(name)

Tests:
- src/__tests__/validate.test.ts covering happy path and error cases per spec

Deliverables:
- src/validate.ts
- src/__tests__/validate.test.ts
```

### Prompt 5: TMDb API Client

```text
Implement a thin TMDb REST API client adapter (mockable).

Requirements:
- Create src/tmdbApi.ts with class TmdbApiClient using fetch or axios; methods:
  - discoverMovies(params)
  - getMovieDetails(movieId)
  - searchMovies(query)
  - getGenres()
  - getWatchProviders(movieId)
- Read TMDB_BASE_URL and TMDB_API_KEY from config
- All methods return typed results; include minimal interfaces
- Add error handling: network errors, non-200 responses

Tests:
- src/__tests__/tmdbApi.test.ts using jest mocks to simulate HTTP responses and error paths

Deliverables:
- src/tmdbApi.ts
- src/__tests__/tmdbApi.test.ts
```

### Prompt 6: Discovery Query Builder

```text
Build a discovery query builder translating user inputs to TMDb discover parameters.

Requirements:
- Create src/discover.ts with function buildDiscoverParams(input) mapping:
  - genres (from moodToGenres or explicit genre input)
  - release year or range
  - runtime constraints (min/max)
- Ensure only movie type is requested
- Export function discoverMovies(input) that calls apiClient.discoverMovies(buildDiscoverParams(input))

Tests:
- src/__tests__/discover.test.ts verifying param mapping for typical inputs and edge cases

Deliverables:
- src/discover.ts
- src/__tests__/discover.test.ts
```

### Prompt 7: Watch Providers (CA) Retrieval

```text
Retrieve and normalize watch providers for Canada.

Requirements:
- Create src/providers.ts with function getCanadianProviders(movieId, region="CA") fetching TMDb watch providers and returning normalized list of platform names
- Map TMDb provider names to the allowed platform set; ignore non-subscription types unless explicitly included
- Handle missing providers gracefully

Tests:
- src/__tests__/providers.test.ts mocking client responses; cover no providers, providers with flatrate, mapping correctness

Deliverables:
- src/providers.ts
- src/__tests__/providers.test.ts
```

### Prompt 8: Filtering Utilities

```text
Implement filtering utilities for platforms, runtime, and year.

Requirements:
- Create src/filters.ts with:
  - filterByPlatforms(movie, userPlatforms:string[]) returns boolean if any match
  - filterByRuntime(movie, constraints) returns boolean
  - filterByYear(movie, year or {from,to}) returns boolean
- Compose these filters for an array of movies

Tests:
- src/__tests__/filters.test.ts covering positive/negative cases

Deliverables:
- src/filters.ts
- src/__tests__/filters.test.ts
```

### Prompt 9: Ranking Engine

```text
Create a ranking engine to score movies.

Requirements:
- Implement src/ranking.ts with scoreMovie(movie, input, context) using weights:
  - mood/genre match
  - platform availability
  - runtime compatibility
  - release year preference
  - popularity as tiebreaker
- Implement rankMovies(movies, input)

Tests:
- src/__tests__/ranking.test.ts verifying ordering for constructed scenarios

Deliverables:
- src/ranking.ts
- src/__tests__/ranking.test.ts
```

### Prompt 10: Types + Output Formatter

```text
Define types and format the structured output per spec.

Requirements:
- Create src/types.ts for interfaces: MovieRecommendation, StreamingPlatform, AgentResponse, UserInput
- Implement src/format.ts with:
  - toRecommendation(movie, providers, reason) enforcing title, releaseYear, runtime, description (50-100 words), genres, streamingPlatforms
  - formatResponse(recommendations: MovieRecommendation[], metadata)
- Add concise description builder (non-spoiler) placeholder

Tests:
- src/__tests__/format.test.ts checking structure, field presence, min/max items

Deliverables:
- src/types.ts
- src/format.ts
- src/__tests__/format.test.ts
```

### Prompt 11: Agent Orchestration

```text
Assemble the LangChain agent pipeline.

Requirements:
- Create src/agent.ts exporting class MovieAgent with method getRecommendations(input: UserInput)
- Pipeline:
  1) Validate input
  2) Resolve genres from mood/explicit input
  3) Discover candidate movies via TMDb MCP
  4) Fetch watch providers for each candidate (region CA)
  5) Apply filters (platforms/runtime/year)
  6) Rank and select 3–5
  7) Format structured output with metadata
- Use RunnableSequence or plain composition; include logging and error handling

Tests:
- src/__tests__/agent.test.ts with mocks returning deterministic results; assert 3–5 items and required fields

Deliverables:
- src/agent.ts
- src/__tests__/agent.test.ts
```

### Prompt 12: CLI Entry + Human-Readable Output

```text
Create a CLI to run the agent from terminal.

Requirements:
- Add bin/movie-agent (Node shebang) reading input flags: --mood, --platforms, --genre, --runtimeMax, --runtimeMin, --year, --yearFrom, --yearTo
- Invoke MovieAgent.getRecommendations and print human-readable output matching the spec display format
- Handle errors gracefully with user-friendly messages
- Update package.json with "bin" field and a start script

Tests:
- src/__tests__/cli.test.ts using a test harness to validate printed output contains titles and platforms

Deliverables:
- bin/movie-agent
- src/__tests__/cli.test.ts
- package.json bin configuration
```

### Prompt 13: Caching Layer

```text
Implement a simple in-memory caching layer.

Requirements:
- Create src/cache.ts with TTL-based get/set for keys: discover params, watch providers
- Integrate cache in discover and providers workflows
- Expose CACHE_TTL from config

Tests:
- src/__tests__/cache.test.ts verifying expiry and hit/miss improvements

Deliverables:
- src/cache.ts
- cache integration changes in discover/providers modules
- src/__tests__/cache.test.ts
```

### Prompt 14: Performance + Error Handling

```text
Add performance tests and robust error handling.

Requirements:
- Add src/__tests__/performance.test.ts measuring pipeline execution time with mocked fast responses; assert <5000ms
- Add error handling paths in agent: MCP unavailable, invalid API key, rate limit exceeded; return ErrorResponse structure
- Unit tests in src/__tests__/errors.test.ts covering these cases

Deliverables:
- src/__tests__/performance.test.ts
- src/__tests__/errors.test.ts
- Agent updates to produce ErrorResponse
```

### Prompt 15: E2E + Coverage + CI Scripts

```text
Finalize with end-to-end tests, coverage, and CI-ready scripts.

Requirements:
- Add src/__tests__/e2e.test.ts that runs the full pipeline with mocked MCP client
- Ensure coverage thresholds: 90% unit coverage minimum
- Update package.json: test:unit, test:integration, test:e2e, test:coverage, lint, format, type-check
- Provide commands in README for developers

Deliverables:
- src/__tests__/e2e.test.ts
- package.json scripts updates
- README updates (commands and workflow)
```

---

## 5. Review for Right-Sizing

- Steps are small, isolated, and test-first
- Each step yields runnable code with passing tests
- No orphaned code: later steps integrate earlier modules
- Complexity ramps gradually: config → utilities → adapter → orchestration → CLI → perf/CI
- Early wins ensure confidence before integrating external MCP

This blueprint is ready to drive safe, incremental implementation of the Movie Agent using TMDb MCP and LangChain.js, with strong TDD discipline.

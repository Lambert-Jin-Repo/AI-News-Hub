# Testing Strategy Reference

## Test File Organization

```
src/lib/__tests__/
├── auth.test.ts              # Auth utility tests
├── formatters.test.ts        # String/date formatter tests
├── sanitize.test.ts          # Input sanitization tests
├── llm-client.test.ts        # LLM client tests (mocked HTTP)
├── summariser.test.ts        # Business logic tests (mocked DB + LLM)
├── digest-generator.test.ts  # Orchestrator tests (mocked everything)
├── rss-fetcher.test.ts       # RSS fetcher tests (mocked HTTP)
└── gnews-fetcher.test.ts     # API client tests (mocked HTTP)
```

**Convention:** Tests live in `__tests__/` directories adjacent to the code they test.

## What to Test

### Always Test (High Value)

| Layer | What to test | Mock what |
|-------|-------------|-----------|
| **Utility functions** | Pure logic (formatters, slugify, sanitize) | Nothing |
| **Auth** | Token verification, timing-safe comparison | Nothing |
| **API clients** | Request/response handling, error mapping | HTTP calls |
| **Business logic** | Classification, filtering, transformation | DB + external APIs |
| **Orchestrators** | Flow control, error handling, fallbacks | Everything external |

### Skip (Low Value)

- UI component rendering (changes too often, low signal)
- Snapshot tests (break constantly, rarely catch real bugs)
- CSS/layout tests (use visual regression tools instead)
- Integration tests that duplicate unit test coverage

## Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        coverage: {
            reporter: ['text', 'lcov'],
            include: ['src/lib/**'],
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
```

## Mock Patterns

### Pattern 1: Mock Module with Factory Function

The most common pattern. Define mocks before imports.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mock BEFORE vi.mock
const mockGenerateText = vi.fn();

vi.mock('../llm-client', () => ({
    generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

describe('summariser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls LLM with article content', async () => {
        mockGenerateText.mockResolvedValue({ text: 'Summary', provider: 'gemini' });

        const { summarise } = await import('../summariser');
        await summarise({ title: 'Test', excerpt: 'Content' });

        expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });
});
```

### Pattern 2: Mock Constructor Classes

For mocking `new Client()` style dependencies:

```typescript
// GOOD — use class syntax
vi.mock('groq-sdk', () => ({
    default: class Groq {
        chat = {
            completions: {
                create: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: 'response' } }],
                }),
            },
        };
    },
}));

// BAD — vitest warns about non-class constructors
vi.mock('groq-sdk', () => ({
    default: vi.fn().mockImplementation(() => ({
        chat: { completions: { create: vi.fn() } },
    })),
}));
```

### Pattern 3: Mock Supabase Query Chains

Supabase queries are method chains. Mock each level of the chain:

```typescript
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock('../supabase', () => ({
    getAdminClient: () => ({
        from: (table: string) => {
            if (table === 'articles') {
                return {
                    select: (...args: unknown[]) => {
                        mockSelect(...args);
                        return {
                            eq: (...eqArgs: unknown[]) => {
                                mockEq(...eqArgs);
                                return {
                                    order: (...orderArgs: unknown[]) => {
                                        mockOrder(...orderArgs);
                                        return {
                                            limit: (n: number) => {
                                                mockLimit(n);
                                                return { data: mockData, error: null };
                                            },
                                        };
                                    },
                                };
                            },
                        };
                    },
                    update: (data: Record<string, unknown>) => {
                        mockUpdate(data);
                        return { eq: () => ({ error: null }) };
                    },
                };
            }
            return {};
        },
    }),
}));
```

**Chain ordering matters.** If the real code calls `.order().order().limit()` (two order calls), the mock must support both the chained `.order()` and the terminal `.limit()` at each level.

### Pattern 4: Stateful Mocks (Multiple Calls Return Different Data)

```typescript
let callCount = 0;
let mockFirstCallData = null;
let mockSecondCallData = null;

// Inside mock chain:
limit: () => {
    callCount++;
    if (callCount <= 1) return { data: mockFirstCallData, error: null };
    return { data: mockSecondCallData, error: null };
},

// Reset in beforeEach:
beforeEach(() => {
    callCount = 0;
    mockFirstCallData = null;
    mockSecondCallData = null;
});
```

### Pattern 5: Mock Constants

```typescript
vi.mock('../constants', () => ({
    RELEVANCE_THRESHOLD: 5,
    ON_TOPIC_CATEGORIES: ['llm', 'agents', 'models'],
    MAX_ARTICLES: 20,
}));
```

### Pattern 6: Lazy Import After Mock

When using `vi.mock()`, import the module under test dynamically to ensure mocks are applied:

```typescript
// Mocks defined above with vi.mock()

it('does something', async () => {
    // Dynamic import ensures mocks are in place
    const { myFunction } = await import('../my-module');
    const result = await myFunction();
    expect(result).toBe('expected');
});
```

## Error Testing

### Test error status mapping

```typescript
it('maps safety block errors to failed_safety', async () => {
    const safetyError = { isSafetyBlock: true, provider: 'gemini', message: 'blocked' };
    mockGenerateText.mockRejectedValue(safetyError);

    const { process } = await import('../processor');
    const result = await process(article);

    expect(result.status).toBe('failed_safety');
});

it('maps quota errors to failed_quota', async () => {
    mockGenerateText.mockRejectedValue(new Error('API quota exceeded'));

    const { process } = await import('../processor');
    const result = await process(article);

    expect(result.status).toBe('failed_quota');
});
```

### Test graceful degradation

```typescript
it('returns digest even when TTS fails', async () => {
    mockGenerateText.mockResolvedValue({ text: 'Digest text' });
    mockGenerateSpeech.mockRejectedValue(new Error('TTS down'));

    const { generateDigest } = await import('../digest');
    const result = await generateDigest();

    // Digest created, just no audio
    expect(result.digestId).toBeDefined();
    expect(result.audioUrl).toBeNull();
    expect(mockDbUpdate).toHaveBeenCalledWith({ audio_status: 'failed' });
});
```

## Test Organization Rules

1. **One describe per public function** being tested
2. **Happy path first**, then edge cases, then error cases
3. **Reset mocks in beforeEach**, not afterEach
4. **Test behavior, not implementation** — assert on outputs and side effects, not internal calls
5. **Keep tests independent** — no test should depend on another test's state
6. **Name tests as user stories** — "returns early when no pending articles", not "test case 1"

## Common Pitfalls

1. **`vi.clearAllMocks()` vs `vi.resetAllMocks()`** — `clearAllMocks` resets call history but keeps implementation. `resetAllMocks` also removes mock implementations. Usually want `clearAllMocks` with per-test `mockResolvedValue`.

2. **Destructured `let` lint errors** — `let { data: x, error } = await query` — if only `x` is reassigned, ESLint fires `prefer-const` on `error`. Fix: `const { data, error } = ...` then `let x = data;`.

3. **Mock hoisting** — `vi.mock()` is hoisted to the top of the file. Variables referenced inside must be declared before `vi.mock()` calls.

4. **`@ts-expect-error` becomes stale** — After refactoring, unused `@ts-expect-error` directives cause TypeScript errors. Remove them after the underlying type issue is fixed.

# Task 1: Create Spread Definitions Module

Read CLAUDE.md first — follow every step including decapod init.

## What to create: `src/spreads.ts`

```typescript
export interface SpreadPosition {
  name: string;
  meaning: string;
}

export interface SpreadDefinition {
  id: string;
  name: string;
  description: string;
  positions: SpreadPosition[];
}
```

Define these spreads:
- **three-card**: Past / Present / Future (3 positions)
- **celtic-cross**: 10 positions (Significator, Crossing, Foundation, Recent Past, Crown, Future, Self, Environment, Hopes/Fears, Outcome)
- **horseshoe**: 7 positions (Past, Present, Hidden Influences, Obstacles, External Influences, Suggestion, Outcome)

Export `getSpread(id: string): SpreadDefinition | undefined` and `listSpreads(): SpreadDefinition[]`.

Also create `tests/spreads-module.test.ts` with:
- listSpreads returns 3 spreads
- getSpread("three-card") returns correct definition with 3 positions
- getSpread("celtic-cross") returns 10 positions
- getSpread("horseshoe") returns 7 positions
- getSpread("invalid") returns undefined

## TDD: Write the test file FIRST, run it to confirm failure, commit, THEN create src/spreads.ts, run tests to confirm pass, commit.
## Do NOT modify any other files. Do NOT push.

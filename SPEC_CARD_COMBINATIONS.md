# SPEC: Card Combinations (Pairs)

## Overview
When two cards appear together in a reading, their combined meaning differs from individual meanings. This endpoint provides interpretive guidance for card pairs.

## Endpoint
`GET /api/cards/combine/:id1/:id2`

## Behavior
- Accepts two card IDs
- Returns both individual cards plus a generated combination interpretation
- Combination logic: concatenate keywords from both cards, determine if the pair is harmonious (same element) or tension (opposing elements: fire↔water, air↔earth)
- Response includes: `card1`, `card2`, `relationship` ("harmonious" | "tension" | "neutral"), `combined_keywords` (merged, deduplicated)
- Invalid IDs return 404
- Same ID twice returns 400 with `{"error": "Cards must be different"}`

## Element Mapping
- Wands → fire, Cups → water, Swords → air, Pentacles → earth
- Major Arcana → neutral (no element)

## Acceptance Criteria
- AC1: Two valid Minor Arcana cards from same element → relationship "harmonious"
- AC2: Fire + Water cards → relationship "tension"
- AC3: Major Arcana + any → relationship "neutral"
- AC4: Same ID → 400 error
- AC5: Invalid ID → 404
- AC6: combined_keywords is deduplicated array

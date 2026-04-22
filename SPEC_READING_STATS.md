# SPEC: Reading Statistics

## Overview
Aggregate statistics about saved readings — most drawn cards, spread type popularity, readings over time.

## Endpoint
`GET /api/readings/stats`

## Response
```json
{
  "totalReadings": 12,
  "spreadBreakdown": {
    "three-card": 5,
    "celtic-cross": 3,
    "single": 4
  },
  "mostDrawnCards": [
    { "cardId": 0, "name": "The Fool", "count": 4 },
    { "cardId": 13, "name": "Death", "count": 3 }
  ],
  "recentReadings": 3
}
```

## Behavior
- `totalReadings`: COUNT of all readings
- `spreadBreakdown`: GROUP BY spread_type, counts per type
- `mostDrawnCards`: Top 5 cards appearing most across all readings. Parse the `cards` JSON column from readings table to count card appearances.
- `recentReadings`: readings created in the last 7 days
- If no readings exist, return zeroes/empty objects (never error)

## Acceptance Criteria
- AC1: Empty database → all zeroes, empty arrays
- AC2: After creating 3 readings → totalReadings = 3
- AC3: spreadBreakdown keys match actual spread types used
- AC4: mostDrawnCards limited to top 5, sorted by count descending
- AC5: recentReadings only counts last 7 days

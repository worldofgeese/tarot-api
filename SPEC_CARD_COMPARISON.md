# SPEC: Card Comparison

## Overview
Compare two cards side-by-side, highlighting similarities and differences in their attributes.

## Endpoint
`GET /api/cards/compare/:id1/:id2`

## Response
```json
{
  "card1": { ...full card },
  "card2": { ...full card },
  "comparison": {
    "sameArcana": true,
    "sameSuit": false,
    "sameElement": false,
    "numberDifference": 5,
    "sharedKeywords": ["transformation"],
    "uniqueToCard1": ["new beginnings"],
    "uniqueToCard2": ["endings"]
  }
}
```

## Behavior
- Both cards must exist (404 if either missing)
- Same ID allowed (comparison shows all fields identical)
- `sameArcana`: both Major or both Minor
- `sameSuit`: identical suit (null suits for Major Arcana count as same)
- `sameElement`: map suits to elements, compare
- `numberDifference`: absolute difference of card numbers (null if either is Major Arcana)
- `sharedKeywords`: intersection of keywords (split on comma, trim, lowercase compare)
- `uniqueToCard1` / `uniqueToCard2`: keywords in one but not the other

## Acceptance Criteria
- AC1: Two cards from same suit → sameSuit true, sameElement true
- AC2: Major + Minor → sameArcana false, numberDifference null
- AC3: Cards with overlapping keywords → sharedKeywords populated
- AC4: Invalid ID → 404
- AC5: Keywords comparison is case-insensitive

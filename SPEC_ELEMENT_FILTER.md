# SPEC: Filter Cards by Element

## Endpoint
`GET /cards/element/:element`

## Behavior
- Accepts `element` parameter: `fire`, `water`, `air`, `earth`
- Returns all cards whose suit maps to that element:
  - Wands → fire
  - Cups → water  
  - Swords → air
  - Pentacles → earth
  - Major Arcana cards have no element — excluded from results
- Response: JSON array of card objects (same shape as `/cards/:id`)
- Invalid element returns 400 with `{"error": "Invalid element. Must be one of: fire, water, air, earth"}`
- Empty string element returns 400

## Acceptance Criteria
- AC1: GET /cards/element/fire returns all Wands cards (14 cards)
- AC2: GET /cards/element/water returns all Cups cards (14 cards)
- AC3: GET /cards/element/invalid returns 400 with error message
- AC4: Each card in response has id, name, suit, meanings fields
- AC5: Major Arcana cards never appear in element results
- AC6: Input validation via existing MOSAIC middleware pattern

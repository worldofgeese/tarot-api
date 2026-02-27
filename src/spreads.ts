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

const spreads: SpreadDefinition[] = [
  {
    id: "three-card",
    name: "Three Card Spread",
    description: "A simple spread for past, present, and future insights.",
    positions: [
      { name: "Past", meaning: "Events and influences from your past that affect the current situation" },
      { name: "Present", meaning: "Your current situation and immediate influences" },
      { name: "Future", meaning: "Potential outcomes and upcoming influences" }
    ]
  },
  {
    id: "celtic-cross",
    name: "Celtic Cross",
    description: "A comprehensive 10-card spread for deep insight into a situation.",
    positions: [
      { name: "Significator", meaning: "The present situation or the querent's state of mind" },
      { name: "Crossing", meaning: "The challenge or obstacle crossing the querent" },
      { name: "Foundation", meaning: "The basis of the situation, root causes" },
      { name: "Recent Past", meaning: "Events and influences that are passing" },
      { name: "Crown", meaning: "Goals, aspirations, or the best that can be achieved" },
      { name: "Future", meaning: "What is approaching or coming into being" },
      { name: "Self", meaning: "The querent's attitude, their state of mind" },
      { name: "Environment", meaning: "External influences, other people's perspectives" },
      { name: "Hopes/Fears", meaning: "Inner emotions, hopes, fears, and expectations" },
      { name: "Outcome", meaning: "The final result if current path continues" }
    ]
  },
  {
    id: "horseshoe",
    name: "Horseshoe Spread",
    description: "A 7-card spread for comprehensive guidance on a specific question.",
    positions: [
      { name: "Past", meaning: "Past influences and events affecting the situation" },
      { name: "Present", meaning: "The current state of affairs" },
      { name: "Hidden Influences", meaning: "Unseen forces or unconscious factors at play" },
      { name: "Obstacles", meaning: "Challenges and difficulties to overcome" },
      { name: "External Influences", meaning: "People, events, or energies surrounding the situation" },
      { name: "Suggestion", meaning: "Advice or recommended course of action" },
      { name: "Outcome", meaning: "The likely result if the advice is followed" }
    ]
  }
];

export function getSpread(id: string): SpreadDefinition | undefined {
  return spreads.find(spread => spread.id === id);
}

export function listSpreads(): SpreadDefinition[] {
  return spreads;
}

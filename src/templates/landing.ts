import { layout } from "./layout";
import type { Card } from "../lib/spread";

export function landing(cards: Card[]): string {
  const cardsHtml = cards.map(card => {
    const keywords = JSON.parse(card.keywords);
    return `
      <a href="/card/${card.id}" class="card-tile">
        <div class="card-image">
          <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="300" fill="#2a1a4a" stroke="#6b46c1" stroke-width="2"/>
            <text x="100" y="150" text-anchor="middle" fill="#a78bfa" font-size="16" font-weight="bold">
              ${card.name}
            </text>
          </svg>
        </div>
        <div class="card-info">
          <h3 class="card-title">${card.name}</h3>
          <p class="card-arcana">${card.arcana === "major" ? "Major Arcana" : `${card.suit} - Minor Arcana`}</p>
        </div>
      </a>
    `;
  }).join("");

  const content = `
    <div class="page-header">
      <h1>Tarot Cards</h1>
      <p>Explore all 78 cards of the tarot deck</p>
    </div>
    <div class="cards-grid">
      ${cardsHtml}
    </div>
  `;

  return layout("All Cards", content);
}

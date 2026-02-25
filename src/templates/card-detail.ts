import { layout } from "./layout";
import type { Card } from "../lib/spread";

export function cardDetail(card: Card): string {
  const keywords = JSON.parse(card.keywords);

  const content = `
    <div class="card-detail">
      <div class="card-header">
        <div class="card-image-large">
          <svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="450" fill="#2a1a4a" stroke="#6b46c1" stroke-width="3"/>
            <text x="150" y="225" text-anchor="middle" fill="#a78bfa" font-size="24" font-weight="bold">
              ${card.name}
            </text>
          </svg>
        </div>
        <div class="card-meta">
          <h1 class="card-name">${card.name}</h1>
          <p class="card-type">${card.arcana === "major" ? "Major Arcana" : `${card.suit} - Minor Arcana`}</p>
          ${card.number !== null ? `<p class="card-number">Number: ${card.number}</p>` : ""}
        </div>
      </div>

      <div class="card-meanings">
        <div class="meaning-section">
          <h2>Upright Meaning</h2>
          <p class="upright-meaning">${card.upright_meaning}</p>
        </div>

        <div class="meaning-section">
          <h2>Reversed Meaning</h2>
          <p class="reversed-meaning">${card.reversed_meaning}</p>
        </div>

        <div class="meaning-section">
          <h2>Keywords</h2>
          <div class="keywords">
            ${keywords.map((kw: string) => `<span class="keyword">${kw}</span>`).join("")}
          </div>
        </div>

        <div class="meaning-section">
          <h2>Imagery</h2>
          <p class="image-desc">${card.image_desc}</p>
        </div>
      </div>

      <div class="card-actions">
        <a href="/" class="btn">Back to All Cards</a>
      </div>
    </div>
  `;

  return layout(card.name, content);
}

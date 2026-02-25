import { layout } from "./layout";

export function spread(): string {
  const content = `
    <div class="spread-page">
      <div class="page-header">
        <h1>Draw a Spread</h1>
        <p>Choose a spread type to receive guidance from the cards</p>
      </div>

      <div class="spread-buttons">
        <button class="btn spread-btn" data-type="single">Single Card</button>
        <button class="btn spread-btn" data-type="3-card">3-Card Spread</button>
        <button class="btn spread-btn" data-type="celtic-cross">Celtic Cross</button>
      </div>

      <div id="spread-result" class="spread-result"></div>
    </div>

    <script>
      document.querySelectorAll('.spread-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const type = btn.dataset.type;
          const response = await fetch(\`/api/spread/\${type}\`);
          const cards = await response.json();

          const resultDiv = document.getElementById('spread-result');
          resultDiv.innerHTML = \`
            <h2>Your \${type === 'single' ? 'Card' : type === '3-card' ? '3-Card Spread' : 'Celtic Cross'}</h2>
            <div class="spread-cards">
              \${cards.map(card => \`
                <div class="spread-card">
                  <div class="card-image">
                    <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="300" fill="#2a1a4a" stroke="#6b46c1" stroke-width="2"/>
                      <text x="100" y="150" text-anchor="middle" fill="#a78bfa" font-size="14" font-weight="bold">
                        \${card.name}
                      </text>
                    </svg>
                  </div>
                  <h3 class="card-name">\${card.name}</h3>
                  <p class="card-meaning">\${card.upright_meaning}</p>
                  <a href="/card/\${card.id}" class="btn-small">View Details</a>
                </div>
              \`).join('')}
            </div>
          \`;
        });
      });
    </script>
  `;

  return layout("Draw a Spread", content);
}

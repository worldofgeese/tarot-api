import { layout } from "./layout";

export function search(): string {
  const content = `
    <div class="search-page">
      <div class="page-header">
        <h1>Search Cards</h1>
        <p>Search by name, meanings, or keywords</p>
      </div>

      <div class="search-box">
        <input type="text" id="search-input" placeholder="Enter search term..." />
        <button id="search-btn" class="btn">Search</button>
      </div>

      <div id="search-results" class="search-results"></div>
    </div>

    <script>
      const searchInput = document.getElementById('search-input');
      const searchBtn = document.getElementById('search-btn');
      const resultsDiv = document.getElementById('search-results');

      async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`);
        const cards = await response.json();

        if (cards.error) {
          resultsDiv.innerHTML = \`<p class="error">\${cards.error}</p>\`;
          return;
        }

        if (cards.length === 0) {
          resultsDiv.innerHTML = '<p>No cards found matching your search.</p>';
          return;
        }

        resultsDiv.innerHTML = \`
          <h2>Found \${cards.length} card\${cards.length === 1 ? '' : 's'}</h2>
          <div class="cards-grid">
            \${cards.map(card => \`
              <a href="/card/\${card.id}" class="card-tile">
                <div class="card-image">
                  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="300" fill="#2a1a4a" stroke="#6b46c1" stroke-width="2"/>
                    <text x="100" y="150" text-anchor="middle" fill="#a78bfa" font-size="16" font-weight="bold">
                      \${card.name}
                    </text>
                  </svg>
                </div>
                <div class="card-info">
                  <h3 class="card-title">\${card.name}</h3>
                  <p class="card-arcana">\${card.arcana === "major" ? "Major Arcana" : \`\${card.suit} - Minor Arcana\`}</p>
                </div>
              </a>
            \`).join('')}
          </div>
        \`;
      }

      searchBtn.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
      });
    </script>
  `;

  return layout("Search", content);
}

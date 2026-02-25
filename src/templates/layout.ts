export function layout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Tarot API</title>
  <link rel="stylesheet" href="/public/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <a href="/" class="logo">🔮 Tarot</a>
      <div class="nav-links">
        <a href="/">Cards</a>
        <a href="/spread">Spreads</a>
        <a href="/search">Search</a>
      </div>
    </div>
  </nav>
  <main class="container">
    ${content}
  </main>
  <footer class="footer">
    <div class="container">
      <p>Tarot API - A mystical journey through the cards</p>
    </div>
  </footer>
</body>
</html>`;
}

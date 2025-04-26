const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');
const app = express();


// 1. Gerência o XLSX
if (!fs.existsSync('creepypastas.json')) {
    const workbook = XLSX.readFile('creepypastas.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    fs.writeFileSync('creepypastas.json', JSON.stringify(data));
  }

const creepypastas = require('./creepypastas.json');
const extractWords = (text) => (text || '').toLowerCase().match(/\b\w+\b/g) || [];
const countOccurrences = (array) => array.reduce((acc, item) => (acc[item] = (acc[item] || 0) + 1, acc), {});
const getTopN = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
const getYear = (dateStr) => {
  const d = new Date(dateStr);
  return isNaN(d) ? null : d.getFullYear();
};

const normalizeTag = (tag) => {
  const lowerTag = tag.toLowerCase();
  if (lowerTag === 'based on true events') return 'based on a true story';
  if (lowerTag === 'anonymously authored') return null; 
  return lowerTag;
};

// 2. Lista de histórias
app.get('/', (req, res) => {
  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Creepypastas</title>
      <style>
        :root {
          --primary-color: #8b0000;
          --secondary-color: #333;
          --accent-color: #d4af37;
          --light-bg: #f8f9fa;
          --dark-bg: #343a40;
          --card-shadow: 0 4px 8px rgba(0,0,0,0.1);
          --hover-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: var(--secondary-color);
          background-color: var(--light-bg);
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid var(--primary-color);
        }
        
        h1 {
          color: var(--primary-color);
          font-size: 2.2rem;
          margin: 0;
        }
        
        .button {
          display: inline-block;
          background-color: var(--primary-color);
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 30px;
          font-weight: bold;
          transition: all 0.3s ease;
          box-shadow: var(--card-shadow);
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .button:hover {
          background-color: #6b0000;
          transform: translateY(-2px);
          box-shadow: var(--hover-shadow);
        }
        
        .stories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .story-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: var(--card-shadow);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .story-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--hover-shadow);
        }
        
        .story-card h3 {
          color: var(--primary-color);
          margin-bottom: 10px;
          font-size: 1.3rem;
        }
        
        .story-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 10px 0;
          font-size: 0.9rem;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          background: var(--light-bg);
          padding: 5px 10px;
          border-radius: 20px;
        }
        
        .meta-item i {
          margin-right: 5px;
          color: var(--accent-color);
        }
        
        .read-link {
          display: inline-block;
          margin-top: 10px;
          color: var(--primary-color);
          font-weight: bold;
          text-decoration: none;
          transition: color 0.3s;
        }
        
        .read-link:hover {
          color: #6b0000;
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          h1 {
            font-size: 1.8rem;
          }
          
          .stories-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    </head>
    <body>
      <header>
        <h1><i class="fas fa-book-skull"></i> Creepypastas (Total: ${creepypastas.length})</h1>
        <a href="/dashboard" class="button"><i class="fas fa-chart-bar"></i> Dashboard</a>
      </header>
      
      <div class="stories-grid">
  `;

  creepypastas.forEach((story, i) => {
    html += `
      <div class="story-card">
        <h3>${story.story_name || 'Sem título'}</h3>
        <div class="story-meta">
          <span class="meta-item"><i class="fas fa-star"></i> ${story.average_rating || '-'}</span>
          <span class="meta-item"><i class="fas fa-tag"></i> ${story.categories || '-'}</span>
          <span class="meta-item"><i class="fas fa-clock"></i> ${story.estimated_reading_time || '-'} min</span>
          <span class="meta-item"><i class="fas fa-calendar"></i> ${story.publish_date || '-'}</span>
        </div>
        <p>${(story.tags || '').split(',').map(tag => `<span class="meta-item"><i class="fas fa-hashtag"></i> ${tag.trim()}</span>`).join('') || 'Sem tags'}</p>
        <a href="/story/${i}" class="read-link"><i class="fas fa-book-open"></i> Ler história</a>
      </div>
    `;
  });

  html += `
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

// 3. Página da história
app.get('/story/:id', (req, res) => {
  const id = +req.params.id;
  const story = creepypastas[id];
  if (!story) return res.status(404).send('História não encontrada');

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${story.story_name}</title>
      <style>
        :root {
          --primary-color: #8b0000;
          --secondary-color: #333;
          --light-bg: #f8f9fa;
          --dark-bg: #343a40;
        }
        
        body {
          font-family: 'Georgia', serif;
          line-height: 1.8;
          color: #444;
          background-color: var(--light-bg);
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .story-header {
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #ddd;
        }
        
        h1 {
          color: var(--primary-color);
          font-size: 2rem;
          margin-bottom: 10px;
        }
        
        .story-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
          font-size: 0.9rem;
          color: #666;
        }
        
        .story-content {
          font-size: 1.1rem;
          white-space: pre-line;
          margin-bottom: 40px;
        }
        
        .back-link {
          display: inline-block;
          padding: 10px 20px;
          background-color: var(--primary-color);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.3s;
        }
        
        .back-link:hover {
          background-color: #6b0000;
        }
        
        @media (max-width: 600px) {
          body {
            padding: 15px;
          }
          
          h1 {
            font-size: 1.6rem;
          }
          
          .story-content {
            font-size: 1rem;
          }
        }
      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    </head>
    <body>
      <div class="story-header">
        <h1>${story.story_name || 'Sem título'}</h1>
        <div class="story-meta">
          <span><i class="fas fa-star"></i> Nota: ${story.average_rating || '-'}</span>
          <span><i class="fas fa-tag"></i> Gênero: ${story.categories || '-'}</span>
          <span><i class="fas fa-clock"></i> Tempo de leitura: ${story.estimated_reading_time || '-'} min</span>
          <span><i class="fas fa-calendar"></i> ${story.publish_date || '-'}</span>
        </div>
      </div>
      
      <div class="story-content">
        ${story.body || 'Sem conteúdo'}
      </div>
      
      <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> Voltar</a>
    </body>
    </html>
  `);
});

// 4. Dashboard de estatísticas
app.get('/dashboard', (req, res) => {
  const tagCount = {}, genreCount = {}, genreRatings = {}, genreTimes = {};
  const yearTagTop = {}, yearGenreTop = {}, yearTimes = {};
  const allVerbs = [], allAdjs = [];
  let highestRated = null, lowestRated = null;

  creepypastas.forEach(story => {
    const words = extractWords(story.body);
    let tags = (story.tags || '').split(',').map(t => normalizeTag(t.trim())).filter(t => t);
    const genres = (story.categories || '').split(',').map(g => g.trim()).filter(g => g);
    const year = getYear(story.publish_date);
    const rating = parseFloat(story.average_rating) || 0;
    const time = parseFloat(story.estimated_reading_time) || 0;

    tags.forEach(tag => tagCount[tag] = (tagCount[tag] || 0) + 1);
    genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
      genreRatings[genre] = genreRatings[genre] || [];
      genreRatings[genre].push(rating);
      genreTimes[genre] = genreTimes[genre] || [];
      genreTimes[genre].push(time);
    });

    if (year) {
      yearTagTop[year] = yearTagTop[year] || {};
      tags.forEach(tag => yearTagTop[year][tag] = (yearTagTop[year][tag] || 0) + 1);

      yearGenreTop[year] = yearGenreTop[year] || {};
      genres.forEach(genre => yearGenreTop[year][genre] = (yearGenreTop[year][genre] || 0) + 1);

      yearTimes[year] = yearTimes[year] || [];
      yearTimes[year].push(time);
    }

    if (!highestRated || rating > highestRated.average_rating) highestRated = story;
    if (!lowestRated || rating < lowestRated.average_rating) lowestRated = story;

    words.forEach(w => {
      if (w.endsWith('ed') || w.endsWith('ing')) allVerbs.push(w);
      if (w.endsWith('y') || w.endsWith('ful') || w.endsWith('less')) allAdjs.push(w);
    });
  });

  const topTags = getTopN(tagCount, 10);
  const topGenres = getTopN(genreCount, 5);
  const topVerbs = getTopN(countOccurrences(allVerbs), 10);
  const topAdjs = getTopN(countOccurrences(allAdjs), 10);

  const avgHighTime = (
    creepypastas.filter(c => c.average_rating >= 4)
      .reduce((a, b) => a + (parseFloat(b.estimated_reading_time) || 0), 0)
    / creepypastas.filter(c => c.average_rating >= 4).length
  ).toFixed(1);

  const avgLowTime = (
    creepypastas.filter(c => c.average_rating <= 2)
      .reduce((a, b) => a + (parseFloat(b.estimated_reading_time) || 0), 0)
    / creepypastas.filter(c => c.average_rating <= 2).length
  ).toFixed(1);

  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - Estatísticas das Creepypastas</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
      <style>
        :root {
          --primary-color: #8b0000;
          --secondary-color: #333;
          --accent-color: #d4af37;
          --light-bg: #f8f9fa;
          --dark-bg: #343a40;
          --card-shadow: 0 4px 8px rgba(0,0,0,0.1);
          --hover-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: var(--secondary-color);
          background-color: var(--light-bg);
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        header {
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid var(--primary-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        h1 {
          color: var(--primary-color);
          font-size: 2.2rem;
        }
        
        .back-link {
          display: inline-block;
          padding: 10px 20px;
          background-color: var(--primary-color);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.3s;
        }
        
        .back-link:hover {
          background-color: #6b0000;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }
        
        .card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: var(--card-shadow);
        }
        
        .card h2 {
          color: var(--primary-color);
          margin-bottom: 15px;
          font-size: 1.4rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        
        .tag-list, .year-list {
          list-style: none;
        }
        
        .tag-list li, .year-list li {
          padding: 8px 0;
          border-bottom: 1px dashed #eee;
          display: flex;
          justify-content: space-between;
        }
        
        .tag-list li:last-child, .year-list li:last-child {
          border-bottom: none;
        }
        
        .tag-count {
          background: var(--light-bg);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.8rem;
        }
        
        .highlight-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-left: 4px solid var(--accent-color);
        }
        
        .chart-container {
          position: relative;
          height: 300px;
          margin-top: 20px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: var(--card-shadow);
        }
        
        .stat-item h3 {
          color: var(--primary-color);
          margin-bottom: 10px;
          font-size: 1.1rem;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--secondary-color);
        }
        
        @media (max-width: 768px) {
          header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          h1 {
            font-size: 1.8rem;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <header>
        <h1><i class="fas fa-chart-bar"></i> Dashboard - Estatísticas</h1>
        <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> Voltar</a>
      </header>
      
      <div class="stats-grid">
        <div class="stat-item">
          <h3><i class="fas fa-book"></i> Total de Histórias</h3>
          <p class="stat-value">${creepypastas.length}</p>
        </div>
        
        <div class="stat-item">
          <h3><i class="fas fa-star"></i> Melhor Avaliação</h3>
          <p class="stat-value">${highestRated.average_rating} <small>(${highestRated.story_name})</small></p>
        </div>
        
        <div class="stat-item">
          <h3><i class="fas fa-star-half-alt"></i> Pior Avaliação</h3>
          <p class="stat-value">${lowestRated.average_rating} <small>(${lowestRated.story_name})</small></p>
        </div>
        
        <div class="stat-item">
          <h3><i class="fas fa-clock"></i> Tempo Médio (Notas Altas)</h3>
          <p class="stat-value">${avgHighTime} min</p>
        </div>
        
        <div class="stat-item">
          <h3><i class="fas fa-clock"></i> Tempo Médio (Notas Baixas)</h3>
          <p class="stat-value">${avgLowTime} min</p>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="card">
          <h2><i class="fas fa-tags"></i> Top 10 Tags</h2>
          <ul class="tag-list">
            ${topTags.map(([tag, count]) => `
              <li>
                <span>${tag}</span>
                <span class="tag-count">${count}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <div class="card">
          <h2><i class="fas fa-calendar-alt"></i> Top Tags por Ano</h2>
          <ul class="year-list">
            ${Object.keys(yearTagTop).sort().map(year => {
              const tops = getTopN(yearTagTop[year], 2);
              return `
                <li>
                  <span>${year}</span>
                  <span>${tops.map(([tag]) => tag).join(', ')}</span>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
        
        <div class="card">
          <h2><i class="fas fa-language"></i> Análise de Texto</h2>
          <p><strong><i class="fas fa-running"></i> Verbos mais usados:</strong></p>
          <p>${topVerbs.map(v => v[0]).join(', ')}</p>
          <p><strong><i class="fas fa-adjust"></i> Adjetivos mais usados:</strong></p>
          <p>${topAdjs.map(a => a[0]).join(', ')}</p>
        </div>
        
        <div class="card highlight-card">
          <h2><i class="fas fa-lightbulb"></i> Curiosidades</h2>
          <p>Histórias com notas altas (≥4) têm tempo médio de leitura de <strong>${avgHighTime} minutos</strong>.</p>
          <p>Histórias com notas baixas (≤2) têm tempo médio de leitura de <strong>${avgLowTime} minutos</strong>.</p>
        </div>
      </div>
      
      <div class="card" style="grid-column: 1 / -1;">
        <h2><i class="fas fa-chart-bar"></i> Quantidade de Histórias por Gênero (Top 5)</h2>
        <div class="chart-container">
          <canvas id="genresChart"></canvas>
        </div>
      </div>
      
      <div class="card" style="grid-column: 1 / -1;">
        <h2><i class="fas fa-chart-line"></i> Evolução do Tempo Médio de Leitura</h2>
        <div class="chart-container">
          <canvas id="timesChart"></canvas>
        </div>
      </div>
      
      <script>
        // Gráfico de gêneros
        const genresCtx = document.getElementById('genresChart').getContext('2d');
        new Chart(genresCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(topGenres.map(g => g[0]))},
            datasets: [{
              label: 'Quantidade de Histórias',
              data: ${JSON.stringify(topGenres.map(g => g[1]))},
              backgroundColor: [
                'rgba(139, 0, 0, 0.7)',
                'rgba(0, 100, 0, 0.7)',
                'rgba(0, 0, 139, 0.7)',
                'rgba(139, 69, 19, 0.7)',
                'rgba(128, 0, 128, 0.7)'
              ],
              borderColor: [
                'rgba(139, 0, 0, 1)',
                'rgba(0, 100, 0, 1)',
                'rgba(0, 0, 139, 1)',
                'rgba(139, 69, 19, 1)',
                'rgba(128, 0, 128, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
        
        // Gráfico de tempo médio
        const yearLabels = ${JSON.stringify(Object.keys(yearTimes).sort())};
        const yearAvgTimes = ${JSON.stringify(Object.keys(yearTimes).sort().map(year => (
          (yearTimes[year].reduce((a, b) => a + b, 0) / yearTimes[year].length).toFixed(1)
        )))};
        
        const timesCtx = document.getElementById('timesChart').getContext('2d');
        new Chart(timesCtx, {
          type: 'line',
          data: {
            labels: yearLabels,
            datasets: [{
              label: 'Tempo Médio (minutos)',
              data: yearAvgTimes,
              borderColor: 'rgba(139, 0, 0, 1)',
              backgroundColor: 'rgba(139, 0, 0, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: false
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
// === State ===
let data = null;
let currentTab = 'longcot';
let sortCol = 'overall';
let sortDir = 'desc';

const TAB_DESCRIPTIONS = {
  longcot: '2,000 medium and hard questions.',
  longcot_mini: '500 easy questions.'
};

const DOMAIN_COLORS = {
  logic: '#4f46e5',
  cs: '#2563eb',
  chemistry: '#0d9488',
  chess: '#d97706',
  math: '#7c3aed'
};

const DOMAIN_LABELS = {
  logic: 'Logic',
  cs: 'CS',
  chemistry: 'Chemistry',
  chess: 'Chess',
  math: 'Math'
};

const MODEL_COLORS = {
  closed: '#7c3aed',
  open: '#059669'
};

// === Init ===
document.addEventListener('DOMContentLoaded', async () => {
  Chart.defaults.font.family = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-sans')
    .trim();
  initNav();
  initTabs();
  initExampleTabs();
  await loadData();
});

// === Data Loading ===
async function loadData() {
  try {
    const resp = await fetch('data/results.json');
    data = await resp.json();
  } catch (e) {
    console.warn('Fetch failed (file:// protocol?), using inline data');
    data = FALLBACK_DATA;
  }
  renderLeaderboard();
}

// Inline fallback for file:// protocol
const FALLBACK_DATA = {"last_updated":"2026-02-17","models":[{"name":"GPT 5.2","provider":"OpenAI","type":"closed","longcot":{"overall":9.83,"logic":12.0,"cs":9.8,"chemistry":10.1,"chess":7.4,"math":9.8},"longcot_mini":{"overall":38.7,"logic":53.6,"cs":40.4,"chemistry":37.0,"chess":36.7,"math":46.0},"avg_tokens":62046},{"name":"Gemini 3 Pro","provider":"Google","type":"closed","longcot":{"overall":6.08,"logic":1.5,"cs":4.1,"chemistry":12.5,"chess":4.9,"math":7.5},"longcot_mini":{"overall":22.1,"logic":7.3,"cs":17.0,"chemistry":45.0,"chess":16.0,"math":25.0},"avg_tokens":null},{"name":"Claude 4.5 Sonnet","provider":"Anthropic","type":"closed","longcot":{"overall":1.86,"logic":0.5,"cs":2.2,"chemistry":2.1,"chess":2.3,"math":2.2},"longcot_mini":{"overall":13.0,"logic":2.7,"cs":10.5,"chemistry":36.0,"chess":6.7,"math":9.0},"avg_tokens":null},{"name":"Grok 4.1 Fast","provider":"xAI","type":"closed","longcot":{"overall":2.04,"logic":0.0,"cs":3.1,"chemistry":1.8,"chess":0.0,"math":5.5},"longcot_mini":{"overall":10.4,"logic":0.9,"cs":12.3,"chemistry":24.0,"chess":2.0,"math":13.0},"avg_tokens":null},{"name":"DeepSeek V3.2","provider":"DeepSeek","type":"open","longcot":{"overall":1.52,"logic":0.3,"cs":1.5,"chemistry":0.6,"chess":1.4,"math":3.8},"longcot_mini":{"overall":8.3,"logic":2.7,"cs":13.8,"chemistry":11.6,"chess":1.3,"math":12.0},"avg_tokens":null},{"name":"Kimi K2 Thinking","provider":"Moonshot AI","type":"open","longcot":{"overall":1.24,"logic":0.5,"cs":0.7,"chemistry":0.3,"chess":1.4,"math":3.3},"longcot_mini":{"overall":7.5,"logic":2.7,"cs":11.7,"chemistry":12.2,"chess":4.0,"math":7.0},"avg_tokens":null},{"name":"GLM 4.7","provider":"Zhipu AI","type":"open","longcot":{"overall":0.48,"logic":0.0,"cs":0.4,"chemistry":0.3,"chess":1.7,"math":0.0},"longcot_mini":{"overall":5.9,"logic":0.9,"cs":8.8,"chemistry":11.0,"chess":2.7,"math":6.0},"avg_tokens":null}]};

// === Navigation ===
function initNav() {
  const nav = document.getElementById('navbar');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  });

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Close mobile menu on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

// === Leaderboard Tabs ===
function initTabs() {
  document.querySelectorAll('#leaderboard .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#leaderboard .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      renderLeaderboard();
    });
  });
}

// === Example Tabs ===
function initExampleTabs() {
  document.querySelectorAll('[data-example]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-example]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.example-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('example-' + btn.dataset.example).classList.add('active');
    });
  });
}

// === Render All Leaderboard Components ===
function renderLeaderboard() {
  if (!data) return;
  renderLeaderboardScope();
  renderOverallChart();
  renderTable();
  renderDomainChart();
}

function renderLeaderboardScope() {
  const scope = document.getElementById('leaderboard-scope');
  if (scope) {
    scope.textContent = TAB_DESCRIPTIONS[currentTab] || '';
  }
}

// === Overall Bar Chart ===
let overallChart = null;

function renderOverallChart() {
  const models = [...data.models].sort((a, b) => b[currentTab].overall - a[currentTab].overall);
  const canvas = document.getElementById('overallChart');
  const ctx = canvas.getContext('2d');
  const labels = models.map(m => formatModelLabel(m.name));

  canvas.parentElement.style.height = '440px';

  if (overallChart) overallChart.destroy();

  overallChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Overall Accuracy (%)',
        data: models.map(m => m[currentTab].overall),
        backgroundColor: models.map(m => m.type === 'open' ? MODEL_COLORS.open : MODEL_COLORS.closed),
        borderRadius: 4,
        barThickness: 42,
        maxBarThickness: 48,
        categoryPercentage: 0.9,
        barPercentage: 0.92
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 8, bottom: 4 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 60,
          ticks: {
            stepSize: 10,
            callback: value => `${value}%`,
            font: { family: Chart.defaults.font.family, size: 12, weight: '700' },
            padding: 8
          },
          title: {
            display: true,
            text: 'Accuracy (%)',
            font: { family: Chart.defaults.font.family, size: 13, weight: '700' }
          },
          grid: {
            color: context => (context.tick.value % 20 === 0 ? '#cbd5e1' : '#e2e8f0'),
            lineWidth: context => (context.tick.value % 20 === 0 ? 1.8 : 1)
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            font: { family: Chart.defaults.font.family, size: 11, weight: '700' },
            maxRotation: 0,
            minRotation: 0,
            padding: 10
          }
        }
      }
    }
  });
}

function formatModelLabel(name) {
  if (name.length <= 11 || !name.includes(' ')) {
    return name;
  }

  const words = name.split(' ');
  if (words.length === 2) {
    return words;
  }

  let splitIndex = 1;
  let bestDelta = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const left = words.slice(0, i).join(' ');
    const right = words.slice(i).join(' ');
    const delta = Math.abs(left.length - right.length);
    if (delta < bestDelta) {
      bestDelta = delta;
      splitIndex = i;
    }
  }

  return [
    words.slice(0, splitIndex).join(' '),
    words.slice(splitIndex).join(' ')
  ];
}

// === Sortable Table ===
function renderTable() {
  const tbody = document.querySelector('#leaderboard-table tbody');
  const models = [...data.models];
  const tabData = currentTab;

  // Sort
  models.sort((a, b) => {
    let va = a[tabData][sortCol] ?? a[sortCol] ?? a.name;
    let vb = b[tabData][sortCol] ?? b[sortCol] ?? b.name;
    if (sortCol === 'name' || sortCol === 'provider') {
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    }
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  // Assign ranks by overall score
  const ranked = [...models].sort((a, b) => b[tabData].overall - a[tabData].overall);
  const rankMap = new Map();
  ranked.forEach((m, i) => rankMap.set(m.name, i + 1));

  tbody.innerHTML = models.map(m => {
    const d = m[tabData];
    const badge = m.type === 'open'
      ? '<span class="badge badge-open">Open</span>'
      : '<span class="badge badge-closed">Closed</span>';
    return `<tr>
      <td class="rank-cell">${rankMap.get(m.name)}</td>
      <td><span class="model-name">${m.name}</span>${badge}</td>
      <td>${m.provider}</td>
      <td><strong>${d.overall.toFixed(2)}%</strong></td>
      <td>${d.logic.toFixed(1)}%</td>
      <td>${d.cs.toFixed(1)}%</td>
      <td>${d.chemistry.toFixed(1)}%</td>
      <td>${d.chess.toFixed(1)}%</td>
      <td>${d.math.toFixed(1)}%</td>
    </tr>`;
  }).join('');

  // Column sort handlers
  document.querySelectorAll('#leaderboard-table th').forEach(th => {
    th.onclick = () => {
      const col = th.dataset.sort;
      if (col === sortCol) {
        sortDir = sortDir === 'desc' ? 'asc' : 'desc';
      } else {
        sortCol = col;
        sortDir = (col === 'name' || col === 'provider') ? 'asc' : 'desc';
      }
      // Update header styles
      document.querySelectorAll('#leaderboard-table th').forEach(h => {
        h.classList.remove('sort-active', 'sort-desc', 'sort-asc');
      });
      th.classList.add('sort-active', sortDir === 'desc' ? 'sort-desc' : 'sort-asc');
      renderTable();
    };
  });
}

// === Per-Domain Grouped Bar Chart ===
let domainChart = null;

function renderDomainChart() {
  const domains = ['logic', 'cs', 'chemistry', 'chess', 'math'];
  const models = [...data.models].sort((a, b) => b[currentTab].overall - a[currentTab].overall);
  const ctx = document.getElementById('domainChart').getContext('2d');

  if (domainChart) domainChart.destroy();

  const datasets = domains.map(domain => ({
    label: DOMAIN_LABELS[domain],
    data: models.map(m => m[currentTab][domain]),
    backgroundColor: DOMAIN_COLORS[domain],
    borderRadius: 3,
    barPercentage: 0.85,
    categoryPercentage: 0.8,
    minBarLength: 0
  }));

  domainChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: models.map(m => m.name),
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 14, padding: 16, font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Accuracy (%)', font: { size: 12 } },
          grid: { color: '#f1f5f9' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

// === Copy to Clipboard ===
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('copied');
    }, 1500);
  });
}

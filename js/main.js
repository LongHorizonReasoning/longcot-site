// === State ===
let data = null;
let currentTrack = 'raw_llm';
let currentBenchmark = 'longcot';
let sortCol = 'overall';
let sortDir = 'desc';

const TRACK_DESCRIPTIONS = {
  raw_llm: 'Each question must be solved in a single model response, with no tools, scaffolds, or external code execution.',
  open_harness: 'Harnesses and tools are allowed, including writing solver code. This measures end-to-end system performance rather than isolated long-horizon reasoning.',
  restricted_harness: 'Harnesses and tools are allowed, but models may not write per-question solver code that bypasses the dependency structure. This keeps the reasoning burden on the model.'
};

const DOMAIN_COLORS = {
  logic: '#7c3aed',
  cs: '#2563eb',
  chemistry: '#0d9488',
  chess: '#d97706',
  math: '#c026d3'
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

const pendingStripePlugin = {
  id: 'pendingStripePlugin',
  afterDatasetsDraw(chart) {
    const { ctx, options } = chart;
    const horizontal = options.indexAxis === 'y';

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const pendingFlags = dataset.pendingFlags || [];
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((element, index) => {
        if (!pendingFlags[index]) return;

        const props = element.getProps(['x', 'y', 'base', 'width', 'height'], true);
        const left = horizontal ? Math.min(props.x, props.base) : props.x - props.width / 2;
        const top = horizontal ? props.y - props.height / 2 : Math.min(props.y, props.base);
        const width = horizontal ? Math.abs(props.x - props.base) : props.width;
        const height = horizontal ? props.height : Math.abs(props.base - props.y);

        if (width <= 0 || height <= 0) return;

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, width, height);
        ctx.clip();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 4;

        for (let offset = -height; offset < width + height; offset += 14) {
          ctx.beginPath();
          ctx.moveTo(left + offset, top + height);
          ctx.lineTo(left + offset + height, top);
          ctx.stroke();
        }

        ctx.restore();
      });
    });
  }
};

function isThinViewport() {
  return window.matchMedia('(max-width: 560px)').matches;
}

// === Init ===
document.addEventListener('DOMContentLoaded', async () => {
  Chart.defaults.font.family = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-sans')
    .trim();
  Chart.register(pendingStripePlugin);
  initNav();
  initTabs();
  initExampleTabs();
  window.addEventListener('resize', handleViewportChange);
  await loadData();
});

let resizeTimer = null;

function handleViewportChange() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (data) renderLeaderboard();
  }, 120);
}

// === Data Loading ===
async function loadData() {
  try {
    const resp = await fetch('data/results.json');
    data = await resp.json();
  } catch (e) {
    console.warn('Fetch failed (file:// protocol?), using inline data');
    data = FALLBACK_DATA;
  }
  normalizeLeaderboardData();
  renderLeaderboard();
}

// Inline fallback for file:// protocol
const FALLBACK_DATA = {"last_updated":"2026-02-17","models":[{"name":"GPT 5.2","provider":"OpenAI","type":"closed","longcot":{"overall":9.83,"logic":12.0,"cs":9.8,"chemistry":10.1,"chess":7.4,"math":9.8},"longcot_mini":{"overall":38.7,"logic":53.6,"cs":40.4,"chemistry":37.0,"chess":36.7,"math":46.0},"avg_tokens":62046,"contributor":"LongCoT Team","harness":{"raw_llm":null,"open_harness":null,"restricted_harness":null}},{"name":"Gemini 3 Pro","provider":"Google","type":"closed","longcot":{"overall":6.08,"logic":1.5,"cs":4.1,"chemistry":12.5,"chess":4.9,"math":7.5},"longcot_mini":{"overall":22.1,"logic":7.3,"cs":17.0,"chemistry":45.0,"chess":16.0,"math":25.0},"avg_tokens":null,"contributor":"LongCoT Team","harness":{"raw_llm":null,"open_harness":null,"restricted_harness":null}},{"name":"Claude 4.5 Sonnet","provider":"Anthropic","type":"closed","longcot":{"overall":1.86,"logic":0.5,"cs":2.2,"chemistry":2.1,"chess":2.3,"math":2.2},"longcot_mini":{"overall":13.0,"logic":2.7,"cs":10.5,"chemistry":36.0,"chess":6.7,"math":9.0},"avg_tokens":null,"contributor":"LongCoT Team","harness":{"raw_llm":null,"open_harness":null,"restricted_harness":null}},{"name":"Grok 4.1 Fast","provider":"xAI","type":"closed","longcot":{"overall":2.04,"logic":0.0,"cs":3.1,"chemistry":1.8,"chess":0.0,"math":5.5},"longcot_mini":{"overall":10.4,"logic":0.9,"cs":12.3,"chemistry":24.0,"chess":2.0,"math":13.0},"avg_tokens":null,"contributor":"LongCoT Team","harness":{"raw_llm":null,"open_harness":null,"restricted_harness":null}},{"name":"DeepSeek V3.2","provider":"DeepSeek","type":"open","longcot":{"overall":1.52,"logic":0.3,"cs":1.5,"chemistry":0.6,"chess":1.4,"math":3.8},"longcot_mini":{"overall":8.3,"logic":2.7,"cs":13.8,"chemistry":11.6,"chess":1.3,"math":12.0},"avg_tokens":null,"contributor":"LongCoT Team","harness":{"raw_llm":null,"open_harness":null,"restricted_harness":null}},{"name":"Kimi K2 Thinking","provider":"Moonshot AI","type":"open","longcot":{"overall":1.24,"logic":0.5,"cs":0.7,"chemistry":0.3,"chess":1.4,"math":3.3},"longcot_mini":{"overall":7.5,"logic":2.7,"cs":11.7,"chemistry":12.2,"chess":4.0,"math":7.0},"avg_tokens":null,"contributor":"LongCoT Team","harness":{"raw_llm":null,"open_harness":null,"restricted_harness":null}},{"name":"GLM 4.7","provider":"Zhipu AI","type":"open","longcot":{"overall":0.48,"logic":0.0,"cs":0.4,"chemistry":0.3,"chess":1.7,"math":0.0},"longcot_mini":{"overall":5.9,"logic":0.9,"cs":8.8,"chemistry":11.0,"chess":2.7,"math":6.0},"avg_tokens":null,"contributor":"LongCoT Team","harness":{"raw_llm":null,"open_harness":null,"restricted_harness":null}}]};

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
  document.querySelectorAll('[data-track]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-track]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTrack = btn.dataset.track;
      renderLeaderboard();
    });
  });

  document.querySelectorAll('[data-benchmark]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-benchmark]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBenchmark = btn.dataset.benchmark;
      renderLeaderboard();
    });
  });

  const miniToggle = document.querySelector('[data-benchmark-toggle]');
  if (miniToggle) {
    miniToggle.addEventListener('change', () => {
      currentBenchmark = miniToggle.checked ? 'longcot_mini' : 'longcot';
      renderLeaderboard();
    });
  }
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
  renderTrackDescription();
  renderOverallChart();
  renderTable();
  renderDomainChart();
}

function renderTrackDescription() {
  const desc = document.getElementById('leaderboard-track-desc');
  const benchmarkControls = document.getElementById('leaderboard-benchmark-controls');
  const harnessHeader = document.getElementById('leaderboard-harness-header');
  const miniToggle = document.querySelector('[data-benchmark-toggle]');
  if (desc) {
    desc.textContent = TRACK_DESCRIPTIONS[currentTrack] || '';
  }
  if (benchmarkControls) {
    benchmarkControls.style.display = currentTrack === 'raw_llm' ? '' : 'none';
  }
  if (harnessHeader) {
    harnessHeader.style.display = currentTrack === 'raw_llm' ? 'none' : '';
  }
  if (miniToggle) {
    miniToggle.checked = currentBenchmark === 'longcot_mini';
  }
}

function getActiveBenchmark() {
  return currentTrack === 'raw_llm' ? currentBenchmark : 'longcot';
}

function getActiveScores(model) {
  const benchmark = getActiveBenchmark();
  return model[currentTrack]?.[benchmark] ?? null;
}

function getTrackModels() {
  return data.models.filter(model => getActiveScores(model));
}

function normalizeLeaderboardData() {
  if (!data || !Array.isArray(data.models)) return;
  for (const model of data.models) {
    model.contributor = model.contributor ?? 'LongCoT Team';
    model.contributor_url = model.contributor_url ?? null;
    model.harness = model.harness ?? {};
    model.harness_url = model.harness_url ?? {};
    model.pending_verification = model.pending_verification ?? {};
    if (!model.raw_llm) {
      model.raw_llm = {
        longcot: model.longcot,
        longcot_mini: model.longcot_mini
      };
    }
    model.harness.raw_llm = null;
    model.open_harness = model.open_harness ?? null;
    model.restricted_harness = model.restricted_harness ?? null;
  }

  const gpt = data.models.find(model => model.name === 'GPT 5.2');
  if (gpt) {
    gpt.harness.open_harness = 'rlm';
    gpt.harness.restricted_harness = 'rlm';
    gpt.harness_url.open_harness = 'https://github.com/alexzhang13/rlm';
    gpt.harness_url.restricted_harness = 'https://github.com/alexzhang13/rlm';
    gpt.open_harness = {
      longcot: {
        overall: 25.12,
        logic: 68.3,
        cs: 26.7,
        chemistry: 0.0,
        chess: 30.6,
        math: 0.0
      }
    };
    gpt.restricted_harness = {
      longcot: {
        overall: 5.68,
        logic: 19.6,
        cs: 7.4,
        chemistry: 0.0,
        chess: 0.0,
        math: 1.4
      }
    };
  }

  const ensureModel = (name, provider) => {
    let model = data.models.find(entry => entry.name === name);
    if (!model) {
      model = {
        name,
        provider,
        type: 'open',
        contributor: 'Raymond Weitekamp',
        contributor_url: 'https://raw.works/',
        harness: { raw_llm: null, open_harness: null, restricted_harness: null },
        harness_url: {},
        pending_verification: {},
        raw_llm: null,
        open_harness: null,
        restricted_harness: null
      };
      data.models.push(model);
    }
    return model;
  };

  const qwen9b = ensureModel('Qwen 3.5 9B', 'Qwen');
  qwen9b.harness.open_harness = 'dspy.RLM';
  qwen9b.harness_url.open_harness = 'https://dspy.ai/api/modules/RLM/';
  qwen9b.pending_verification.open_harness = true;
  qwen9b.open_harness = {
    longcot: {
      overall: 15.59,
      logic: 56.7,
      cs: 0.0,
      chemistry: 0.0,
      chess: 21.8,
      math: 0.0
    }
  };

  const qwen27b = ensureModel('Qwen 3.5 27B', 'Qwen');
  qwen27b.harness.open_harness = 'dspy.RLM';
  qwen27b.harness_url.open_harness = 'https://dspy.ai/api/modules/RLM/';
  qwen27b.pending_verification.open_harness = true;
  qwen27b.open_harness = {
    longcot: {
      overall: 22.18,
      logic: 71.6,
      cs: 4.2,
      chemistry: 0.0,
      chess: 35.0,
      math: 0.0
    }
  };
}

// === Overall Bar Chart ===
let overallChart = null;

function renderOverallChart() {
  const models = [...getTrackModels()].sort((a, b) => getActiveScores(b).overall - getActiveScores(a).overall);
  const canvas = document.getElementById('overallChart');
  const ctx = canvas.getContext('2d');
  const thinViewport = isThinViewport();
  const labels = models.map(m => {
    const displayName = getChartLabel(m);
    return thinViewport ? formatHorizontalLabel(displayName) : formatModelLabel(displayName);
  });

  canvas.parentElement.style.height = thinViewport
    ? `${Math.max(360, models.length * 58 + 90)}px`
    : '440px';

  if (overallChart) overallChart.destroy();

  const overallScales = thinViewport
    ? {
        y: {
          afterFit: scale => {
            scale.width = 114;
          },
          grid: { display: false },
          ticks: {
            autoSkip: false,
            font: { family: Chart.defaults.font.family, size: 11, weight: '700' },
            padding: 8
          }
        },
        x: {
          min: 0,
          max: 60,
          afterFit: scale => {
            scale.height = 66;
          },
          ticks: {
            stepSize: 10,
            callback: value => `${value}%`,
            font: { family: Chart.defaults.font.family, size: 11, weight: '700' },
            padding: 6
          },
          title: {
            display: true,
            text: 'Accuracy (%)',
            font: { family: Chart.defaults.font.family, size: 12, weight: '700' },
            padding: { top: 12 }
          },
          grid: {
            color: '#e2e8f0',
            lineWidth: 1
          }
        }
      }
    : {
        y: {
          min: 0,
          max: 60,
          afterFit: scale => {
            scale.width = 64;
          },
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
            color: '#e2e8f0',
            lineWidth: 1
          }
        },
        x: {
          afterFit: scale => {
            scale.height = 64;
          },
          grid: { display: false },
          ticks: {
            autoSkip: false,
            font: { family: Chart.defaults.font.family, size: 11, weight: '700' },
            maxRotation: 0,
            minRotation: 0,
            padding: 10
          }
        }
      };

  overallChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Overall Accuracy (%)',
        data: models.map(m => getActiveScores(m).overall),
        backgroundColor: models.map(m => m.type === 'open' ? MODEL_COLORS.open : MODEL_COLORS.closed),
        pendingFlags: models.map(m => Boolean(m.pending_verification?.[currentTrack])),
        borderRadius: 4,
        barThickness: 42,
        maxBarThickness: 48,
        categoryPercentage: 0.9,
        barPercentage: 0.92
      }]
    },
    options: {
      indexAxis: thinViewport ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 8, bottom: 4 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${(thinViewport ? ctx.parsed.x : ctx.parsed.y).toFixed(2)}%`
          }
        }
      },
      scales: overallScales
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
  const models = [...getTrackModels()];

  // Sort
  models.sort((a, b) => {
    const aScores = getActiveScores(a);
    const bScores = getActiveScores(b);
    let va = aScores?.[sortCol] ?? a[sortCol] ?? a.harness?.[currentTrack] ?? a.name;
    let vb = bScores?.[sortCol] ?? b[sortCol] ?? b.harness?.[currentTrack] ?? b.name;
    if (sortCol === 'name' || sortCol === 'provider' || sortCol === 'harness' || sortCol === 'contributor') {
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    }
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  // Assign ranks by overall score
  const ranked = [...models].sort((a, b) => getActiveScores(b).overall - getActiveScores(a).overall);
  const rankMap = new Map();
  ranked.forEach((m, i) => rankMap.set(m.name, i + 1));

  tbody.innerHTML = models.map(m => {
    const d = getActiveScores(m);
    const harness = m.harness?.[currentTrack];
    const harnessUrl = m.harness_url?.[currentTrack];
    const pending = Boolean(m.pending_verification?.[currentTrack]);
    const badge = m.type === 'open'
      ? '<span class="badge badge-open">Open</span>'
      : '<span class="badge badge-closed">Closed</span>';
    const harnessCell = harnessUrl
      ? `<a href="${harnessUrl}" target="_blank" rel="noopener">${harness}</a>`
      : (harness || '—');
    const contributorCell = m.contributor_url
      ? `<a href="${m.contributor_url}" target="_blank" rel="noopener">${m.contributor}</a>`
      : m.contributor;
    const valueOrDash = value => value == null ? '—' : `${value.toFixed(1)}%`;
    return `<tr class="${pending ? 'pending-row' : ''}">
      <td class="rank-cell">${rankMap.get(m.name)}</td>
      <td><span class="model-name">${m.name}</span>${badge}</td>
      ${currentTrack === 'raw_llm' ? '' : `<td>${harnessCell}</td>`}
      <td>${m.provider}</td>
      <td><strong>${d.overall.toFixed(2)}%</strong></td>
      <td>${valueOrDash(d.logic)}</td>
      <td>${valueOrDash(d.cs)}</td>
      <td>${valueOrDash(d.chemistry)}</td>
      <td>${valueOrDash(d.chess)}</td>
      <td>${valueOrDash(d.math)}</td>
      <td>${contributorCell}</td>
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
  const models = [...getTrackModels()].sort((a, b) => getActiveScores(b).overall - getActiveScores(a).overall);
  const thinViewport = isThinViewport();
  const canvas = document.getElementById('domainChart');
  const note = document.getElementById('domain-chart-note');
  const ctx = canvas.getContext('2d');
  const hasDomainData = models.some(model =>
    domains.some(domain => getActiveScores(model)[domain] != null)
  );

  if (!hasDomainData) {
    if (domainChart) {
      domainChart.destroy();
      domainChart = null;
    }
    canvas.style.display = 'none';
    if (note) note.style.display = 'block';
    return;
  }

  canvas.style.display = '';
  if (note) note.style.display = 'none';

  canvas.parentElement.style.height = thinViewport
    ? `${Math.max(440, models.length * 86 + 96)}px`
    : '400px';

  if (domainChart) domainChart.destroy();

  const datasets = domains.map(domain => ({
    label: DOMAIN_LABELS[domain],
    data: models.map(m => getActiveScores(m)[domain] ?? 0),
    backgroundColor: DOMAIN_COLORS[domain],
    pendingFlags: models.map(m => Boolean(m.pending_verification?.[currentTrack])),
    borderRadius: 3,
    barPercentage: models.length <= 2 ? 0.55 : 0.85,
    categoryPercentage: models.length <= 2 ? 0.5 : 0.8,
    maxBarThickness: models.length <= 2 ? 26 : 32,
    minBarLength: 0
  }));

  const maxDomainScore = models.reduce((maxScore, model) => {
    const scores = getActiveScores(model);
    const domainMax = Math.max(...domains.map(domain => scores[domain] ?? 0));
    return Math.max(maxScore, domainMax);
  }, 0);
  const roundedDomainMax = Math.min(100, Math.max(10, Math.ceil((maxDomainScore * 2) / 10) * 10));

  const domainScales = thinViewport
    ? {
        y: {
          afterFit: scale => {
            scale.width = 114;
          },
          grid: { display: false },
          ticks: {
            autoSkip: false,
            font: { family: Chart.defaults.font.family, size: 11, weight: '700' },
            padding: 6
          }
        },
        x: {
          beginAtZero: true,
          max: roundedDomainMax,
          grid: {
            color: '#e2e8f0',
            lineWidth: 1
          },
          ticks: {
            stepSize: 10,
            callback: value => `${value}%`,
            font: { family: Chart.defaults.font.family, size: 11, weight: '700' },
            padding: 6
          },
          title: {
            display: true,
            text: 'Accuracy (%)',
            font: { family: Chart.defaults.font.family, size: 12, weight: '700' },
            padding: { top: 12 }
          }
        }
      }
    : {
        y: {
          beginAtZero: true,
          max: roundedDomainMax,
          title: {
            display: true,
            text: 'Accuracy (%)',
            font: { family: Chart.defaults.font.family, size: 12, weight: '700' }
          },
          ticks: { font: { family: Chart.defaults.font.family, size: 11, weight: '700' } },
          grid: {
            color: '#e2e8f0',
            lineWidth: 1
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            font: { family: Chart.defaults.font.family, size: 11, weight: '700' }
          }
        }
      };

  domainChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: models.map(m => {
        const displayName = getChartLabel(m);
        return thinViewport ? formatHorizontalLabel(displayName) : formatModelLabel(displayName);
      }),
      datasets
    },
    options: {
      indexAxis: thinViewport ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 14, padding: thinViewport ? 10 : 16, font: { size: thinViewport ? 11 : 12 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${(thinViewport ? ctx.parsed.x : ctx.parsed.y).toFixed(1)}%`
          }
        }
      },
      scales: domainScales
    }
  });
}

function formatHorizontalLabel(name) {
  if (name.length <= 12 || !name.includes(' ')) {
    return name;
  }

  const words = name.split(' ');
  if (words.length === 2 && name.length <= 18) {
    return words;
  }

  const chunks = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 11 && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

function getChartLabel(model) {
  const harness = model.harness?.[currentTrack];
  if (harness) {
    return `${model.name} + ${harness}`;
  }
  return model.name;
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

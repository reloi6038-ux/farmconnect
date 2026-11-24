(function () {
  const CHART_COLORS = {
    Tomatoes: '#dc2626',
    Maize: '#eab308',
    Rice: '#16a34a',
    Yam: '#92400e',
    Beans: '#7c3aed',
    Pepper: '#ea580c',
    Onions: '#ca8a04',
    Cassava: '#a16207'
  };
  const FALLBACK_COLORS = ['#14532d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#f59e0b', '#0ea5e9', '#8b5cf6'];

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let chart = null;
  let currentDays = 30;
  let currentSeries = null;
  let hiddenProducts = new Set();

  function colorFor(product, idx) {
    return CHART_COLORS[product] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
  }

  async function loadInsights() {
    const grid = document.getElementById('insightGrid');
    if (!grid) return;
    try {
      const res = await fetch('/api/market-prices/insights');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) throw new Error('Bad response');

      grid.innerHTML = data.data.map((card) => `
        <div class="insight-card tone-${card.tone || 'info'}">
          <div class="insight-icon">${card.icon}</div>
          <div class="insight-body">
            <div class="insight-title">${escapeHtml(card.title)}</div>
            <div class="insight-detail">${escapeHtml(card.detail)}</div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.warn('[insights]', e);
      grid.innerHTML = `
        <div class="insight-card tone-info">
          <div class="insight-icon">📊</div>
          <div class="insight-body">
            <div class="insight-title">Market data is being collected</div>
            <div class="insight-detail">Insights appear as more prices are tracked</div>
          </div>
        </div>`;
    }
  }

  async function loadTrends(days) {
    currentDays = days;
    const legend = document.getElementById('trendLegend');
    try {
      const res = await fetch(`/api/market-prices/trends?days=${days}`);
      const data = await res.json();
      if (!data.success) throw new Error('Bad response');
      currentSeries = data.series || {};

      const productNames = Object.keys(currentSeries);
      if (productNames.length === 0) {
        renderEmptyChart();
        if (legend) legend.innerHTML = '';
        return;
      }

      // Build unified date labels (union of all dates)
      const allDates = new Set();
      productNames.forEach((name) => {
        currentSeries[name].forEach((p) => allDates.add(p.date));
      });
      const labels = Array.from(allDates).sort();

      // Build datasets
      const datasets = productNames.map((name, idx) => {
        const map = {};
        currentSeries[name].forEach((p) => { map[p.date] = p.avg; });
        return {
          label: name,
          data: labels.map((d) => (map[d] !== undefined ? map[d] : null)),
          borderColor: colorFor(name, idx),
          backgroundColor: colorFor(name, idx) + '20',
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: colorFor(name, idx),
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          spanGaps: true,
          hidden: hiddenProducts.has(name)
        };
      });

      renderChart(labels, datasets);
      renderLegend(productNames);
    } catch (e) {
      console.warn('[trends]', e);
      renderEmptyChart();
    }
  }

  function renderChart(labels, datasets) {
    const canvas = document.getElementById('trendChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chart) { chart.destroy(); }

    chart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: prefersReduced ? false : { duration: 800 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#14532d',
            titleColor: '#fff',
            bodyColor: '#dcfce7',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                if (ctx.parsed.y == null) return null;
                return `${ctx.dataset.label}: ₦${ctx.parsed.y.toLocaleString()}/kg`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 8,
              color: '#6b7280',
              font: { size: 11 }
            }
          },
          y: {
            beginAtZero: false,
            grid: { color: '#f3f4f6' },
            ticks: {
              color: '#6b7280',
              font: { size: 11 },
              callback: (v) => '₦' + Number(v).toLocaleString()
            }
          }
        }
      }
    });
  }

  function renderLegend(products) {
    const legend = document.getElementById('trendLegend');
    if (!legend) return;
    legend.innerHTML = products.map((name, idx) => {
      const color = colorFor(name, idx);
      const hidden = hiddenProducts.has(name) ? 'hidden' : '';
      return `
        <button class="legend-chip ${hidden}" data-product="${escapeHtml(name)}" type="button">
          <span class="legend-dot" style="background:${color}"></span>
          <span>${escapeHtml(name)}</span>
        </button>`;
    }).join('');

    legend.querySelectorAll('.legend-chip').forEach((chip) => {
      chip.onclick = () => {
        const product = chip.dataset.product;
        if (hiddenProducts.has(product)) hiddenProducts.delete(product);
        else hiddenProducts.add(product);
        chip.classList.toggle('hidden');
        if (chart) {
          const dataset = chart.data.datasets.find((d) => d.label === product);
          if (dataset) {
            dataset.hidden = hiddenProducts.has(product);
            chart.update();
          }
        }
      };
    });
  }

  function renderEmptyChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const wrap = canvas.parentElement;
    wrap.innerHTML = `
      <div class="trend-empty">
        <div style="font-size:2.5rem;margin-bottom:.5rem">📊</div>
        <p style="font-weight:600;color:var(--forest)">Price trends will appear here</p>
        <p style="font-size:.85rem">As more market prices are tracked, historical trends will display on this chart.</p>
        <a href="/market-prices.html" class="btn btn-primary btn-sm" style="margin-top:1rem">Browse market prices</a>
      </div>`;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadInsights();
    loadTrends(30);

    document.querySelectorAll('.range-btn').forEach((btn) => {
      btn.onclick = () => {
        document.querySelectorAll('.range-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        loadTrends(Number(btn.dataset.days));
      };
    });
  });
})();

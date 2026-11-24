// Shared market-price comparison helper.
// Fetches all market prices once, caches them, then does local matching.
// No per-card API calls — one request total.

(function () {
  let marketCache = null;
  let cacheTime = 0;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async function loadMarketPrices() {
    if (marketCache && Date.now() - cacheTime < CACHE_TTL) {
      return marketCache;
    }
    try {
      const res = await fetch('/api/market-prices?limit=200');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        marketCache = data.data;
        cacheTime = Date.now();
        return marketCache;
      }
    } catch (e) {
      console.warn('[market-compare]', e);
    }
    return [];
  }

  function normalize(s) {
    return String(s || '').toLowerCase().trim();
  }

  /**
   * Compare a produce's asking price against market data.
   * @param {Object} produce - { productName, category, state, price, unit }
   * @returns {Object|null} - { marketAvg, marketMin, marketMax, delta, deltaPct, direction, marketName, source, trend } or null
   */
  function compare(produce, marketPrices) {
    if (!produce || !produce.price || !marketPrices || !marketPrices.length) return null;

    const productName = normalize(produce.productName);
    const categoryName = normalize(produce.category && produce.category.name ? produce.category.name : produce.category);
    const state = normalize(produce.state);
    const unit = normalize(produce.unit || 'kg');

    // Try progressively broader matches
    let candidates = [];

    // 1. Exact product + state
    candidates = marketPrices.filter(m =>
      normalize(m.product) === productName &&
      normalize(m.state) === state &&
      normalize(m.unit) === unit
    );

    // 2. Product + any state (national)
    if (!candidates.length) {
      candidates = marketPrices.filter(m =>
        normalize(m.product) === productName &&
        normalize(m.unit) === unit
      );
    }

    // 3. Category + state
    if (!candidates.length && categoryName) {
      candidates = marketPrices.filter(m =>
        normalize(m.category) === categoryName &&
        normalize(m.state) === state &&
        normalize(m.unit) === unit
      );
    }

    // 4. Category + any state
    if (!candidates.length && categoryName) {
      candidates = marketPrices.filter(m =>
        normalize(m.category) === categoryName &&
        normalize(m.unit) === unit
      );
    }

    if (!candidates.length) return null;

    // Use the most recent match
    candidates.sort((a, b) => new Date(b.priceDate) - new Date(a.priceDate));
    const ref = candidates[0];

    const marketAvg = Number(ref.averagePrice) || 0;
    if (marketAvg === 0) return null;

    const delta = Number(produce.price) - marketAvg;
    const deltaPct = (delta / marketAvg) * 100;

    let direction, label, className, emoji;
    if (deltaPct <= -5) {
      direction = 'below';
      label = 'Good Deal';
      className = 'compare-good';
      emoji = '🟢';
    } else if (deltaPct >= 5) {
      direction = 'above';
      label = 'Above Market';
      className = 'compare-high';
      emoji = '🔴';
    } else {
      direction = 'within';
      label = 'Fair Price';
      className = 'compare-fair';
      emoji = '🟡';
    }

    return {
      marketAvg,
      marketMin: Number(ref.minPrice) || 0,
      marketMax: Number(ref.maxPrice) || 0,
      delta,
      deltaPct: Math.round(deltaPct * 10) / 10,
      direction,
      label,
      className,
      emoji,
      marketName: ref.market || '',
      marketState: ref.state || '',
      source: ref.source || '',
      trend: ref.trend || 'stable',
      priceDate: ref.priceDate
    };
  }

  /**
   * Render a compact badge for a product card.
   */
  function renderBadge(comparison) {
    if (!comparison) {
      return `<span class="compare-badge compare-none" title="No market data available">⚪ No price data</span>`;
    }
    const sign = comparison.deltaPct > 0 ? '+' : '';
    return `<span class="compare-badge ${comparison.className}" title="Market avg: ${fmtNaira(comparison.marketAvg)}/${'unit'}">${comparison.emoji} ${comparison.label} · ${sign}${comparison.deltaPct}%</span>`;
  }

  /**
   * Render a full comparison card for the produce-details page.
   */
  function renderFullCard(comparison, produce) {
    if (!comparison) {
      return `<div class="compare-card compare-none"><p class="text-muted" style="margin:0">⚪ No market price data available for this produce in ${escapeHtml(produce.state || 'Nigeria')}.</p></div>`;
    }
    const sign = comparison.deltaPct > 0 ? '+' : '';
    const arrow = comparison.trend === 'increasing' ? '↑' : comparison.trend === 'decreasing' ? '↓' : '→';

    return `
      <div class="compare-card ${comparison.className}">
        <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:.5rem">
          <div>
            <div style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;opacity:.85">Is this a good price?</div>
            <div style="font-size:1.15rem;font-weight:800;margin-top:.25rem">${comparison.emoji} ${comparison.label}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.5rem;font-weight:800">${sign}${comparison.deltaPct}%</div>
            <div style="font-size:.78rem;opacity:.85">vs market average</div>
          </div>
        </div>
        <div class="compare-details">
          <div><span class="text-muted">Your price:</span> <strong>${fmtNaira(produce.price)}/${escapeHtml(produce.unit)}</strong></div>
          <div><span class="text-muted">Market avg:</span> <strong>${fmtNaira(comparison.marketAvg)}/${escapeHtml(produce.unit)}</strong></div>
          <div><span class="text-muted">Market range:</span> ${fmtNaira(comparison.marketMin)} – ${fmtNaira(comparison.marketMax)}</div>
          <div><span class="text-muted">Source:</span> ${escapeHtml(comparison.marketName)}${comparison.marketState ? ', ' + escapeHtml(comparison.marketState) : ''}</div>
          <div><span class="text-muted">Trend:</span> ${arrow} ${escapeHtml(comparison.trend)}</div>
          <div><span class="text-muted">As of:</span> ${fmtDate(comparison.priceDate)}</div>
        </div>
        <div style="font-size:.72rem;opacity:.7;margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(0,0,0,.1)">
          Market prices are informational averages from regional surveys. Always verify with the farmer before purchase.
        </div>
      </div>
    `;
  }

  window.MarketCompare = {
    load: loadMarketPrices,
    compare: compare,
    renderBadge: renderBadge,
    renderFullCard: renderFullCard
  };
})();

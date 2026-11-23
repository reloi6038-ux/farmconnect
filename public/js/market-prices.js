async function load() {
  const tb = document.getElementById('priceTbody');
  tb.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Loading...</td></tr>';
  const params = new URLSearchParams({
    search: document.getElementById('search').value,
    state: document.getElementById('state').value,
    sort: document.getElementById('sort').value
  });
  try {
    const r = await API.get('/market-prices?' + params);
    if (!r.data.length) { tb.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No market prices match your filters.</td></tr>'; return; }
    tb.innerHTML = r.data.map(p => {
      const arrow = p.trend === 'increasing' ? '↑' : p.trend === 'decreasing' ? '↓' : '→';
      const cls = p.trend === 'increasing' ? 'badge-red' : p.trend === 'decreasing' ? 'badge-green' : 'badge-gray';
      return `<tr>
        <td><strong>${escapeHtml(p.product)}</strong></td>
        <td>${escapeHtml(p.category)}</td>
        <td>${escapeHtml(p.market)}</td>
        <td>${escapeHtml(p.state)}</td>
        <td>${fmtNaira(p.minPrice)}</td>
        <td>${fmtNaira(p.maxPrice)}</td>
        <td><strong>${fmtNaira(p.averagePrice)}</strong></td>
        <td><span class="badge ${cls}">${arrow} ${escapeHtml(p.trend)}</span></td>
        <td>${fmtDate(p.priceDate)}</td>
      </tr>`;
    }).join('');
  } catch (e) { tb.innerHTML = `<tr><td colspan="9" class="text-center" style="color:var(--danger)">${escapeHtml(e.message)}</td></tr>`; }
}
document.addEventListener('DOMContentLoaded', () => {
  load();
  document.getElementById('applyBtn').onclick = load;
  document.getElementById('search').addEventListener('keydown', e => { if (e.key === 'Enter') load(); });
});

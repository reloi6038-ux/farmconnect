let page = 1;
const params = new URLSearchParams(location.search);

function readFilters() {
  return {
    search: document.getElementById('search').value.trim(),
    category: document.getElementById('category').value,
    state: document.getElementById('state').value.trim(),
    sort: document.getElementById('sort').value,
    organic: document.getElementById('organic').value
  };
}

function writeUrl(f) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
  if (page > 1) p.set('page', String(page));
  const qs = p.toString();
  history.replaceState({}, '', qs ? '?' + qs : location.pathname);
}

async function loadCategories() {
  try {
    const r = await API.get('/categories');
    const sel = document.getElementById('category');
    r.data.forEach(c => { sel.innerHTML += `<option value="${c._id}">${escapeHtml(c.name)}</option>`; });
  } catch (e) { console.error(e); }
}

function renderCard(p) {
  const img = (p.images && p.images.length) ? `<img src="${p.images[0]}" alt="${escapeHtml(p.productName)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : '🌿';
  return `
    <div class="product-card">
      <div class="product-img">${img}</div>
      <div class="card-body">
        <div class="flex gap-1 flex-wrap">
          <span class="badge badge-green">${escapeHtml(p.category && p.category.name || 'Produce')}</span>
          ${p.organic ? '<span class="badge badge-gold">Organic</span>' : ''}
          ${p.availabilityStatus === 'sold' ? '<span class="badge badge-red">Sold</span>' : ''}
        </div>
        <h3>${escapeHtml(p.productName)}</h3>
        <div class="price">${fmtNaira(p.price)}<span style="font-size:.8rem;color:var(--muted);font-weight:500"> /${escapeHtml(p.unit)}</span></div>
        <div class="meta">${p.quantity} ${escapeHtml(p.unit)} available</div>
        <div class="meta">📍 ${escapeHtml(p.location)}, ${escapeHtml(p.state)}</div>
        <div class="farmer-line">👨‍🌾 ${escapeHtml(p.farmer && p.farmer.name || 'Farmer')} ${p.farmer && p.farmer.verified ? '✅' : ''}</div>
        <a href="/produce-details.html?id=${p._id}" class="btn btn-primary btn-sm btn-block" style="margin-top:.5rem">View Details</a>
      </div>
    </div>`;
}

function renderPagination(pg) {
  const el = document.getElementById('pagination');
  if (!pg || pg.totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  if (pg.hasPreviousPage) html += `<button class="btn btn-secondary btn-sm" data-page="${pg.currentPage - 1}">← Prev</button>`;
  const total = pg.totalPages;
  const cur = pg.currentPage;
  const start = Math.max(1, cur - 2);
  const end = Math.min(total, cur + 2);
  for (let i = start; i <= end; i++) {
    html += `<button class="btn ${i === cur ? 'btn-primary' : 'btn-secondary'} btn-sm" data-page="${i}">${i}</button>`;
  }
  if (pg.hasNextPage) html += `<button class="btn btn-secondary btn-sm" data-page="${pg.currentPage + 1}">Next →</button>`;
  el.innerHTML = html;
  el.querySelectorAll('[data-page]').forEach(b => { b.onclick = () => { page = Number(b.dataset.page); load(); window.scrollTo({ top: 0, behavior: 'smooth' }); }; });
}

async function load() {
  const grid = document.getElementById('grid');
  grid.innerHTML = skeletonCards(8);
  const f = readFilters();
  writeUrl(f);
  const p = new URLSearchParams({ page, limit: 12 });
  Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });

  try {
    const r = await API.get('/produce?' + p.toString());
    if (!r.data.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="emoji">🔍</div><h3>No produce matches your filters</h3><p class="text-muted mt-1">Try adjusting your search or clearing filters.</p></div>`;
      document.getElementById('resultCount').textContent = '0 results';
    } else {
      grid.innerHTML = r.data.map(renderCard).join('');
      document.getElementById('resultCount').textContent = `${r.pagination.totalItems} produce found — page ${r.pagination.currentPage} of ${r.pagination.totalPages}`;
    }
    renderPagination(r.pagination);
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="emoji">⚠️</div><h3>Couldn't load produce</h3><p class="text-muted">${escapeHtml(e.message)}</p></div>`;
  }
}

function hydrateFromUrl() {
  if (params.get('search')) document.getElementById('search').value = params.get('search');
  if (params.get('state')) document.getElementById('state').value = params.get('state');
  if (params.get('sort')) document.getElementById('sort').value = params.get('sort');
  if (params.get('organic')) document.getElementById('organic').value = params.get('organic');
  if (params.get('page')) page = Number(params.get('page'));
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  if (params.get('category')) document.getElementById('category').value = params.get('category');
  hydrateFromUrl();
  load();

  document.getElementById('applyBtn').onclick = () => { page = 1; load(); };
  document.getElementById('clearBtn').onclick = () => {
    ['search', 'state'].forEach(id => document.getElementById(id).value = '');
    ['category', 'organic'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('sort').value = 'newest';
    page = 1;
    load();
  };
  document.getElementById('search').addEventListener('keydown', e => { if (e.key === 'Enter') { page = 1; load(); } });
});


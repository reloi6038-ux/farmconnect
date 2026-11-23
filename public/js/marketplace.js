const MAX_PRICE = 10000;
let page = 1;
let categories = [];

const $ = (id) => document.getElementById(id);

function readFilters() {
  const grades = Array.from(document.querySelectorAll('.f-grade:checked')).map((c) => c.value);
  const minPrice = Number($('f-price-min').value);
  const maxPrice = Number($('f-price-max').value);
  return {
    search: $('f-search').value.trim(),
    category: $('f-category').value,
    state: $('f-state').value.trim(),
    minPrice: minPrice > 0 ? minPrice : '',
    maxPrice: maxPrice < MAX_PRICE ? maxPrice : '',
    minQuantity: $('f-minQty').value.trim(),
    grade: grades.length ? grades.join(',') : '',
    availability: $('f-availability').value,
    harvestFrom: $('f-harvestFrom').value,
    harvestTo: $('f-harvestTo').value,
    organic: $('f-organic').checked ? 'true' : '',
    featured: $('f-featured').checked ? 'true' : '',
    sort: $('f-sort').value
  };
}

function writeUrl(filters) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
  if (page > 1) p.set('page', String(page));
  const qs = p.toString();
  history.replaceState({}, '', qs ? '?' + qs : location.pathname);
}

function applyFiltersToUI(filters) {
  $('f-search').value = filters.search || '';
  $('f-category').value = filters.category || '';
  $('f-state').value = filters.state || '';
  $('f-minQty').value = filters.minQuantity || '';
  $('f-availability').value = filters.availability || '';
  $('f-harvestFrom').value = filters.harvestFrom || '';
  $('f-harvestTo').value = filters.harvestTo || '';
  $('f-organic').checked = filters.organic === 'true';
  $('f-featured').checked = filters.featured === 'true';
  $('f-sort').value = filters.sort || 'newest';

  const minP = Number(filters.minPrice) || 0;
  const maxP = Number(filters.maxPrice) || MAX_PRICE;
  $('f-price-min').value = minP;
  $('f-price-max').value = maxP;

  const grades = (filters.grade || '').split(',').filter(Boolean);
  document.querySelectorAll('.f-grade').forEach((c) => {
    c.checked = grades.includes(c.value);
  });

  updatePriceUI();
}

function updatePriceUI() {
  let minV = Number($('f-price-min').value);
  let maxV = Number($('f-price-max').value);
  if (minV > maxV - 50) { minV = maxV - 50; $('f-price-min').value = minV; }
  if (maxV < minV + 50) { maxV = minV + 50; $('f-price-max').value = maxV; }
  const leftPct = (minV / MAX_PRICE) * 100;
  const rightPct = (maxV / MAX_PRICE) * 100;
  $('priceFill').style.left = leftPct + '%';
  $('priceFill').style.width = (rightPct - leftPct) + '%';
  $('priceMinLabel').textContent = '₦' + minV.toLocaleString();
  $('priceMaxLabel').textContent = maxV >= MAX_PRICE ? '₦' + MAX_PRICE.toLocaleString() + '+' : '₦' + maxV.toLocaleString();
}

function renderChips(filters) {
  const labels = {
    search: 'Search',
    category: 'Category',
    state: 'State',
    minPrice: 'Min ₦',
    maxPrice: 'Max ₦',
    minQuantity: 'Min qty',
    grade: 'Grade',
    availability: 'Status',
    harvestFrom: 'Harvest from',
    harvestTo: 'Harvest to',
    organic: 'Organic',
    featured: 'Featured'
  };
  const chips = [];
  Object.entries(filters).forEach(([k, v]) => {
    if (!v || k === 'sort') return;
    let display = v;
    if (k === 'category') {
      const c = categories.find((x) => x._id === v);
      display = c ? c.name : v;
    }
    if (k === 'organic' || k === 'featured') display = 'Yes';
    chips.push(`<span class="filter-chip">${labels[k] || k}: ${escapeHtml(display)} <button data-chip="${k}">×</button></span>`);
  });
  $('activeFilters').innerHTML = chips.join('');
  document.querySelectorAll('[data-chip]').forEach((b) => {
    b.onclick = () => {
      const key = b.dataset.chip;
      if (key === 'organic') $('f-organic').checked = false;
      else if (key === 'featured') $('f-featured').checked = false;
      else if (key === 'grade') document.querySelectorAll('.f-grade').forEach((c) => (c.checked = false));
      else if (key === 'minPrice') $('f-price-min').value = 0;
      else if (key === 'maxPrice') $('f-price-max').value = MAX_PRICE;
      else if (['search', 'state', 'minQuantity', 'harvestFrom', 'harvestTo'].includes(key)) $(`f-${key}`).value = '';
      else if (key === 'category') $('f-category').value = '';
      else if (key === 'availability') $('f-availability').value = '';
      updatePriceUI();
      page = 1;
      load();
    };
  });
  const activeCount = chips.length;
  $('mobileFilterCount').textContent = activeCount > 0 ? `(${activeCount})` : '';
}

async function loadCategories() {
  try {
    const r = await API.get('/categories');
    categories = r.data;
    const sel = $('f-category');
    sel.innerHTML = '<option value="">All categories</option>' +
      r.data.map((c) => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join('');
  } catch (e) { console.error(e); }
}

function renderCard(p) {
  const img = (p.images && p.images.length)
    ? `<img src="${p.images[0]}" alt="${escapeHtml(p.productName)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
    : '🌿';
  return `
    <div class="product-card">
      <div class="product-img">${img}</div>
      <div class="card-body">
        <div class="flex gap-1 flex-wrap">
          <span class="badge badge-green">${escapeHtml(p.category && p.category.name || 'Produce')}</span>
          ${p.organic ? '<span class="badge badge-gold">Organic</span>' : ''}
          ${p.featured ? '<span class="badge badge-blue">Featured</span>' : ''}
          <span class="badge badge-gray">Grade ${escapeHtml(p.qualityGrade || 'A')}</span>
          ${p.availabilityStatus === 'sold' ? '<span class="badge badge-red">Sold</span>' : ''}
        </div>
        <h3>${escapeHtml(p.productName)}</h3>
        <div class="price">${fmtNaira(p.price)}<span style="font-size:.8rem;color:var(--muted);font-weight:500"> /${escapeHtml(p.unit)}</span></div>
        <div class="meta">${p.quantity} ${escapeHtml(p.unit)} available</div>
        <div class="meta">📍 ${escapeHtml(p.location)}, ${escapeHtml(p.state)}</div>
        ${p.reviewCount > 0 ? `<div class="farmer-line"><span class="stars">${Array.from({length:5}, (_,i) => `<span class="${i < Math.round(p.rating) ? 'filled' : ''}">★</span>`).join('')}</span> <span style="font-size:.8rem;color:var(--muted);margin-left:.25rem">${p.rating} (${p.reviewCount})</span></div>` : ''}
        <div class="farmer-line">👨‍🌾 ${escapeHtml(p.farmer && p.farmer.name || 'Farmer')} ${p.farmer && p.farmer.verified ? '✅' : ''}</div>
        <a href="/produce-details.html?id=${p._id}" class="btn btn-primary btn-sm btn-block" style="margin-top:.5rem">View Details</a>
      </div>
    </div>`;
}

function renderPagination(pg) {
  const el = $('pagination');
  if (!pg || pg.totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  if (pg.hasPreviousPage) html += `<button class="btn btn-secondary btn-sm" data-page="${pg.currentPage - 1}">← Prev</button>`;
  const start = Math.max(1, pg.currentPage - 2);
  const end = Math.min(pg.totalPages, pg.currentPage + 2);
  for (let i = start; i <= end; i++) {
    html += `<button class="btn ${i === pg.currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm" data-page="${i}">${i}</button>`;
  }
  if (pg.hasNextPage) html += `<button class="btn btn-secondary btn-sm" data-page="${pg.currentPage + 1}">Next →</button>`;
  el.innerHTML = html;
  el.querySelectorAll('[data-page]').forEach((b) => {
    b.onclick = () => { page = Number(b.dataset.page); load(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  });
}

async function load() {
  const grid = $('grid');
  grid.innerHTML = skeletonCards(8);
  const filters = readFilters();
  writeUrl(filters);
  renderChips(filters);

  const p = new URLSearchParams({ page, limit: 12 });
  Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });

  try {
    const r = await API.get('/produce?' + p.toString());
    if (!r.data.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="emoji">🔍</div><h3>No produce matches your filters</h3><p class="text-muted mt-1">Try broadening your search or clearing some filters.</p></div>`;
      $('resultCount').textContent = '0 results';
    } else {
      grid.innerHTML = r.data.map(renderCard).join('');
      $('resultCount').textContent = `${r.pagination.totalItems} produce found — page ${r.pagination.currentPage} of ${r.pagination.totalPages}`;
    }
    renderPagination(r.pagination);
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="emoji">⚠️</div><h3>Couldn't load produce</h3><p class="text-muted">${escapeHtml(e.message)}</p></div>`;
  }
}

function hydrateFromUrl() {
  const params = new URLSearchParams(location.search);
  const filters = {
    search: params.get('search') || '',
    category: params.get('category') || '',
    state: params.get('state') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    minQuantity: params.get('minQuantity') || '',
    grade: params.get('grade') || '',
    availability: params.get('availability') || '',
    harvestFrom: params.get('harvestFrom') || '',
    harvestTo: params.get('harvestTo') || '',
    organic: params.get('organic') || '',
    featured: params.get('featured') || '',
    sort: params.get('sort') || 'newest'
  };
  if (params.get('page')) page = Number(params.get('page'));
  applyFiltersToUI(filters);
}

// -------- Filter Presets --------
async function loadPresets() {
  if (!API.token()) { $('presetSection').style.display = 'none'; return; }
  try {
    const r = await API.get('/filter-presets');
    $('presetSection').style.display = 'block';
    $('presetList').innerHTML = r.data.length
      ? r.data.map((p) => `<div class="preset-item"><span data-load="${p._id}" data-filters='${JSON.stringify(p.filters).replace(/'/g, "&#39;")}'>⭐ ${escapeHtml(p.name)}</span><button data-del="${p._id}">×</button></div>`).join('')
      : '<p class="text-muted" style="font-size:.82rem">No saved presets yet.</p>';

    $('presetList').querySelectorAll('[data-load]').forEach((el) => {
      el.onclick = () => {
        const f = JSON.parse(el.dataset.filters);
        applyFiltersToUI({ ...readFilters(), ...f });
        page = 1;
        load();
      };
    });
    $('presetList').querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = async (ev) => {
        ev.stopPropagation();
        await API.delete('/filter-presets/' + b.dataset.del);
        loadPresets();
      };
    });
  } catch (_) { $('presetSection').style.display = 'none'; }
}

$('savePresetBtn').onclick = async () => {
  const name = prompt('Name this preset (e.g. "Cheap tomatoes in Kaduna"):');
  if (!name) return;
  try {
    const filters = readFilters();
    Object.keys(filters).forEach((k) => { if (!filters[k]) delete filters[k]; });
    await API.post('/filter-presets', { name, filters });
    toast('Preset saved');
    loadPresets();
  } catch (e) { toast(e.message, 'error'); }
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  hydrateFromUrl();
  load();
  loadPresets();

  // Dynamic breadcrumb if category is in URL
  if (window.renderBreadcrumbs) {
    const catId = new URLSearchParams(location.search).get('category');
    if (catId) {
      const cat = categories.find(c => c._id === catId);
      if (cat) {
        window.renderBreadcrumbs([
          { label: 'Home', href: '/' },
          { label: 'Marketplace', href: '/marketplace.html' },
          { label: cat.name }
        ]);
      }
    }
  }

  // Price slider
  $('f-price-min').addEventListener('input', updatePriceUI);
  $('f-price-max').addEventListener('input', updatePriceUI);

  // Apply / reset
  $('applyFilters').onclick = () => { page = 1; load(); };
  $('resetFilters').onclick = () => {
    applyFiltersToUI({ sort: 'newest' });
    page = 1;
    load();
  };

  // Enter key on text inputs
  ['f-search', 'f-state', 'f-minQty'].forEach((id) => {
    $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') { page = 1; load(); } });
  });

  // Mobile toggle
  $('mobileFilterToggle').onclick = () => $('filterPanel').classList.toggle('open');
});



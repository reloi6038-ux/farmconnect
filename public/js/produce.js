const produceId = new URLSearchParams(location.search).get('id');
let currentProduce = null;

async function loadDetails() {
  const container = document.getElementById('detailContainer');
  try {
    const r = await API.get('/produce/' + produceId);
    currentProduce = r.data;
    const p = r.data;
    const farmer = p.farmer || {};
    const cat = p.category || {};

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start" class="detail-grid">
        <div>
          ${(p.images && p.images.length)
            ? `<div class="card" style="overflow:hidden"><img src="${p.images[0]}" alt="${escapeHtml(p.productName)}" style="width:100%;height:auto;display:block"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:.5rem;padding:.5rem">${p.images.slice(1).map(src => `<img src="${src}" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;cursor:pointer" onclick="document.querySelector('.card img').src='${src}'">`).join('')}</div></div>`
            : `<div class="card" style="aspect-ratio:4/3;display:grid;place-items:center;font-size:8rem;background:linear-gradient(135deg,#dcfce7,#f0fdf4)">🌿</div>`}
        </div>
        <div>
          <div class="flex gap-1 flex-wrap mb-2">
            <span class="badge badge-green">${escapeHtml(cat.name || 'Produce')}</span>
            ${p.organic ? '<span class="badge badge-gold">Organic</span>' : ''}
            <span class="badge ${p.availabilityStatus === 'available' ? 'badge-green' : 'badge-red'}">${escapeHtml(p.availabilityStatus)}</span>
            <span class="badge badge-blue">Grade ${escapeHtml(p.qualityGrade || 'A')}</span>
          </div>
          <h1 style="color:var(--forest);font-size:2.2rem;margin-bottom:.5rem">${escapeHtml(p.productName)}</h1>
          <div class="price" style="font-size:2rem">${fmtNaira(p.price)}<span style="font-size:.9rem;color:var(--muted);font-weight:500"> /${escapeHtml(p.unit)}</span></div>
          <p class="text-muted mt-2">${escapeHtml(p.description || 'No description provided.')}</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin:1.5rem 0;font-size:.9rem" class="specs">
            <div><span class="text-muted">Quantity:</span> <strong>${p.quantity} ${escapeHtml(p.unit)}</strong></div>
            <div><span class="text-muted">Min order:</span> <strong>${p.minimumOrder || 1} ${escapeHtml(p.unit)}</strong></div>
            <div><span class="text-muted">Location:</span> <strong>${escapeHtml(p.location)}</strong></div>
            <div><span class="text-muted">State:</span> <strong>${escapeHtml(p.state)}</strong></div>
            <div><span class="text-muted">Views:</span> <strong>${p.views || 0}</strong></div>
            <div><span class="text-muted">Saved:</span> <strong>${p.favoriteCount || 0}</strong></div>
          </div>

          <div class="card" style="background:var(--beige);border:none"><div class="card-body">
            <div class="flex items-center gap-2">
              <div style="font-size:2rem">👨‍🌾</div>
              <div>
                <div style="font-weight:700">${escapeHtml(farmer.name || 'Farmer')} ${farmer.verified ? '✅ Verified' : ''}</div>
                <div class="text-muted" style="font-size:.85rem">${escapeHtml(farmer.location || '')}${farmer.location && farmer.state ? ', ' : ''}${escapeHtml(farmer.state || '')}</div>
              </div>
            </div>
            ${farmer.phone ? `<div class="mt-2" style="font-size:.9rem"><span class="text-muted">Phone:</span> ${escapeHtml(farmer.phone)}</div>` : ''}
          </div></div>

          <div class="flex gap-1 mt-3" style="flex-wrap:wrap">
            <button class="btn btn-primary" style="flex:1" id="enquiryBtn">Send Enquiry</button>
            <button class="btn btn-secondary" style="flex:1" id="favBtn">♡ Save</button>
          </div>
        </div>
      </div>`;

    document.getElementById('eSubject').value = 'Enquiry: ' + p.productName;
    document.getElementById('eQty').value = Math.max(1, p.minimumOrder || 1);
    document.getElementById('ePrice').value = p.price;

    document.getElementById('enquiryBtn').onclick = () => {
      if (!API.token()) { location.href = '/login.html'; return; }
      if (API.role() === 'farmer') { toast('Farmers cannot enquire on produce', 'error'); return; }
      openModal('enquiryModal');
    };

    document.getElementById('enquiryForm').onsubmit = submitEnquiry;

    document.getElementById('favBtn').onclick = toggleFavorite;
    if (API.token()) checkFavorite();

    loadRelated();
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><h3>Produce not found</h3><p class="text-muted mt-1">${escapeHtml(e.message)}</p><a href="/marketplace.html" class="btn btn-primary mt-2">Back to Marketplace</a></div>`;
  }
}

async function checkFavorite() {
  try {
    const r = await API.get('/favorites/check/' + produceId);
    const btn = document.getElementById('favBtn');
    if (r.favorited) btn.innerHTML = '♥ Saved';
  } catch (_) {}
}

async function toggleFavorite() {
  if (!API.token()) { location.href = '/login.html'; return; }
  const btn = document.getElementById('favBtn');
  const isSaved = btn.innerHTML.includes('♥');
  try {
    if (isSaved) { await API.delete('/favorites/' + produceId); btn.innerHTML = '♡ Save'; toast('Removed from favorites'); }
    else { await API.post('/favorites', { produceId }); btn.innerHTML = '♥ Saved'; toast('Added to favorites'); }
  } catch (e) { toast(e.message, 'error'); }
}

async function submitEnquiry(ev) {
  ev.preventDefault();
  try {
    await API.post('/enquiries', {
      produceId,
      subject: document.getElementById('eSubject').value,
      quantityRequested: Number(document.getElementById('eQty').value),
      offerPrice: Number(document.getElementById('ePrice').value) || undefined,
      message: document.getElementById('eMsg').value
    });
    toast('Enquiry sent successfully');
    closeModal('enquiryModal');
    document.getElementById('enquiryForm').reset();
  } catch (e) { toast(e.message, 'error'); }
}

async function loadRelated() {
  try {
    const r = await API.get('/produce/' + produceId + '/related');
    if (!r.data.length) return;
    document.getElementById('relatedSection').style.display = 'block';
    document.getElementById('relatedGrid').innerHTML = r.data.map(p => `
      <div class="product-card">
        <div class="product-img">🌿</div>
        <div class="card-body">
          <h3>${escapeHtml(p.productName)}</h3>
          <div class="price">${fmtNaira(p.price)}/${escapeHtml(p.unit)}</div>
          <div class="meta">${escapeHtml(p.location)}, ${escapeHtml(p.state)}</div>
          <a href="/produce-details.html?id=${p._id}" class="btn btn-secondary btn-sm btn-block" style="margin-top:.5rem">View</a>
        </div>
      </div>`).join('');
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', () => {
  if (!produceId) { location.href = '/marketplace.html'; return; }
  loadDetails();
});


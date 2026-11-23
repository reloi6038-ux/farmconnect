async function animateNumber(el, target) {
  target = Number(target) || 0;
  if (target === 0) { el.textContent = '0'; return; }
  const step = Math.max(1, Math.ceil(target / 30));
  let cur = 0;
  await new Promise(res => {
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); res(); }
      el.textContent = cur.toLocaleString();
    }, 30);
  });
}

async function loadFarmerDashboard() {
  if (!requireAuth('farmer')) return;
  document.getElementById('userName').textContent = API.name() || 'Farmer';
  try {
    const [stats, mine, enq] = await Promise.all([
      API.get('/farmers/me/stats'),
      API.get('/produce/mine'),
      API.get('/enquiries/mine')
    ]);
    animateNumber(document.getElementById('statTotal'), stats.data.totalListings);
    animateNumber(document.getElementById('statActive'), stats.data.activeListings);
    animateNumber(document.getElementById('statSold'), stats.data.soldListings);
    animateNumber(document.getElementById('statEnq'), enq.data.length);
    animateNumber(document.getElementById('statViews'), stats.data.totalViews);
    animateNumber(document.getElementById('statFavs'), stats.data.totalFavorites);

    const tb = document.getElementById('listingsTbody');
    if (!mine.data.length) { tb.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No listings yet. <a href="/add-produce.html">Add your first produce</a></td></tr>'; }
    else {
      tb.innerHTML = mine.data.map(x => `
        <tr>
          <td style="display:flex;align-items:center;gap:.6rem">
            ${(x.images && x.images.length) ? `<img src="${x.images[0]}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0">` : `<div style="width:44px;height:44px;border-radius:6px;background:var(--beige);display:grid;place-items:center;flex-shrink:0">🌿</div>`}
            <div><strong>${escapeHtml(x.productName)}</strong><br><small class="text-muted">${escapeHtml(x.category && x.category.name || '')}</small></div>
          </td>
          <td>${fmtNaira(x.price)}/${escapeHtml(x.unit)}</td>
          <td>${x.quantity}</td>
          <td><span class="badge ${x.availabilityStatus === 'available' ? 'badge-green' : x.availabilityStatus === 'sold' ? 'badge-red' : 'badge-gray'}">${escapeHtml(x.availabilityStatus)}</span></td>
          <td>${x.views || 0}</td>
          <td>
            <a href="/edit-produce.html?id=${x._id}" class="btn btn-secondary btn-sm">Edit</a>
            <button class="btn btn-danger btn-sm" data-del="${x._id}">Delete</button>
          </td>
        </tr>`).join('');
      tb.querySelectorAll('[data-del]').forEach(b => {
        b.onclick = async () => {
          if (!confirm('Delete this listing permanently?')) return;
          try { await API.delete('/produce/' + b.dataset.del); toast('Listing deleted'); location.reload(); }
          catch (e) { toast(e.message, 'error'); }
        };
      });
    }
  } catch (e) { toast(e.message, 'error'); }
}

async function loadBuyerDashboard() {
  if (!requireAuth('buyer')) return;
  document.getElementById('userName').textContent = API.name() || 'Buyer';
  try {
    const [enq, fav] = await Promise.all([API.get('/enquiries/mine'), API.get('/favorites')]);
    animateNumber(document.getElementById('statFavs'), fav.data.length);
    animateNumber(document.getElementById('statEnq'), enq.data.length);
    animateNumber(document.getElementById('statPending'), enq.data.filter(x => x.status === 'pending').length);
    animateNumber(document.getElementById('statResponded'), enq.data.filter(x => x.status === 'responded').length);

    const tb = document.getElementById('enqTbody');
    if (!enq.data.length) tb.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No enquiries yet. <a href="/marketplace.html">Browse produce</a></td></tr>';
    else {
      tb.innerHTML = enq.data.slice(0, 5).map(x => `
        <tr>
          <td><strong>${escapeHtml(x.produce && x.produce.productName || '—')}</strong></td>
          <td>${escapeHtml(x.farmer && x.farmer.name || '—')}</td>
          <td><span class="badge badge-green">${escapeHtml(x.status)}</span></td>
          <td class="text-muted" style="font-size:.85rem">${fmtRelative(x.createdAt)}</td>
        </tr>`).join('');
    }

    const grid = document.getElementById('favGrid');
    const favItems = fav.data.filter(f => f.produce);
    if (!favItems.length) grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="emoji">♡</div><p>No saved produce yet.</p></div>';
    else {
      grid.innerHTML = favItems.slice(0, 4).map(f => `
        <div class="product-card">
          <div class="product-img">🌿</div>
          <div class="card-body">
            <h3>${escapeHtml(f.produce.productName)}</h3>
            <div class="price">${fmtNaira(f.produce.price)}</div>
            <a href="/produce-details.html?id=${f.produce._id}" class="btn btn-primary btn-sm btn-block mt-1">View</a>
          </div>
        </div>`).join('');
    }
  } catch (e) { toast(e.message, 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname;
  if (path.includes('farmer-dashboard')) loadFarmerDashboard();
  else if (path.includes('buyer-dashboard')) loadBuyerDashboard();
});


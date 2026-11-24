const produceId = new URLSearchParams(location.search).get('id');
let currentProduce = null;

async function loadDetails() {
  const container = document.getElementById('detailContainer');
  try {
    const r = await API.get('/produce/' + produceId);
    currentProduce = r.data;
    const p = r.data;

    // Update breadcrumbs with real produce name
    if (window.renderBreadcrumbs) {
      window.renderBreadcrumbs([
        { label: 'Home', href: '/' },
        { label: 'Marketplace', href: '/marketplace.html' },
        { label: p.category && p.category.name ? p.category.name : 'Produce', href: '/marketplace.html?category=' + (p.category ? p.category._id : '') },
        { label: p.productName }
      ]);
    }

    // Price comparison card
    if (window.MarketCompare) {
      try {
        const marketPrices = await window.MarketCompare.load();
        const cmp = window.MarketCompare.compare(p, marketPrices);
        const box = document.getElementById('priceCompareBox');
        if (box) box.innerHTML = window.MarketCompare.renderFullCard(cmp, p);
      } catch (e) { console.warn('[compare]', e); }
    }
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
          <div id="produceRatingBlock" style="margin-bottom:.75rem"></div>
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

          <div id="priceCompareBox"></div>

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
      </div>

      <div id="produceReviewsSection" style="margin-top:3rem">
        <h2 style="color:var(--forest);font-size:1.5rem;margin-bottom:1rem">Reviews for this produce</h2>
        <div id="produceReviewsList"></div>
        <div id="produceReviewForm" style="display:none;margin-top:1.5rem">
          <div class="card" style="background:var(--beige);border:none"><div class="card-body">
            <h3 style="margin-bottom:1rem;font-size:1.15rem;color:var(--forest)">Leave a review</h3>
            <form id="pr-form" onsubmit="submitProduceReview(event)">
              <div class="form-group">
                <label>Your Rating *</label>
                <div id="pr-stars" class="star-input" role="radiogroup" aria-label="Rating">
                  <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
                </div>
                <input type="hidden" id="pr-rating" value="0">
              </div>
              <div class="form-group"><label>Title *</label><input class="form-control" id="pr-title" maxlength="120" required placeholder="Summarize your experience"></div>
              <div class="form-group"><label>Your Review *</label><textarea class="form-control" id="pr-body" maxlength="800" required placeholder="How was the produce quality, freshness, and delivery?"></textarea></div>
              <button type="submit" class="btn btn-primary" id="pr-submit">Submit Review</button>
            </form>
          </div></div>
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
    renderProduceRating(p);
    loadProduceReviews();
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
  setTimeout(initProduceReviewForm, 500);
});




// -------- PRODUCE RATINGS & REVIEWS --------
function starsHtml(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += `<span class="${i <= Math.round(rating) ? 'filled' : ''}">★</span>`;
  return `<span class="stars">${s}</span>`;
}

function renderProduceRating(p) {
  const el = document.getElementById('produceRatingBlock');
  if (!el) return;
  if (!p.reviewCount) {
    el.innerHTML = '<span class="text-muted" style="font-size:.88rem">⭐ No reviews yet — be the first to review after enquiring</span>';
    return;
  }
  el.innerHTML = `${starsHtml(p.rating)} <strong style="color:var(--forest)">${p.rating} / 5</strong> <span class="text-muted" style="font-size:.88rem">(${p.reviewCount} review${p.reviewCount === 1 ? '' : 's'})</span>`;
}

async function loadProduceReviews() {
  const section = document.getElementById('produceReviewsSection');
  if (!section) return;
  try {
    const r = await API.get('/reviews/produce/' + produceId);
    const listEl = document.getElementById('produceReviewsList');
    const formEl = document.getElementById('produceReviewForm');

    if (!r.data.length) {
      listEl.innerHTML = '<p class="text-muted" style="font-size:.9rem">No reviews yet.</p>';
    } else {
      listEl.innerHTML = r.data.map(rv => {
        const initials = (rv.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return `
          <div class="card mb-2"><div class="card-body">
            <div class="flex justify-between items-center flex-wrap gap-1">
              <div style="display:flex;align-items:center;gap:.6rem">
                <div class="avatar-circle">${initials}</div>
                <div>
                  <strong>${escapeHtml(rv.name)}</strong>
                  <div style="font-size:.82rem;color:var(--muted)">${escapeHtml(rv.location || 'Buyer')}</div>
                </div>
              </div>
              <div>${starsHtml(rv.rating)}</div>
            </div>
            <h4 style="margin:.5rem 0 .25rem;color:var(--forest)">${escapeHtml(rv.title)}</h4>
            <p style="font-size:.92rem;line-height:1.6">${escapeHtml(rv.body)}</p>
            <small class="text-muted">${fmtRelative(rv.createdAt)}</small>
          </div></div>`;
      }).join('');
    }

    // Show form if eligible
    if (API.token()) {
      try {
        const el = await API.get('/reviews/eligibility/' + produceId);
        if (el.canReview) {
          formEl.style.display = 'block';
        } else if (el.reason) {
          formEl.innerHTML = `<p class="text-muted" style="font-size:.88rem;padding:1rem;background:var(--beige);border-radius:8px">${escapeHtml(el.reason)}</p>`;
          formEl.style.display = 'block';
        }
      } catch (_) {}
    } else {
      formEl.innerHTML = `<p class="text-muted" style="font-size:.88rem;padding:1rem;background:var(--beige);border-radius:8px"><a href="/login.html">Login</a> and send an enquiry on this produce to leave a review.</p>`;
      formEl.style.display = 'block';
    }
  } catch (e) {
    console.error(e);
  }
}

async function submitProduceReview(ev) {
  ev.preventDefault();
  const rating = Number(document.getElementById('pr-rating').value);
  if (rating < 1) { toast('Please select a rating', 'error'); return; }
  const btn = document.getElementById('pr-submit');
  btn.disabled = true; btn.textContent = 'Submitting…';
  try {
    await API.post('/reviews/produce/' + produceId, {
      rating,
      title: document.getElementById('pr-title').value.trim(),
      body: document.getElementById('pr-body').value.trim()
    });
    toast('Review submitted — thank you!');
    const p = await API.get('/produce/' + produceId);
    renderProduceRating(p.data);
    loadProduceReviews();
    document.getElementById('pr-form').reset();
    document.querySelectorAll('#pr-stars span').forEach(s => s.classList.remove('active'));
    document.getElementById('pr-rating').value = 0;
    btn.disabled = false; btn.textContent = 'Submit Review';
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Submit Review';
  }
}

function initProduceReviewForm() {
  const starWrap = document.getElementById('pr-stars');
  if (!starWrap) return;
  const ratingInput = document.getElementById('pr-rating');
  let current = 0;
  function paint(n) { starWrap.querySelectorAll('span').forEach((s, i) => s.classList.toggle('active', i < n)); }
  starWrap.querySelectorAll('span').forEach((s) => {
    s.addEventListener('mouseover', () => paint(Number(s.dataset.val)));
    s.addEventListener('mouseleave', () => paint(current));
    s.addEventListener('click', () => { current = Number(s.dataset.val); ratingInput.value = current; paint(current); });
  });
}





function toast(msg, type) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : type === 'info' ? ' info' : '');
  el.innerHTML = `<span>${escapeHtml(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 250); }, 3500);
}
window.toast = toast;

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}
window.openModal = openModal;
window.closeModal = closeModal;

const BRAND_IMG = '<img src="/favicon.svg" alt="FarmConnect" width="36" height="36" style="border-radius:10px;display:block" loading="lazy">';

function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const token = API.token();
  const role = API.role();
  const name = API.name();
  let links = '';
  if (token) {
    if (role === 'farmer') links += '<li><a href="/farmer-dashboard.html">Dashboard</a></li>';
    if (role === 'buyer') links += '<li><a href="/buyer-dashboard.html">Dashboard</a></li>';
    if (role === 'admin') links += '<li><a href="/admin/dashboard.html">Admin</a></li>';
    links += '<li><a href="/notifications.html" class="notif-bell" title="Notifications">🔔<span class="notif-count" id="navNotifCount"></span></a></li>';
    links += `<li><a href="/profile.html" title="Profile">👤 ${escapeHtml(name || 'Account')}</a></li>`;
    links += '<li><a href="#" id="logoutBtn">Logout</a></li>';
  } else {
    links = '<li><a href="/login.html">Login</a></li><li><a href="/register.html" class="btn btn-primary btn-sm">Join Now</a></li>';
  }
  nav.innerHTML = `
    <div class="nav-inner">
      <a href="/" class="brand">${BRAND_IMG} FarmConnect</a>
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
      <ul class="nav-links" id="navLinks">
        <li><a href="/marketplace.html">Marketplace</a></li>
        <li><a href="/farmers.html">Farmers</a></li>
        <li><a href="/market-prices.html">Market Prices</a></li>
        <li><a href="/about.html">About</a></li>
        ${links}
      </ul>
    </div>`;

  const toggle = document.getElementById('navToggle');
  if (toggle) toggle.onclick = () => document.getElementById('navLinks').classList.toggle('open');
  const lo = document.getElementById('logoutBtn');
  if (lo) lo.onclick = (e) => {
    e.preventDefault();
    clearSession();
    location.href = '/';
  };
  if (token) updateNotifBadge();
}

async function updateNotifBadge() {
  const el = document.getElementById('navNotifCount');
  if (!el) return;
  try {
    const r = await API.get('/notifications/unread-count');
    if (r.unread > 0) { el.textContent = r.unread > 9 ? '9+' : r.unread; el.style.display = 'inline-block'; }
    else el.style.display = 'none';
  } catch (_) {}
}

function renderFooter() {
  const f = document.getElementById('footer');
  if (!f) return;
  f.innerHTML = `
    <div class="footer"><div class="container">
      <div class="footer-grid">
        <div>
          <div class="brand" style="color:#fff;margin-bottom:1rem">${BRAND_IMG}<span style="margin-left:.5rem">FarmConnect</span></div>
          <p>Connecting smallholder farmers directly to better markets across Nigeria.</p>
        </div>
        <div>
          <h4>Farmers</h4>
          <a href="/register.html">Join as Farmer</a>
          <a href="/farmer-dashboard.html">Farmer Dashboard</a>
          <a href="/market-prices.html">Market Prices</a>
        </div>
        <div>
          <h4>Buyers</h4>
          <a href="/marketplace.html">Marketplace</a>
          <a href="/register.html">Join as Buyer</a>
          <a href="/buyer-dashboard.html">Buyer Dashboard</a>
        </div>
        <div>
          <h4>Support</h4>
          <a href="/contact.html">Contact</a>
          <a href="/faq.html">FAQ</a>
          <a href="/about.html">About</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="/terms.html">Terms</a>
          <a href="/privacy.html">Privacy</a>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} FarmConnect. All rights reserved. Made in Nigeria 🇳🇬</div>
    </div></div>`;
}

function skeletonCards(n) {
  return Array.from({ length: n }).map(() =>
    `<div class="product-card"><div class="skeleton" style="aspect-ratio:4/3"></div>
    <div class="card-body"><div class="skeleton" style="height:16px;width:60%"></div>
    <div class="skeleton mt-1" style="height:20px;width:40%"></div>
    <div class="skeleton mt-1" style="height:14px;width:80%"></div></div></div>`
  ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});

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
  renderBreadcrumbs();
  renderPresenceWidget();
  renderFooter();
});

// ---------- BREADCRUMBS ----------
function getBreadcrumbsFromPath() {
  const path = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
  const p = new URLSearchParams(location.search);
  const role = localStorage.getItem('fmc_role');

  // Home
  const trail = [{ label: 'Home', href: '/' }];

  // Admin routes
  if (path.startsWith('admin/')) {
    const adminPage = path.replace('admin/', '');
    const map = {
      dashboard: 'Dashboard',
      users: 'Users',
      produce: 'Produce',
      categories: 'Categories',
      'market-prices': 'Market Prices',
      enquiries: 'Enquiries',
      messages: 'Messages',
      reviews: 'Reviews',
      login: 'Login'
    };
    trail.push({ label: 'Admin', href: '/admin/dashboard.html' });
    if (map[adminPage] && adminPage !== 'dashboard') trail.push({ label: map[adminPage] });
    if (adminPage === 'login') trail.splice(1, 1);
    return trail;
  }

  // Public + dashboard routes
  const map = {
    '': 'Home',
    'marketplace': 'Marketplace',
    'farmers': 'Farmers',
    'farmer-profile': 'Farmer Profile',
    'market-prices': 'Market Prices',
    'about': 'About',
    'contact': 'Contact',
    'faq': 'FAQ',
    'terms': 'Terms',
    'privacy': 'Privacy',
    'login': 'Login',
    'register': 'Register',
    'produce-details': 'Produce Details',
    'farmer-dashboard': 'Dashboard',
    'buyer-dashboard': 'Dashboard',
    'add-produce': 'Add Produce',
    'edit-produce': 'Edit Produce',
    'enquiries': 'Enquiries',
    'favorites': 'Favorites',
    'notifications': 'Notifications',
    'profile': 'Profile'
  };

  if (path === '') return trail; // homepage — no breadcrumbs

  // Dashboard children
  const dashboardChildren = ['add-produce', 'edit-produce', 'enquiries', 'favorites', 'notifications', 'profile'];
  if (dashboardChildren.includes(path)) {
    const dashHref = role === 'farmer' ? '/farmer-dashboard.html' : role === 'buyer' ? '/buyer-dashboard.html' : '/';
    trail.push({ label: 'Dashboard', href: dashHref });
    trail.push({ label: map[path] });
    return trail;
  }

  // Direct children
  if (map[path]) {
    trail.push({ label: map[path], href: null });
    return trail;
  }

  // Fallback
  trail.push({ label: path.charAt(0).toUpperCase() + path.slice(1) });
  return trail;
}

function renderBreadcrumbs(items) {
  const container = document.getElementById('breadcrumbs');
  if (!container) return;

  const trail = items || window.BREADCRUMBS || getBreadcrumbsFromPath();
  if (!trail || trail.length <= 1) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  const html = trail.map((item, i) => {
    const isLast = i === trail.length - 1;
    const icon = i === 0 ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:.3rem"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' : '';
    if (isLast || !item.href) {
      return `<li style="display:inline-flex;align-items:center;color:var(--muted);font-weight:500">${icon}${escapeHtml(item.label)}</li>`;
    }
    return `<li style="display:inline-flex;align-items:center"><a href="${item.href}" style="display:inline-flex;align-items:center;color:var(--forest)">${icon}${escapeHtml(item.label)}</a></li>`;
  }).join('<li style="display:inline-flex;align-items:center;color:var(--border);margin:0 .5rem" aria-hidden="true">›</li>');

  container.innerHTML = `<nav aria-label="Breadcrumb"><ol style="list-style:none;display:flex;flex-wrap:wrap;align-items:center;gap:.25rem;padding:0;margin:0;font-size:.85rem">${html}</ol></nav>`;
  container.style.display = 'block';
}

window.renderBreadcrumbs = renderBreadcrumbs;
window.getBreadcrumbsFromPath = getBreadcrumbsFromPath;


// ---------- Live Presence Widget ----------
function renderPresenceWidget() {
  // Don't show on admin pages
  if (location.pathname.startsWith('/admin/')) return;

  // Create the widget container
  const widget = document.createElement('div');
  widget.id = 'presenceWidget';
  widget.className = 'presence-widget';
  widget.innerHTML = `
    <button class="presence-toggle" id="presenceToggle" aria-expanded="false" aria-controls="presencePanel" type="button">
      <span class="presence-dot"></span>
      <span class="presence-text" id="presenceText">Connecting…</span>
    </button>
    <div class="presence-panel" id="presencePanel" role="region" aria-label="Farmers online">
      <div class="presence-header">
        <strong>Farmers Online Now</strong>
        <button class="presence-close" id="presenceClose" aria-label="Close" type="button">×</button>
      </div>
      <div class="presence-list" id="presenceList">
        <div class="presence-empty">Loading…</div>
      </div>
      <div class="presence-footer">
        <a href="/farmers.html">See all farmers →</a>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  const toggle = document.getElementById('presenceToggle');
  const close = document.getElementById('presenceClose');
  const panel = document.getElementById('presencePanel');
  const text = document.getElementById('presenceText');
  const list = document.getElementById('presenceList');

  let isOpen = false;
  let refreshTimer = null;

  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.onclick = () => { isOpen ? closePanel() : openPanel(); };
  close.onclick = closePanel;

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

  async function loadPresence() {
    try {
      const res = await fetch('/api/presence/farmers-online');
      const data = await res.json();
      if (!data.success) throw new Error('Bad response');

      if (data.count === 0) {
        text.textContent = 'No farmers online';
        toggle.classList.remove('has-online');
        list.innerHTML = `
          <div class="presence-empty">
            <p>No farmers are online right now.</p>
            <p style="font-size:.78rem;margin-top:.5rem;color:var(--muted)">Check back soon or browse listings.</p>
          </div>`;
      } else {
        text.textContent = `${data.count} farmer${data.count === 1 ? '' : 's'} online`;
        toggle.classList.add('has-online');

        list.innerHTML = data.farmers.map((f) => `
          <a href="/marketplace.html?state=${encodeURIComponent(f.state || '')}" class="presence-item">
            <div class="presence-avatar">${initialsOf(f.name)}</div>
            <div class="presence-info">
              <div class="presence-name">${escapeHtml(f.name)} ${f.verified ? '<span class="presence-verified" title="Verified">✓</span>' : ''}</div>
              <div class="presence-meta">${escapeHtml(f.location || '')}${f.location && f.state ? ', ' : ''}${escapeHtml(f.state || '')}</div>
            </div>
            <div class="presence-count">${f.activeListings}</div>
          </a>
        `).join('');
      }
    } catch (e) {
      console.warn('[presence]', e);
      text.textContent = 'Online now';
      toggle.classList.remove('has-online');
      list.innerHTML = `<div class="presence-empty">Unable to load</div>`;
    }
  }

  function initialsOf(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Initial load
  loadPresence();

  // Refresh every 60 seconds
  refreshTimer = setInterval(loadPresence, 60000);

  // Pause refresh when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(refreshTimer);
    } else {
      loadPresence();
      refreshTimer = setInterval(loadPresence, 60000);
    }
  });
}

window.renderPresenceWidget = renderPresenceWidget;


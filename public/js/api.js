const API = {
  base: '/api',
  token() { return localStorage.getItem('fmc_token'); },
  role() { return localStorage.getItem('fmc_role'); },
  name() { return localStorage.getItem('fmc_name'); },
  userId() { return localStorage.getItem('fmc_id'); },

  headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this.token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  },

  async request(method, path, body) {
    const opts = { method, headers: this.headers() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(this.base + path, opts);
    let data = {};
    try { data = await res.json(); } catch (_) { data = {}; }
    if (!res.ok) {
      if (res.status === 401 && !path.startsWith('/auth')) {
        localStorage.removeItem('fmc_token');
        localStorage.removeItem('fmc_role');
        localStorage.removeItem('fmc_name');
        localStorage.removeItem('fmc_id');
      }
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  get(p) { return this.request('GET', p); },
  post(p, b) { return this.request('POST', p, b); },
  put(p, b) { return this.request('PUT', p, b); },
  patch(p, b) { return this.request('PATCH', p, b); },
  delete(p) { return this.request('DELETE', p); }
};
window.API = API;

function fmtNaira(n) {
  const num = Number(n || 0);
  return '₦' + num.toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtRelative(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return fmtDate(d);
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function saveSession(data) {
  localStorage.setItem('fmc_token', data.token);
  localStorage.setItem('fmc_role', data.role);
  localStorage.setItem('fmc_name', data.name);
  localStorage.setItem('fmc_id', data._id);
}

function clearSession() {
  localStorage.removeItem('fmc_token');
  localStorage.removeItem('fmc_role');
  localStorage.removeItem('fmc_name');
  localStorage.removeItem('fmc_id');
}

function requireAuth(role) {
  if (!API.token()) { location.href = '/login.html'; return false; }
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(API.role())) { location.href = '/login.html'; return false; }
  }
  return true;
}

function redirectByRole(role) {
  if (role === 'farmer') location.href = '/farmer-dashboard.html';
  else if (role === 'buyer') location.href = '/buyer-dashboard.html';
  else if (role === 'admin') location.href = '/admin/dashboard.html';
  else location.href = '/';
}

window.fmtNaira = fmtNaira;
window.fmtDate = fmtDate;
window.fmtRelative = fmtRelative;
window.escapeHtml = escapeHtml;
window.saveSession = saveSession;
window.clearSession = clearSession;
window.requireAuth = requireAuth;
window.redirectByRole = redirectByRole;

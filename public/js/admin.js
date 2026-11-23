if (!requireAuth('admin')) throw new Error('Not admin');

document.querySelectorAll('.admin-sidebar nav a[data-page]').forEach(a => {
  if (location.pathname.includes(a.dataset.page)) a.classList.add('active');
});
const logout = document.getElementById('adminLogout');
if (logout) logout.onclick = (e) => { e.preventDefault(); clearSession(); location.href = '/admin/login.html'; };

function page() {
  return location.pathname.split('/').pop().replace('.html', '');
}

async function renderDashboard() {
  const r = await API.get('/admin/stats');
  const d = r.data;
  document.getElementById('adminRoot').innerHTML = `
    <div class="dash-grid">
      <div class="dash-card"><div class="dash-label">Total Users</div><div class="dash-value">${d.users}</div></div>
      <div class="dash-card"><div class="dash-label">Farmers</div><div class="dash-value">${d.farmers}</div></div>
      <div class="dash-card"><div class="dash-label">Buyers</div><div class="dash-value">${d.buyers}</div></div>
      <div class="dash-card"><div class="dash-label">Produce</div><div class="dash-value">${d.produce}</div></div>
      <div class="dash-card"><div class="dash-label">Active Produce</div><div class="dash-value">${d.activeProduce}</div></div>
      <div class="dash-card"><div class="dash-label">Enquiries</div><div class="dash-value">${d.enquiries}</div></div>
      <div class="dash-card"><div class="dash-label">Pending</div><div class="dash-value">${d.pendingEnquiries}</div></div>
      <div class="dash-card"><div class="dash-label">Market Prices</div><div class="dash-value">${d.prices}</div></div>
      <div class="dash-card"><div class="dash-label">Messages</div><div class="dash-value">${d.messages}</div></div>
      <div class="dash-card"><div class="dash-label">Organic</div><div class="dash-value">${d.organicCount}</div></div>
      <div class="dash-card"><div class="dash-label">Featured</div><div class="dash-value">${d.featuredCount}</div></div>
    </div>
    <div class="panel">
      <div class="panel-header"><h3>Top Viewed Produce</h3></div>
      <div class="panel-body" style="padding:0">
        <table><thead><tr><th>Product</th><th>Price</th><th>Views</th><th>Favorites</th></tr></thead><tbody>
          ${d.topViewed.map(p => `<tr><td>${escapeHtml(p.productName)}</td><td>${fmtNaira(p.price)}</td><td>${p.views}</td><td>${p.favoriteCount}</td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><h3>Produce by State</h3></div>
      <div class="panel-body">
        ${d.produceByState.map(s => `<div class="flex justify-between" style="padding:.35rem 0;border-bottom:1px solid var(--border)"><span>${escapeHtml(s._id || 'Unknown')}</span><strong>${s.count}</strong></div>`).join('')}
      </div>
    </div>`;
}

async function renderUsers() {
  const r = await API.get('/admin/users');
  document.getElementById('adminRoot').innerHTML = `
    <div class="admin-toolbar">
      <input class="form-control" id="userSearch" placeholder="Search by name or email">
      <select class="form-control" id="userRole"><option value="">All roles</option><option value="farmer">Farmers</option><option value="buyer">Buyers</option><option value="admin">Admins</option></select>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Actions</th></tr></thead>
    <tbody id="userTbody">${r.data.map(u => `
      <tr>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge badge-blue">${escapeHtml(u.role)}</span></td>
        <td><span class="badge ${u.accountStatus === 'active' ? 'badge-green' : 'badge-red'}">${escapeHtml(u.accountStatus)}</span></td>
        <td>${u.verified ? '✅' : '—'}</td>
        <td>
          ${u.role !== 'admin' ? `<button class="btn btn-secondary btn-sm" data-toggle="${u._id}">Toggle status</button>` : ''}
          ${!u.verified ? `<button class="btn btn-primary btn-sm" data-verify="${u._id}">Verify</button>` : ''}
        </td>
      </tr>`).join('')}</tbody></table></div>`;

  document.querySelectorAll('[data-toggle]').forEach(b => {
    b.onclick = async () => {
      if (!confirm('Toggle account status?')) return;
      await API.patch('/admin/users/' + b.dataset.toggle + '/toggle-status');
      toast('Updated');
      renderUsers();
    };
  });
  document.querySelectorAll('[data-verify]').forEach(b => {
    b.onclick = async () => {
      await API.patch('/admin/users/' + b.dataset.verify + '/verify');
      toast('Verified');
      renderUsers();
    };
  });
}

async function renderProduce() {
  const r = await API.get('/admin/produce');
  document.getElementById('adminRoot').innerHTML = `
    <div class="table-wrap"><table><thead><tr><th>Product</th><th>Farmer</th><th>Price</th><th>Featured</th><th>Approved</th><th>Actions</th></tr></thead>
    <tbody>${r.data.map(p => `
      <tr>
        <td><strong>${escapeHtml(p.productName)}</strong></td>
        <td>${escapeHtml(p.farmer && p.farmer.name || '—')}</td>
        <td>${fmtNaira(p.price)}/${escapeHtml(p.unit)}</td>
        <td>${p.featured ? '⭐' : '—'}</td>
        <td>${p.approved ? '✅' : '❌'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" data-feature="${p._id}" data-val="${!p.featured}">${p.featured ? 'Unfeature' : 'Feature'}</button>
          <button class="btn ${p.approved ? 'btn-danger' : 'btn-primary'} btn-sm" data-approve="${p._id}" data-val="${!p.approved}">${p.approved ? 'Unapprove' : 'Approve'}</button>
          <button class="btn btn-danger btn-sm" data-del="${p._id}">Delete</button>
        </td>
      </tr>`).join('')}</tbody></table></div>`;

  document.querySelectorAll('[data-feature]').forEach(b => {
    b.onclick = async () => { await API.patch('/admin/produce/' + b.dataset.feature + '/feature', { featured: b.dataset.val === 'true' }); renderProduce(); };
  });
  document.querySelectorAll('[data-approve]').forEach(b => {
    b.onclick = async () => { await API.patch('/admin/produce/' + b.dataset.approve + '/approve', { approved: b.dataset.val === 'true' }); renderProduce(); };
  });
  document.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async () => {
      if (!confirm('Delete permanently?')) return;
      await API.delete('/admin/produce/' + b.dataset.del);
      toast('Deleted');
      renderProduce();
    };
  });
}

async function renderCategories() {
  const r = await API.get('/categories?includeInactive=true');
  document.getElementById('adminRoot').innerHTML = `
    <div class="admin-toolbar">
      <input class="form-control" id="newCatName" placeholder="New category name">
      <button class="btn btn-primary" id="addCatBtn">Add Category</button>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${r.data.map(c => `<tr>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td class="text-muted">${escapeHtml(c.slug)}</td>
      <td><span class="badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}">${escapeHtml(c.status)}</span></td>
      <td><button class="btn btn-danger btn-sm" data-delcat="${c._id}">Delete</button></td>
    </tr>`).join('')}</tbody></table></div>`;

  document.getElementById('addCatBtn').onclick = async () => {
    const name = document.getElementById('newCatName').value.trim();
    if (!name) return toast('Enter a name', 'error');
    await API.post('/categories', { name });
    toast('Category added');
    renderCategories();
  };
  document.querySelectorAll('[data-delcat]').forEach(b => {
    b.onclick = async () => {
      if (!confirm('Delete this category?')) return;
      await API.delete('/categories/' + b.dataset.delcat);
      renderCategories();
    };
  });
}

async function renderMarketPrices() {
  const r = await API.get('/market-prices?limit=100');
  document.getElementById('adminRoot').innerHTML = `
    <div class="admin-toolbar">
      <button class="btn btn-primary" id="addPriceBtn">+ Add Market Price</button>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Product</th><th>Market</th><th>State</th><th>Min</th><th>Max</th><th>Avg</th><th>Trend</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>${r.data.map(p => `<tr>
      <td><strong>${escapeHtml(p.product)}</strong></td>
      <td>${escapeHtml(p.market)}</td>
      <td>${escapeHtml(p.state)}</td>
      <td>${fmtNaira(p.minPrice)}</td>
      <td>${fmtNaira(p.maxPrice)}</td>
      <td><strong>${fmtNaira(p.averagePrice)}</strong></td>
      <td>${escapeHtml(p.trend)}</td>
      <td>${fmtDate(p.priceDate)}</td>
      <td><button class="btn btn-danger btn-sm" data-delmp="${p._id}">Delete</button></td>
    </tr>`).join('')}</tbody></table></div>`;

  document.getElementById('addPriceBtn').onclick = async () => {
    const product = prompt('Product name:'); if (!product) return;
    const market = prompt('Market name:'); if (!market) return;
    const state = prompt('State:'); if (!state) return;
    const location = prompt('Location (city):') || state;
    const category = prompt('Category (e.g. Vegetables):') || 'Other';
    const min = Number(prompt('Min price (₦):')); if (!min) return;
    const max = Number(prompt('Max price (₦):')); if (!max) return;
    await API.post('/market-prices', {
      product, market, state, location, category, minPrice: min, maxPrice: max,
      priceDate: new Date().toISOString().slice(0, 10), unit: 'kg', trend: 'stable', source: 'Admin'
    });
    toast('Added');
    renderMarketPrices();
  };
  document.querySelectorAll('[data-delmp]').forEach(b => {
    b.onclick = async () => {
      if (!confirm('Delete this price?')) return;
      await API.delete('/market-prices/' + b.dataset.delmp);
      renderMarketPrices();
    };
  });
}

async function renderEnquiries() {
  const r = await API.get('/admin/enquiries');
  document.getElementById('adminRoot').innerHTML = `
    <div class="table-wrap"><table><thead><tr><th>Buyer</th><th>Farmer</th><th>Produce</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>${r.data.map(e => `<tr>
      <td>${escapeHtml(e.buyer && e.buyer.name || '—')}</td>
      <td>${escapeHtml(e.farmer && e.farmer.name || '—')}</td>
      <td>${escapeHtml(e.produce && e.produce.productName || '—')}</td>
      <td><span class="badge badge-blue">${escapeHtml(e.status)}</span></td>
      <td class="text-muted">${fmtRelative(e.createdAt)}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

async function renderMessages() {
  const r = await API.get('/contact');
  document.getElementById('adminRoot').innerHTML = `
    <div class="table-wrap"><table><thead><tr><th>From</th><th>Subject</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>${r.data.map(m => `<tr>
      <td><strong>${escapeHtml(m.name)}</strong><br><small class="text-muted">${escapeHtml(m.email)}</small></td>
      <td>${escapeHtml(m.subject)}<br><small class="text-muted">${escapeHtml((m.message || '').substring(0, 60))}...</small></td>
      <td><span class="badge ${m.status === 'new' ? 'badge-gold' : m.status === 'resolved' ? 'badge-green' : 'badge-gray'}">${escapeHtml(m.status)}</span></td>
      <td class="text-muted">${fmtRelative(m.createdAt)}</td>
      <td><button class="btn btn-secondary btn-sm" data-resolve="${m._id}">${m.status === 'resolved' ? 'Unresolve' : 'Resolve'}</button></td>
    </tr>`).join('')}</tbody></table></div>`;

  document.querySelectorAll('[data-resolve]').forEach(b => {
    b.onclick = async () => {
      await API.patch('/contact/' + b.dataset.resolve + '/status', { status: 'resolved' });
      renderMessages();
    };
  });
}

const RENDERERS = {
  dashboard: renderDashboard,
  users: renderUsers,
  produce: renderProduce,
  categories: renderCategories,
  'market-prices': renderMarketPrices,
  enquiries: renderEnquiries,
  messages: renderMessages
};

const fn = RENDERERS[page()];
if (fn) fn().catch(e => {
  document.getElementById('adminRoot').innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><p>${escapeHtml(e.message)}</p></div>`;
});

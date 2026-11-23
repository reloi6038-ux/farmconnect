const role = API.role();
if (requireAuth()) {
  async function load() {
    const tb = document.getElementById('enqTbody');
    tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>';
    try {
      const r = await API.get('/enquiries/mine');
      if (!r.data.length) { tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No enquiries yet.</td></tr>'; return; }
      tb.innerHTML = r.data.map(e => {
        const other = role === 'farmer' ? e.buyer : e.farmer;
        const badge = e.status === 'pending' ? 'badge-gold' : e.status === 'responded' ? 'badge-blue' : e.status === 'accepted' ? 'badge-green' : e.status === 'rejected' ? 'badge-red' : 'badge-gray';
        const action = role === 'farmer' && e.status === 'pending'
          ? `<button class="btn btn-primary btn-sm" data-respond="${e._id}">Respond</button>`
          : `<span class="text-muted" style="font-size:.85rem">${e.farmerResponse ? escapeHtml(e.farmerResponse.substring(0, 40)) + '...' : '—'}</span>`;
        return `<tr>
          <td><strong>${escapeHtml(e.produce && e.produce.productName || '—')}</strong><br><small class="text-muted">${escapeHtml(e.subject)}</small></td>
          <td>${escapeHtml(other && other.name || '—')}</td>
          <td>${e.quantityRequested}</td>
          <td>${e.offerPrice ? fmtNaira(e.offerPrice) : '—'}</td>
          <td><span class="badge ${badge}">${escapeHtml(e.status)}</span></td>
          <td class="text-muted" style="font-size:.85rem">${fmtRelative(e.createdAt)}</td>
          <td>${action}</td>
        </tr>`;
      }).join('');
      tb.querySelectorAll('[data-respond]').forEach(b => {
        b.onclick = () => {
          document.getElementById('respondId').value = b.dataset.respond;
          openModal('respondModal');
        };
      });
    } catch (e) { toast(e.message, 'error'); }
  }
  document.getElementById('respondForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put('/enquiries/' + document.getElementById('respondId').value + '/respond', {
        response: document.getElementById('respondText').value,
        status: document.getElementById('respondStatus').value
      });
      toast('Response sent');
      closeModal('respondModal');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };
  load();
}

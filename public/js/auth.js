(function () {
  const rf = document.getElementById('roleFarmer');
  const rb = document.getElementById('roleBuyer');
  const farmerFields = document.getElementById('farmerFields');

  function paintRoles() {
    if (!rf || !rb) return;
    const role = document.querySelector('input[name="role"]:checked').value;
    rf.style.borderColor = role === 'farmer' ? 'var(--green)' : 'var(--border)';
    rf.style.background = role === 'farmer' ? '#f0fdf4' : '#fff';
    rb.style.borderColor = role === 'buyer' ? 'var(--green)' : 'var(--border)';
    rb.style.background = role === 'buyer' ? '#f0fdf4' : '#fff';
    if (farmerFields) farmerFields.style.display = role === 'farmer' ? 'block' : 'none';
  }
  if (rf) rf.onclick = () => { rf.querySelector('input').checked = true; paintRoles(); };
  if (rb) rb.onclick = () => { rb.querySelector('input').checked = true; paintRoles(); };

  // Preselect role from ?role=farmer or ?role=buyer
  if (rf && rb) {
    const qp = new URLSearchParams(location.search).get('role');
    if (qp === 'farmer') { rf.querySelector('input').checked = true; }
    else if (qp === 'buyer') { rb.querySelector('input').checked = true; }
    paintRoles();
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      btn.disabled = true; btn.textContent = 'Signing in...';
      try {
        const r = await API.post('/auth/login', {
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value
        });
        saveSession(r.data);
        toast('Welcome back, ' + r.data.name);
        setTimeout(() => redirectByRole(r.data.role), 400);
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    };
  }

  const regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      btn.disabled = true; btn.textContent = 'Creating account...';
      try {
        const role = document.querySelector('input[name="role"]:checked').value;
        const body = {
          name: document.getElementById('name').value.trim(),
          email: document.getElementById('email').value.trim(),
          phone: document.getElementById('phone').value.trim(),
          state: document.getElementById('state').value.trim(),
          location: document.getElementById('location').value.trim(),
          password: document.getElementById('password').value,
          role
        };
        if (role === 'farmer') body.farmName = document.getElementById('farmName').value.trim();
        const r = await API.post('/auth/register', body);
        saveSession(r.data);
        toast('Account created! Welcome to FarmConnect.');
        setTimeout(() => redirectByRole(r.data.role), 500);
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Create Account';
      }
    };
  }
})();

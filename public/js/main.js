// ---------- Live Activity Ticker ----------
(function () {
  const track = document.getElementById('activityTickerTrack');
  if (!track) return;

  let activities = [];
  let currentIndex = 0;
  let rotationTimer = null;
  let refreshTimer = null;

  function timeAgo(dateStr) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  }

  function renderActivities() {
    if (!activities.length) {
      track.innerHTML = `
        <div class="activity-item active">
          <span class="activity-icon">🌱</span>
          <span class="activity-text">Be the first to list produce on FarmConnect</span>
        </div>`;
      return;
    }

    track.innerHTML = activities.map((a, i) => `
      <div class="activity-item ${i === 0 ? 'active' : ''}" data-index="${i}">
        <span class="activity-icon">${a.icon}</span>
        <span class="activity-text">${escapeHtml(a.message)}</span>
        ${a.detail ? `<span class="activity-detail">${escapeHtml(a.detail)}</span>` : ''}
        <span class="activity-time">${timeAgo(a.createdAt)}</span>
      </div>
    `).join('');

    currentIndex = 0;
    rotate();
  }

  function rotate() {
    if (rotationTimer) clearInterval(rotationTimer);
    const items = track.querySelectorAll('.activity-item');
    if (items.length <= 1) return;

    rotationTimer = setInterval(() => {
      items[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % items.length;
      items[currentIndex].classList.add('active');
      // Refresh timestamps every rotation
      activities.forEach((a, i) => {
        const t = items[i].querySelector('.activity-time');
        if (t) t.textContent = timeAgo(a.createdAt);
      });
    }, 4000);
  }

  async function loadActivities() {
    try {
      const res = await fetch('/api/activity/recent?limit=10');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        activities = data.data;
        renderActivities();
      }
    } catch (e) {
      // Silent fail — ticker is non-essential
      console.warn('[ticker]', e);
    }
  }

  // Initial load
  loadActivities();

  // Auto-refresh every 30 seconds
  refreshTimer = setInterval(loadActivities, 30000);

  // Pause rotation on hover
  track.addEventListener('mouseenter', () => {
    if (rotationTimer) clearInterval(rotationTimer);
  });
  track.addEventListener('mouseleave', () => {
    rotate();
  });

  // Clean up when tab is hidden (saves battery/network)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rotationTimer) clearInterval(rotationTimer);
      if (refreshTimer) clearInterval(refreshTimer);
    } else {
      loadActivities();
      refreshTimer = setInterval(loadActivities, 30000);
    }
  });
})();

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

// ---------- Farm-to-Table Timeline ----------
(function () {
  const timeline = document.getElementById('journeyTimeline');
  if (!timeline) return;

  // Reveal on scroll
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          timeline.classList.add('revealed');
          observer.unobserve(timeline);
        }
      });
    }, { threshold: 0.2 });
    observer.observe(timeline);
  } else {
    timeline.classList.add('revealed');
  }

  // Load real stats and update tooltips
  (async function loadStats() {
    try {
      const res = await fetch('/api/stats/public');
      const data = await res.json();
      if (!data.success) return;
      const s = data.data;

      const tooltips = {
        '1': `${s.farmers} farmers in network`,
        '2': `13 produce categories`,
        '3': `${s.activeListings} active listings`,
        '4': `${s.produce} produce items listed`,
        '5': `${s.enquiries} enquiries sent`,
        '6': `${s.avgRating} / 5 average rating`
      };

      timeline.querySelectorAll('.journey-stage').forEach((stage) => {
        const n = stage.dataset.stage;
        const tip = stage.querySelector('.journey-tooltip');
        if (tip && tooltips[n]) tip.textContent = tooltips[n];
      });
    } catch (e) { console.warn('[journey stats]', e); }
  })();
})();

// ---------- Live Stats Bar (real numbers from DB) ----------
(function () {
  const grid = document.getElementById('liveStatsGrid');
  if (!grid) return;

  function animateCount(el, target, duration) {
    target = Number(target) || 0;
    // Handle decimals (e.g. 4.8 for rating)
    const isDecimal = !Number.isInteger(target);
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const value = target * eased;
      el.textContent = isDecimal ? value.toFixed(1) : Math.round(value).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  async function loadLiveStats() {
    try {
      const [statsRes, pricesRes] = await Promise.all([
        fetch('/api/stats/public').then(r => r.json()),
        fetch('/api/market-prices?limit=1').then(r => r.json())
      ]);

      if (!statsRes.success) throw new Error('Stats fetch failed');
      const s = statsRes.data;
      const priceCount = pricesRes.success && pricesRes.pagination ? pricesRes.pagination.totalItems : 0;

      // Update each stat element's data-count and trigger animation
      const updates = [
        ['statFarmers', s.farmers],
        ['statListings', s.activeListings],
        ['statBuyers', s.buyers],
        ['statPrices', priceCount],
        ['statRating', s.avgRating]
      ];

      updates.forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
          el.dataset.count = value;
          // Start from 0 then animate to target
          el.textContent = '0';
          setTimeout(() => animateCount(el, value, 1200), 100);
        }
      });
    } catch (e) {
      console.warn('[live-stats]', e);
      // Fallback: leave the counters at 0
    }
  }

  // Trigger when the section scrolls into view (better UX than on load)
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadLiveStats();
          observer.unobserve(grid);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(grid);
  } else {
    loadLiveStats();
  }
})();

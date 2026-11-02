/**
 * SOURAV S. PANJA — ARCHITECTURAL STUDIO INTERACTIONS
 * Tactile Haptics, Smooth Segmented Filters, Inspector Modal & Dock Sync
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initDockScrollSpy();
  initSheetSwipeGestures();
});

/* -------------------------------------------------------------
   HAPTIC ENGINE (TACTILE APP FEEL ON MOBILE)
------------------------------------------------------------- */
function hapticPulse(ms = 8) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch (e) {}
  }
}

/* -------------------------------------------------------------
   THEME SWITCHER ENGINE (MATTE OBSIDIAN / SWISS LIGHT)
------------------------------------------------------------- */
function initThemeEngine() {
  const toggleBtn = document.getElementById('themeToggle');
  const icon = toggleBtn.querySelector('.mode-icon');
  const activeTheme = localStorage.getItem('panja_studio_theme') || 'dark';

  if (activeTheme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    icon.textContent = '☀️';
  } else {
    document.body.classList.add('theme-dark');
    document.body.classList.remove('theme-light');
    icon.textContent = '🌙';
  }

  toggleBtn.addEventListener('click', () => {
    hapticPulse(12);
    if (document.body.classList.contains('theme-light')) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      icon.textContent = '🌙';
      localStorage.setItem('panja_studio_theme', 'dark');
      triggerStudioToast('Matte Obsidian Mode');
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      icon.textContent = '☀️';
      localStorage.setItem('panja_studio_theme', 'light');
      triggerStudioToast('Swiss Light Editorial Mode');
    }
  });
}

/* -------------------------------------------------------------
   BOTTOM DOCK NAVIGATION (MOBILE)
------------------------------------------------------------- */
window.dockNavigate = function(sectionId, element) {
  hapticPulse(12);

  if (element) {
    document.querySelectorAll('.dock-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
  }

  const target = document.getElementById(sectionId);
  if (target) {
    const offset = -70;
    const top = target.getBoundingClientRect().top + window.pageYOffset + offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

/* -------------------------------------------------------------
   SEGMENTED CONTROL GALLERY FILTERING
------------------------------------------------------------- */
window.filterGallery = function(category, element) {
  hapticPulse(10);

  const buttons = document.querySelectorAll('.seg-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }

  const cards = document.querySelectorAll('.case-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category') || '';
    if (category === 'all' || cardCat.includes(category)) {
      card.style.display = 'flex';
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 30);
    } else {
      card.style.display = 'none';
    }
  });
};

/* -------------------------------------------------------------
   CASE STUDY INSPECTOR MODAL
------------------------------------------------------------- */
window.openInspector = function(imgSrc, title, actionUrl, actionLabel) {
  hapticPulse(14);
  const curtain = document.getElementById('inspectorModal');
  const img = document.getElementById('inspectorImage');
  const heading = document.getElementById('inspectorTitle');
  const btn = document.getElementById('inspectorActionBtn');

  img.src = imgSrc;
  heading.textContent = title || 'Work Preview';

  if (actionUrl) {
    btn.href = actionUrl;
    btn.style.display = 'inline-flex';
    btn.querySelector('span').textContent = actionLabel || 'Visit Live / Demo ↗';
  } else {
    btn.style.display = 'none';
  }

  curtain.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeInspector = function(e) {
  if (e && e.target && e.target.closest('.inspector-window') && 
      !e.target.classList.contains('inspector-grab-bar') && 
      !e.target.classList.contains('inspector-exit-btn') && 
      !e.target.closest('.btn-ghost')) {
    return;
  }
  hapticPulse(8);
  const curtain = document.getElementById('inspectorModal');
  curtain.classList.remove('active');
  document.body.style.overflow = '';
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeInspector();
  }
});

/* -------------------------------------------------------------
   SWIPE DOWN TO DISMISS (TOUCH PHYSICS)
------------------------------------------------------------- */
function initSheetSwipeGestures() {
  const win = document.querySelector('.inspector-window');
  let startY = 0;
  let moveY = 0;

  win.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  win.addEventListener('touchmove', (e) => {
    moveY = e.touches[0].clientY;
    const diff = moveY - startY;
    if (diff > 0) {
      win.style.transform = `translateY(${diff}px)`;
    }
  }, { passive: true });

  win.addEventListener('touchend', () => {
    const diff = moveY - startY;
    if (diff > 110) {
      closeInspector();
    }
    win.style.transform = '';
    startY = 0;
    moveY = 0;
  });
}

/* -------------------------------------------------------------
   COPY TO CLIPBOARD & TOAST SYSTEM
------------------------------------------------------------- */
window.copyContactText = function(text, successMsg) {
  hapticPulse(12);
  navigator.clipboard.writeText(text).then(() => {
    triggerStudioToast(successMsg || 'Copied to clipboard');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    triggerStudioToast(successMsg || 'Copied to clipboard');
  });
};

function triggerStudioToast(message) {
  const toast = document.getElementById('studioToast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

/* -------------------------------------------------------------
   SCROLL SPY (SYNC DOCK & DESKTOP NAV)
------------------------------------------------------------- */
function initDockScrollSpy() {
  const sectionIds = ['hero', 'services', 'work', 'experience', 'credentials'];
  const dockTabs = document.querySelectorAll('.studio-bottom-dock .dock-tab:not(.dock-wa-pill)');
  const navAnchors = document.querySelectorAll('.desktop-navigation .nav-anchor');

  window.addEventListener('scroll', () => {
    const scrollPos = window.pageYOffset + 180;

    sectionIds.forEach((id, index) => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          dockTabs.forEach(t => t.classList.remove('active'));
          navAnchors.forEach(a => a.classList.remove('active'));

          if (dockTabs[index]) dockTabs[index].classList.add('active');
          if (navAnchors[index]) navAnchors[index].classList.add('active');
        }
      }
    });
  });
}

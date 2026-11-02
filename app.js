/**
 * SOURAV S. PANJA — ARCHITECTURAL WEB APP ENGINE
 * Features: Fluid SPA View Switcher, Resilient Slider Tracking, Keyboard Shortcuts, 
 * Web Audio Haptics, Touch Swiping, Search & Filter, Lightbox Inspector
 */

const VIEWS = ['profile', 'experience', 'skills', 'education', 'portfolios'];
let currentView = 'profile';

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initRouting();
  initKeyboardNavigation();
  initTouchGestures();
  initSheetSwipeGestures();
  initDockObserver();
  initHeroMedia();
});

// Update slider when fonts finish rendering
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    updateDockSlider();
  });
}

window.addEventListener('resize', () => {
  updateDockSlider();
});

window.addEventListener('orientationchange', () => {
  setTimeout(updateDockSlider, 100);
});

/* -------------------------------------------------------------
   ROUTING & VIEW CONTROLLER
   ------------------------------------------------------------- */
function initRouting() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (VIEWS.includes(hash)) {
    switchView(hash, false);
  } else {
    switchView('profile', false);
  }

  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '').toLowerCase();
    if (VIEWS.includes(newHash) && newHash !== currentView) {
      switchView(newHash, false);
    }
  });
}

window.switchView = function(viewName, updateHash = true) {
  if (!VIEWS.includes(viewName)) return;

  const previousView = currentView;
  currentView = viewName;

  hapticPulse(8);

  // 1. Activate View Stage Containers
  document.querySelectorAll('.app-view').forEach(view => {
    if (view.id === `view-${viewName}`) {
      view.style.display = 'block';
      view.classList.remove('active');
      void view.offsetWidth;
      view.classList.add('active');
    } else {
      view.classList.remove('active');
      view.style.display = 'none';
    }
  });

  // 2. Update Desktop Dock Tabs
  document.querySelectorAll('.app-dock-tab').forEach(tab => {
    const isTarget = tab.getAttribute('data-view') === viewName;
    tab.classList.toggle('active', isTarget);
    tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  // 3. Update Mobile Bottom Dock Tabs
  document.querySelectorAll('.studio-bottom-dock .dock-tab').forEach(tab => {
    const isTarget = tab.getAttribute('data-view') === viewName;
    tab.classList.toggle('active', isTarget);
    tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  // 4. Update Sliding Pill Position
  requestAnimationFrame(updateDockSlider);

  // 5. Update Document Title
  const titles = {
    profile: 'Sourav S. Panja — Operations, Finance & Software',
    experience: 'Work Experience — Sourav S. Panja',
    skills: 'Skills & Toolkit — Sourav S. Panja',
    education: 'Education & Credentials — Sourav S. Panja',
    portfolios: 'Selected Projects — Sourav S. Panja'
  };
  document.title = titles[viewName] || 'Sourav S. Panja';

  // 6. Update Browser URL Hash
  if (updateHash && window.location.hash !== `#${viewName}`) {
    window.history.pushState(null, '', `#${viewName}`);
  }

  // 7. Instant Reset to Top
  window.scrollTo(0, 0);

  // 8. Control Hero Reel Playback based on active view
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    if (viewName === 'profile' && heroMediaMode === 'reel') {
      heroVideo.play().catch(() => {});
    } else {
      heroVideo.pause();
    }
  }
};

/* -------------------------------------------------------------
   HERO LIVING REEL & STILL PORTRAIT CONTROLLER
   ------------------------------------------------------------- */
let heroMediaMode = 'reel';

function initHeroMedia() {
  const video = document.getElementById('heroVideo');
  if (!video) return;

  video.muted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');

  const startPlay = () => {
    video.play().catch(() => {});
  };

  startPlay();

  // Ensure playback starts on first touch/click if strict autoplay policy blocked it
  const playOnUserGesture = () => {
    if (heroMediaMode === 'reel') {
      video.play().catch(() => {});
    }
    window.removeEventListener('click', playOnUserGesture);
    window.removeEventListener('touchstart', playOnUserGesture);
  };
  window.addEventListener('click', playOnUserGesture, { once: true, passive: true });
  window.addEventListener('touchstart', playOnUserGesture, { once: true, passive: true });
}

window.setHeroMediaMode = function(mode) {
  heroMediaMode = mode;
  hapticPulse(6);
  const video = document.getElementById('heroVideo');
  const photo = document.getElementById('heroPhoto');
  const btnReel = document.getElementById('btnModeReel');
  const btnPhoto = document.getElementById('btnModePhoto');
  const soundBtn = document.getElementById('btnReelSound');
  const caption = document.getElementById('portraitCaptionText');

  if (mode === 'reel') {
    video?.classList.add('active');
    photo?.classList.remove('active');
    btnReel?.classList.add('active');
    btnPhoto?.classList.remove('active');
    soundBtn?.classList.remove('hidden');
    if (caption) caption.textContent = 'Kolkata • On The Ground';
    video?.play().catch(() => {});
    triggerStudioToast('Living Reel Active');
  } else {
    video?.classList.remove('active');
    photo?.classList.add('active');
    btnReel?.classList.remove('active');
    btnPhoto?.classList.add('active');
    soundBtn?.classList.add('hidden');
    if (caption) caption.textContent = 'On-Site & Remote Ready';
    video?.pause();
    triggerStudioToast('Still Portrait Active');
  }
};

window.toggleHeroReelSound = function(e) {
  if (e) e.stopPropagation();
  hapticPulse(8);
  const video = document.getElementById('heroVideo');
  const icon = document.getElementById('soundIcon');
  const label = document.getElementById('soundLabel');
  if (!video) return;

  if (video.muted) {
    video.muted = false;
    video.volume = 1.0;
    if (icon) icon.textContent = '🔊';
    if (label) label.textContent = 'Sound On';
    triggerStudioToast('Audio Unmuted');
  } else {
    video.muted = true;
    if (icon) icon.textContent = '🔇';
    if (label) label.textContent = 'Muted';
    triggerStudioToast('Audio Muted');
  }
};

/* -------------------------------------------------------------
   DESKTOP DOCK SLIDER ANIMATOR (RESIZE OBSERVER RESILIENT)
   ------------------------------------------------------------- */
function initDockObserver() {
  const dock = document.getElementById('desktopDock');
  if (dock && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      updateDockSlider();
    });
    ro.observe(dock);
  }
}

function updateDockSlider() {
  const activeTab = document.querySelector('.app-dock-tab.active');
  const slider = document.getElementById('dockSlider');
  const dock = document.getElementById('desktopDock');

  if (!activeTab || !slider || !dock || window.innerWidth < 860) return;

  const dockRect = dock.getBoundingClientRect();
  const tabRect = activeTab.getBoundingClientRect();

  if (tabRect.width === 0) return; // Tab not rendered yet

  const leftOffset = tabRect.left - dockRect.left;
  const width = tabRect.width;

  slider.style.transform = `translateX(${leftOffset}px)`;
  slider.style.width = `${width}px`;
}

/* -------------------------------------------------------------
   KEYBOARD NAVIGATION (1-5 and Arrow Keys)
   ------------------------------------------------------------- */
function initKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // If modal is active, allow arrow keys to navigate gallery
    const modal = document.getElementById('inspectorModal');
    if (modal && modal.classList.contains('active')) {
      if (e.key === 'Escape') {
        window.closeInspector();
        return;
      }
      if (e.key === 'ArrowRight') {
        window.galleryNext();
        return;
      }
      if (e.key === 'ArrowLeft') {
        window.galleryPrev();
        return;
      }
      return;
    }

    // If typing in search input, don't hijack keys
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    if (e.key === 'Escape') {
      window.closeInspector();
      return;
    }

    // Number keys 1-5
    if (['1', '2', '3', '4', '5'].includes(e.key)) {
      const index = parseInt(e.key, 10) - 1;
      if (VIEWS[index]) {
        switchView(VIEWS[index]);
      }
      return;
    }

    // Arrow keys
    const currentIndex = VIEWS.indexOf(currentView);
    if (e.key === 'ArrowRight' && currentIndex < VIEWS.length - 1) {
      switchView(VIEWS[currentIndex + 1]);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      switchView(VIEWS[currentIndex - 1]);
    }
  });
}

/* -------------------------------------------------------------
   TOUCH SWIPE HORIZONTAL GESTURES FOR MOBILE TABS
   ------------------------------------------------------------- */
function initTouchGestures() {
  const stage = document.getElementById('appStage');
  if (!stage) return;

  let startX = 0;
  let startY = 0;
  let moveX = 0;
  let moveY = 0;
  let isIgnored = false;

  stage.addEventListener('touchstart', (e) => {
    // Do not swipe if modal is open or touching horizontal scroll elements
    const modal = document.getElementById('inspectorModal');
    if (modal && modal.classList.contains('active')) {
      isIgnored = true;
      return;
    }
    if (e.target.closest('.segmented-control') || 
        e.target.closest('.filter-chip-group') || 
        e.target.closest('.mini-gallery-strip') || 
        e.target.closest('input')) {
      isIgnored = true;
      return;
    }

    isIgnored = false;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    moveX = startX;
    moveY = startY;
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (isIgnored) return;
    moveX = e.touches[0].clientX;
    moveY = e.touches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchend', () => {
    if (isIgnored) return;

    const diffX = moveX - startX;
    const diffY = moveY - startY;

    // Strict horizontal swipe check (> 90px horizontally, < 50px vertically)
    if (Math.abs(diffX) > 90 && Math.abs(diffY) < 50) {
      const idx = VIEWS.indexOf(currentView);
      if (diffX < 0 && idx < VIEWS.length - 1) {
        // Swiped Left -> Go to Next Tab
        switchView(VIEWS[idx + 1]);
      } else if (diffX > 0 && idx > 0) {
        // Swiped Right -> Go to Prev Tab
        switchView(VIEWS[idx - 1]);
      }
    }

    startX = 0;
    startY = 0;
    moveX = 0;
    moveY = 0;
    isIgnored = false;
  });
}

function playUiClick() {
  // Sound effects removed for clean professional UX
}

/* -------------------------------------------------------------
   HAPTIC PULSE (MOBILE DEVICES)
   ------------------------------------------------------------- */
function hapticPulse(ms = 8) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch (e) {}
  }
}

/* -------------------------------------------------------------
   THEME SWITCHER ENGINE (SWISS BRIGHT / MATTE OBSIDIAN)
   ------------------------------------------------------------- */
function applyAppTheme(theme) {
  const toggleBtn = document.getElementById('themeToggle');
  const icon = toggleBtn ? toggleBtn.querySelector('.mode-icon') : null;
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  if (theme === 'dark') {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    if (icon) icon.textContent = '☀️';
    if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Bright Mode');
    if (themeMeta) themeMeta.setAttribute('content', '#08090d');
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    if (icon) icon.textContent = '🌙';
    if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Dark Mode');
    if (themeMeta) themeMeta.setAttribute('content', '#f7f8fa');
  }
}

function initThemeEngine() {
  const toggleBtn = document.getElementById('themeToggle');
  // Default to Bright Mode as requested
  const savedTheme = localStorage.getItem('panja_active_theme');
  const activeTheme = savedTheme || 'light';

  applyAppTheme(activeTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      hapticPulse(12);
      playUiClick();

      const currentlyLight = document.body.classList.contains('theme-light');
      const nextTheme = currentlyLight ? 'dark' : 'light';

      applyAppTheme(nextTheme);
      localStorage.setItem('panja_active_theme', nextTheme);
      localStorage.setItem('panja_studio_theme', nextTheme);

      triggerStudioToast(nextTheme === 'dark' ? 'Matte Obsidian Mode' : 'Bright Mode');
      requestAnimationFrame(updateDockSlider);
    });
  }
}

/* -------------------------------------------------------------
   EXPERIENCE CATEGORY FILTERING
   ------------------------------------------------------------- */
window.filterExperience = function(category, element) {
  playUiClick();
  hapticPulse(10);

  const pills = element.parentElement.querySelectorAll('.filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  element.classList.add('active');

  const records = document.querySelectorAll('#experienceList .record-row');
  records.forEach(rec => {
    const roles = rec.getAttribute('data-role-type') || '';
    if (category === 'all' || roles.includes(category)) {
      rec.style.display = 'grid';
      rec.style.opacity = '0';
      rec.style.transform = 'translateY(6px)';
      setTimeout(() => {
        rec.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        rec.style.opacity = '1';
        rec.style.transform = 'translateY(0)';
      }, 15);
    } else {
      rec.style.display = 'none';
    }
  });
};

/* -------------------------------------------------------------
   SKILLS DOMAIN FILTERING
   ------------------------------------------------------------- */
window.filterSkills = function(domain, element) {
  playUiClick();
  hapticPulse(10);

  const pills = element.parentElement.querySelectorAll('.filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  element.classList.add('active');

  const cards = document.querySelectorAll('#skillsMatrix .matrix-card');
  cards.forEach(card => {
    const domains = card.getAttribute('data-domain') || '';
    if (domain === 'all' || domains.includes(domain)) {
      card.style.display = 'flex';
      card.style.opacity = '0';
      card.style.transform = 'translateY(6px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 15);
    } else {
      card.style.display = 'none';
    }
  });
};

/* -------------------------------------------------------------
   PORTFOLIO GALLERY FILTERING & LIVE SEARCH
   ------------------------------------------------------------- */
let currentPortfolioCategory = 'all';

window.filterGallery = function(category, element) {
  playUiClick();
  hapticPulse(10);
  currentPortfolioCategory = category;

  const buttons = document.querySelectorAll('#portfolioSegmentedControl .seg-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }

  applyPortfolioFilters();
};

window.handlePortfolioSearch = function() {
  const input = document.getElementById('portfolioSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) {
    clearBtn.style.display = input.value.trim() ? 'block' : 'none';
  }
  applyPortfolioFilters();
};

window.clearPortfolioSearch = function() {
  const input = document.getElementById('portfolioSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';

  // Reset category to all
  const allBtn = document.querySelector('#portfolioSegmentedControl .seg-btn[data-filter="all"]');
  if (allBtn) {
    document.querySelectorAll('#portfolioSegmentedControl .seg-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    currentPortfolioCategory = 'all';
  }

  applyPortfolioFilters();
  playUiClick();
};

function applyPortfolioFilters() {
  const searchVal = (document.getElementById('portfolioSearchInput')?.value || '').toLowerCase().trim();
  const cards = document.querySelectorAll('#portfolioGrid .case-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const category = card.getAttribute('data-category') || '';
    const tags = card.getAttribute('data-tags') || '';
    const title = (card.querySelector('.case-title')?.textContent || '').toLowerCase();
    const summary = (card.querySelector('.case-summary')?.textContent || '').toLowerCase();
    const client = (card.querySelector('.case-client')?.textContent || '').toLowerCase();

    const matchesCategory = (currentPortfolioCategory === 'all' || category.includes(currentPortfolioCategory));
    const matchesSearch = !searchVal || 
      title.includes(searchVal) || 
      summary.includes(searchVal) || 
      client.includes(searchVal) || 
      tags.includes(searchVal);

    if (matchesCategory && matchesSearch) {
      card.style.display = 'flex';
      card.style.opacity = '1';
      visibleCount++;
    } else {
      card.style.display = 'none';
      card.style.opacity = '0';
    }
  });

  // Update Count Badge
  const countBadge = document.getElementById('portfolioCountBadge');
  if (countBadge) {
    countBadge.textContent = `Showing ${visibleCount} of ${cards.length} Projects`;
  }

  // Show/Hide No Results Notice
  const noRes = document.getElementById('noResultsNotice');
  if (noRes) {
    noRes.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

/* -------------------------------------------------------------
   CASE STUDY INSPECTOR & MULTI-IMAGE GALLERY SYSTEM
   ------------------------------------------------------------- */
const GALLERIES = {
  nalavya: {
    title: 'Nalavya Play (Nalavya 2.0)',
    actionUrl: 'https://nalavya-admin.vercel.app/apk/nalavya_update.apk',
    actionLabel: 'Download Android APK (Direct) ↗',
    images: [
      'assets/nalavya_splash_full.jpg',
      'assets/nalavya/screen1.jpeg',
      'assets/nalavya/screen2.jpeg',
      'assets/nalavya/screen3.jpeg',
      'assets/nalavya/screen4.jpeg',
      'assets/nalavya/screen5.jpeg',
      'assets/nalavya/screen6.jpeg',
      'assets/nalavya/screen7.jpeg',
      'assets/nalavya/screen8.jpeg'
    ]
  },
  mraj: {
    title: 'MRAJ Farmer ERP & Operations',
    actionUrl: '',
    actionLabel: '',
    images: [
      'assets/mrajfarmer/screen1.jpeg',
      'assets/mrajfarmer/screen2.jpeg',
      'assets/mrajfarmer/screen3.jpeg',
      'assets/mrajfarmer/screen4.jpeg',
      'assets/mrajfarmer/screen5.jpeg',
      'assets/mrajfarmer/screen6.jpeg',
      'assets/mrajfarmer/screen7.jpeg'
    ]
  },
  propzen: {
    title: 'PropZen Realty — Property Discovery Portal',
    actionUrl: 'https://propzenrealty.com',
    actionLabel: 'Visit Website ↗',
    images: [
      'assets/propzen_live.png',
      'assets/propzen_mobile.png'
    ]
  },
  ahsalon: {
    title: 'AH Family Salon',
    actionUrl: 'https://ahfamilysalon.in',
    actionLabel: 'Visit Website ↗',
    images: [
      'assets/ahsalon_live.png',
      'assets/ahsalon_mobile.png'
    ]
  },
  shunanexpo: {
    title: 'Shunan Expo Studio Portal',
    actionUrl: 'https://shunanexpo.web.app',
    actionLabel: 'Visit Website ↗',
    images: [
      'assets/shunanexpo_live.png',
      'assets/shunanexpo_mobile.png'
    ]
  },
  shunan: {
    title: 'Shunan Games — Walkthrough Hub & News',
    actionUrl: 'https://shunangames.web.app',
    actionLabel: 'Visit Website ↗',
    images: [
      'assets/shunangames_live.png',
      'assets/shunangames_mobile.png',
      'assets/shunangames_fps_calc.png',
      'assets/shunangames_rdr2_player.png',
      'assets/shunangames_news.png'
    ]
  }
};

let activeGalleryList = [];
let activeGalleryIdx = 0;
let activeGalleryHeading = '';
let activeGalleryAction = { url: '', label: '' };

window.openGallery = function(galleryKey, startIndex = 0) {
  const gal = GALLERIES[galleryKey];
  if (!gal) return;

  activeGalleryList = gal.images;
  activeGalleryIdx = startIndex;
  activeGalleryHeading = gal.title;
  activeGalleryAction = { url: gal.actionUrl, label: gal.actionLabel };

  renderActiveGalleryModal();
};

window.galleryNext = function(e) {
  if (e) e.stopPropagation();
  if (activeGalleryList.length <= 1) return;
  activeGalleryIdx = (activeGalleryIdx + 1) % activeGalleryList.length;
  renderActiveGalleryModal();
};

window.galleryPrev = function(e) {
  if (e) e.stopPropagation();
  if (activeGalleryList.length <= 1) return;
  activeGalleryIdx = (activeGalleryIdx - 1 + activeGalleryList.length) % activeGalleryList.length;
  renderActiveGalleryModal();
};

function renderActiveGalleryModal() {
  hapticPulse(12);
  playUiClick();

  const curtain = document.getElementById('inspectorModal');
  const img = document.getElementById('inspectorImage');
  const heading = document.getElementById('inspectorTitle');
  const counter = document.getElementById('inspectorCounter');
  const btn = document.getElementById('inspectorActionBtn');
  const prevBtn = document.getElementById('modalPrevBtn');
  const nextBtn = document.getElementById('modalNextBtn');

  img.src = activeGalleryList[activeGalleryIdx];
  heading.textContent = activeGalleryHeading;

  if (counter) {
    if (activeGalleryList.length > 1) {
      counter.style.display = 'inline-block';
      counter.textContent = `${activeGalleryIdx + 1} / ${activeGalleryList.length}`;
    } else {
      counter.style.display = 'none';
    }
  }

  if (prevBtn && nextBtn) {
    const showArrows = activeGalleryList.length > 1;
    prevBtn.style.display = showArrows ? 'flex' : 'none';
    nextBtn.style.display = showArrows ? 'flex' : 'none';
  }

  if (activeGalleryAction && activeGalleryAction.url) {
    btn.href = activeGalleryAction.url;
    btn.style.display = 'inline-flex';
    btn.querySelector('span').textContent = activeGalleryAction.label || 'Visit Live / Demo ↗';
  } else {
    btn.style.display = 'none';
  }

  curtain.classList.add('active');
  document.body.style.overflow = 'hidden';
}

window.openInspector = function(imgSrc, title, actionUrl, actionLabel) {
  activeGalleryList = [imgSrc];
  activeGalleryIdx = 0;
  activeGalleryHeading = title || 'Work Preview';
  activeGalleryAction = { url: actionUrl, label: actionLabel };
  renderActiveGalleryModal();
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
  if (curtain) {
    curtain.classList.remove('active');
  }
  document.body.style.overflow = '';
};

/* -------------------------------------------------------------
   TOUCH SWIPE: VERTICAL DISMISS & HORIZONTAL GALLERY NAVIGATION
   ------------------------------------------------------------- */
function initSheetSwipeGestures() {
  const win = document.querySelector('.inspector-window');
  const viewport = document.querySelector('.inspector-viewport');
  if (!win) return;

  let startX = 0;
  let startY = 0;
  let moveX = 0;
  let moveY = 0;
  let isHorizontal = false;

  win.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    moveX = startX;
    moveY = startY;
    isHorizontal = false;
  }, { passive: true });

  win.addEventListener('touchmove', (e) => {
    moveX = e.touches[0].clientX;
    moveY = e.touches[0].clientY;
    const diffX = moveX - startX;
    const diffY = moveY - startY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isHorizontal = true;
    }

    if (!isHorizontal && diffY > 0) {
      win.style.transform = `translateY(${diffY}px)`;
    }
  }, { passive: true });

  win.addEventListener('touchend', () => {
    const diffX = moveX - startX;
    const diffY = moveY - startY;

    if (isHorizontal) {
      if (diffX < -45) {
        galleryNext();
      } else if (diffX > 45) {
        galleryPrev();
      }
    } else {
      if (diffY > 110) {
        closeInspector();
      }
    }

    win.style.transform = '';
    startX = 0;
    startY = 0;
    moveX = 0;
    moveY = 0;
    isHorizontal = false;
  });
}

/* -------------------------------------------------------------
   COPY TO CLIPBOARD & TOAST SYSTEM
   ------------------------------------------------------------- */
window.copyContactText = function(text, successMsg) {
  hapticPulse(12);
  playUiClick();

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
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

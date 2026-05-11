(function () {
  'use strict';

  /* ── Размеры исходного скриншота (физические пиксели) ── */
  var IMG_W = 1206, IMG_H = 2622;

  /*
    Доли от изображения где что находится (замерено по ui.jpg):
    - Аватарка K: top 8.5%, left 3.5%, size ~9% ширины
    - Ник "kelly": top 8.5%, left 16%
    - Баланс: top 13.5%, left 5%
    - Закрашиваем область: top 13%, left 3%, w 70%, h 10%
  */
  var FRAC = {
    avatarTop:   0.085, avatarLeft:  0.035, avatarSize: 0.105,
    nameTop:     0.085, nameLeft:    0.160,
    balTop:      0.135, balLeft:     0.050,
    coverTop:    0.128, coverLeft:   0.028, coverW: 0.72, coverH: 0.095
  };

  /* ── State ── */
  var DEFAULT = { balance: 0, change: 0, percent: 0, name: 'kelly' };
  var state = Object.assign({}, DEFAULT);
  try {
    var saved = localStorage.getItem('phantom_state');
    if (saved) state = Object.assign({}, DEFAULT, JSON.parse(saved));
  } catch (_) {}

  /* ── DOM ── */
  var mainBalance    = document.getElementById('main-balance');
  var balanceChange  = document.getElementById('balance-change');
  var balancePercent = document.getElementById('balance-percent');
  var balanceOverlay = document.getElementById('balance-overlay');
  var balanceCover   = document.getElementById('balance-cover');
  var usernameEl     = document.getElementById('username-overlay');
  var avatarBtn      = document.getElementById('avatar-btn');
  var adminPanel     = document.getElementById('admin-panel');
  var adminBackdrop  = document.getElementById('admin-backdrop');
  var inputName      = document.getElementById('input-name');
  var inputBalance   = document.getElementById('input-balance');
  var inputChange    = document.getElementById('input-change');
  var inputPercent   = document.getElementById('input-percent');
  var btnApply       = document.getElementById('btn-apply');
  var btnClose       = document.getElementById('btn-close');
  var ptrIndicator   = document.getElementById('ptr-indicator');

  /* ── Позиционирование по изображению ── */
  function positionElements() {
    var dpr  = window.devicePixelRatio || 1;
    var vw   = window.innerWidth;
    var vh   = window.innerHeight;
    var cssW = IMG_W / dpr;
    var cssH = IMG_H / dpr;
    var scale = Math.max(vw / cssW, vh / cssH);
    var dispW = cssW * scale;
    var dispH = cssH * scale;

    function px(fracY, fracX, el, extraW, extraH) {
      el.style.top  = (dispH * fracY) + 'px';
      el.style.left = (dispW * fracX) + 'px';
      if (extraW !== undefined) el.style.width  = extraW + 'px';
      if (extraH !== undefined) el.style.height = extraH + 'px';
    }

    var avatarPx = dispW * FRAC.avatarSize;
    px(FRAC.avatarTop, FRAC.avatarLeft, avatarBtn, avatarPx, avatarPx);
    avatarBtn.style.marginTop  = -(avatarPx / 2) + 'px';

    px(FRAC.nameTop, FRAC.nameLeft, usernameEl);
    usernameEl.style.marginTop = '-11px';

    px(FRAC.balTop,   FRAC.balLeft,  balanceOverlay);

    /* Закрашивающий прямоугольник */
    balanceCover.style.top    = (dispH * FRAC.coverTop)  + 'px';
    balanceCover.style.left   = (dispW * FRAC.coverLeft) + 'px';
    balanceCover.style.width  = (dispW * FRAC.coverW)    + 'px';
    balanceCover.style.height = (dispH * FRAC.coverH)    + 'px';
  }

  positionElements();
  window.addEventListener('resize', positionElements);

  /* ── Форматирование ── */
  function fmtMain(v) {
    var abs = Math.abs(Number(v) || 0);
    return '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtChange(v) {
    var n = Number(v) || 0;
    return (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toFixed(2);
  }
  function fmtPercent(v) {
    var n = Number(v) || 0;
    return (n >= 0 ? '+' : '-') + Math.abs(n).toFixed(2) + '%';
  }

  /* ── Рендер ── */
  function render() {
    mainBalance.textContent    = fmtMain(state.balance);
    balanceChange.textContent  = fmtChange(state.change);
    balancePercent.textContent = fmtPercent(state.percent);
    usernameEl.textContent     = state.name || 'kelly';
  }
  render();

  /* ── Admin open/close ── */
  function openAdmin() {
    inputName.value    = state.name    || '';
    inputBalance.value = state.balance !== 0 ? String(state.balance) : '';
    inputChange.value  = state.change  !== 0 ? String(state.change)  : '';
    inputPercent.value = state.percent !== 0 ? String(state.percent) : '';
    adminPanel.classList.remove('hidden');
  }
  function closeAdmin() { adminPanel.classList.add('hidden'); }

  avatarBtn.addEventListener('touchstart', function (e) {
    e.stopPropagation(); openAdmin();
  }, { passive: true });
  avatarBtn.addEventListener('click', openAdmin);

  adminBackdrop.addEventListener('touchstart', function (e) {
    if (e.target === adminBackdrop) closeAdmin();
  }, { passive: true });

  btnApply.addEventListener('click', function () {
    state.name    = inputName.value.trim() || 'kelly';
    state.balance = parseFloat(inputBalance.value) || 0;
    state.change  = parseFloat(inputChange.value)  || 0;
    state.percent = parseFloat(inputPercent.value) || 0;
    try { localStorage.setItem('phantom_state', JSON.stringify(state)); } catch (_) {}
    render();
    closeAdmin();
  });
  btnClose.addEventListener('click', closeAdmin);

  /* ── Pull-to-refresh ── */
  var ptrStartY = 0, ptrActive = false;
  var PTR_THRESHOLD = 80;

  document.addEventListener('touchstart', function (e) {
    ptrStartY = e.touches[0].clientY;
    ptrActive = false;
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;

    var dy = e.touches[0].clientY - ptrStartY;
    if (dy > 0 && adminPanel.classList.contains('hidden')) {
      var progress = Math.min(dy, PTR_THRESHOLD);
      ptrIndicator.style.top = (progress * 0.7 - 56) + 'px';
      ptrIndicator.querySelector('svg').style.transform = 'rotate(' + (progress / PTR_THRESHOLD * 360) + 'deg)';
      ptrActive = dy >= PTR_THRESHOLD;
    }
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', function () {
    if (ptrActive) {
      ptrIndicator.classList.add('spinning');
      ptrIndicator.style.top = '16px';
      setTimeout(function () { location.reload(); }, 600);
    } else {
      ptrIndicator.style.top = '-56px';
      ptrIndicator.querySelector('svg').style.transform = '';
    }
    ptrActive = false;
  }, { passive: true });

  /* ── Блокировка зума ── */
  document.addEventListener('gesturestart',  function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gestureend',    function (e) { e.preventDefault(); }, { passive: false });

  var lastTouchEnd = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouchEnd < 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  /* ── Service Worker ── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

})();

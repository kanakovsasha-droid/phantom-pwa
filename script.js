(function () {
  'use strict';

  /* ── State ── */
  var DEFAULT_STATE = { balance: 0, change: 0, percent: 0 };
  var state = Object.assign({}, DEFAULT_STATE);

  try {
    var saved = localStorage.getItem('phantom_balance');
    if (saved) {
      var parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        state = parsed;
      }
    }
  } catch (_) {}

  /* ── DOM refs ── */
  var mainBalance    = document.getElementById('main-balance');
  var balanceChange  = document.getElementById('balance-change');
  var balancePercent = document.getElementById('balance-percent');
  var adminPanel     = document.getElementById('admin-panel');
  var adminBackdrop  = document.getElementById('admin-backdrop');
  var inputBalance   = document.getElementById('input-balance');
  var inputChange    = document.getElementById('input-change');
  var inputPercent   = document.getElementById('input-percent');
  var btnApply       = document.getElementById('btn-apply');
  var btnClose       = document.getElementById('btn-close');
  var settingsBtn    = document.getElementById('settings-btn');

  /* ── Formatters ── */
  function fmtMain(v) {
    var abs = Math.abs(Number(v) || 0);
    return '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtChange(v) {
    var n = Number(v) || 0;
    var sign = n >= 0 ? '+' : '-';
    return sign + '$' + Math.abs(n).toFixed(2);
  }

  function fmtPercent(v) {
    var n = Number(v) || 0;
    var sign = n >= 0 ? '+' : '-';
    return sign + Math.abs(n).toFixed(2) + '%';
  }

  /* ── Render ── */
  function render() {
    mainBalance.textContent    = fmtMain(state.balance);
    balanceChange.textContent  = fmtChange(state.change);
    balancePercent.textContent = fmtPercent(state.percent);
  }

  render();

  /* ── Кнопка настроек ── */
  settingsBtn.addEventListener('touchstart', function (e) {
    e.stopPropagation();
    openAdmin();
  }, { passive: true });

  settingsBtn.addEventListener('click', function () {
    openAdmin();
  });

  /* ── Admin open / close ── */
  function openAdmin() {
    inputBalance.value = state.balance !== 0 ? String(state.balance) : '';
    inputChange.value  = state.change  !== 0 ? String(state.change)  : '';
    inputPercent.value = state.percent !== 0 ? String(state.percent) : '';
    adminPanel.classList.remove('hidden');
  }

  function closeAdmin() {
    adminPanel.classList.add('hidden');
  }

  /* Close on backdrop tap */
  adminBackdrop.addEventListener('touchstart', function (e) {
    if (e.target === adminBackdrop) closeAdmin();
  }, { passive: true });

  /* Apply button */
  btnApply.addEventListener('click', function () {
    state.balance = parseFloat(inputBalance.value) || 0;
    state.change  = parseFloat(inputChange.value)  || 0;
    state.percent = parseFloat(inputPercent.value) || 0;
    try {
      localStorage.setItem('phantom_balance', JSON.stringify(state));
    } catch (_) {}
    render();
    closeAdmin();
  });

  /* Cancel button */
  btnClose.addEventListener('click', closeAdmin);

  /* ── Prevent zoom (pinch) ── */
  document.addEventListener('gesturestart',  function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gestureend',    function (e) { e.preventDefault(); }, { passive: false });

  /* ── Pull-to-refresh ── */
  var ptrIndicator = document.getElementById('ptr-indicator');
  var ptrStartY = 0;
  var ptrActive = false;
  var PTR_THRESHOLD = 80;

  document.addEventListener('touchstart', function (e) {
    ptrStartY = e.touches[0].clientY;
    ptrActive = false;
  }, { passive: true });

  /* ── Prevent scroll/bounce — allow native scroll inside inputs ── */
  document.addEventListener('touchmove', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;

    var dy = e.touches[0].clientY - ptrStartY;
    if (dy > 0 && !adminPanel.classList.contains('hidden') === false) {
      var progress = Math.min(dy, PTR_THRESHOLD);
      ptrIndicator.style.top = (progress * 0.7 - 56) + 'px';
      var rotate = (progress / PTR_THRESHOLD) * 360;
      ptrIndicator.querySelector('svg').style.transform = 'rotate(' + rotate + 'deg)';
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

  /* ── Disable double-tap zoom ── */
  var lastTouchEnd = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouchEnd < 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  /* ── Service Worker ── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

})();

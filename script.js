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
  var tapZone        = document.getElementById('tap-zone');

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

  /* ── Triple-tap detection on header zone ── */
  var tapCount = 0;
  var tapTimer = null;

  tapZone.addEventListener('touchstart', function () {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(function () {
      tapCount = 0;
    }, 450);

    if (tapCount >= 3) {
      tapCount = 0;
      clearTimeout(tapTimer);
      openAdmin();
    }
  }, { passive: true });

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

  /* ── Prevent scroll/bounce — allow native scroll inside inputs ── */
  document.addEventListener('touchmove', function (e) {
    var t = e.target;
    /* Allow default only when inside an input so the keyboard doesn't block typing */
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    e.preventDefault();
  }, { passive: false });

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

(function () {
  'use strict';

  var state = { balance: 0, change: 0, percent: 0, name: 'kelly' };
  try {
    var s = localStorage.getItem('phantom_state');
    if (s) state = Object.assign(state, JSON.parse(s));
  } catch (_) {}

  var bgImg          = document.getElementById('bg');
  var mainBalance    = document.getElementById('main-balance');
  var balanceChange  = document.getElementById('balance-change');
  var balancePercent = document.getElementById('balance-percent');
  var balanceOverlay = document.getElementById('balance-overlay');
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

  function fmt(v) {
    return '$' + Math.abs(Number(v)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function fmtSigned(v, dollar) {
    var n = Number(v)||0, sign = n>=0?'+':'-';
    return dollar ? sign+'$'+Math.abs(n).toFixed(2) : sign+Math.abs(n).toFixed(2)+'%';
  }

  function render() {
    mainBalance.textContent    = fmt(state.balance);
    balanceChange.textContent  = fmtSigned(state.change, true);
    balancePercent.textContent = fmtSigned(state.percent, false);
    usernameEl.textContent     = state.name || 'kelly';
  }
  render();

  /* ---------- Точное позиционирование поверх фонового изображения ----------
     Координаты указаны в пикселях оригинального изображения (1206 × 2622).
     Чёрные прямоугольники, нарисованные поверх статичного текста:
       - Ник:    x 185–505, y 175–320
       - Баланс: x 25–805,  y 290–620
  */
  var IMG_W = 1206, IMG_H = 2622;

  // Область нажатия на аватарку (левый круг в строке с ником)
  var AV_X = 22,  AV_Y = 178, AV_W = 155, AV_H = 142;
  // Начало текста ника (выровнен по вертикальному центру чёрного прямоугольника)
  var NM_X = 186, NM_Y = 220;
  // Начало блока баланса
  var BL_X = 22,  BL_Y = 330;

  function calibrate() {
    var nw = bgImg.naturalWidth  || IMG_W;
    var nh = bgImg.naturalHeight || IMG_H;
    var rect = bgImg.getBoundingClientRect();
    var dw = rect.width, dh = rect.height;

    // object-fit: cover — масштаб такой, чтобы заполнить контейнер целиком
    var scale = Math.max(dw / nw, dh / nh);

    // object-position: top center
    var ox = rect.left + (dw - nw * scale) / 2; // горизонтально по центру
    var oy = rect.top;                            // вертикально от верха

    function imgToCSS(ix, iy) {
      return { x: ox + ix * scale, y: oy + iy * scale };
    }

    var av = imgToCSS(AV_X, AV_Y);
    avatarBtn.style.left   = av.x + 'px';
    avatarBtn.style.top    = av.y + 'px';
    avatarBtn.style.width  = (AV_W * scale) + 'px';
    avatarBtn.style.height = (AV_H * scale) + 'px';

    var nm = imgToCSS(NM_X, NM_Y);
    usernameEl.style.left     = nm.x + 'px';
    usernameEl.style.top      = nm.y + 'px';
    usernameEl.style.fontSize = Math.round(68 * scale) + 'px';

    var bl = imgToCSS(BL_X, BL_Y);
    balanceOverlay.style.left    = bl.x + 'px';
    balanceOverlay.style.top     = bl.y + 'px';
    mainBalance.style.fontSize   = Math.round(155 * scale) + 'px';
    balanceChange.style.fontSize = Math.round(46 * scale) + 'px';
    balancePercent.style.fontSize = Math.round(40 * scale) + 'px';
    // gap и margin-top в sub-balance масштабируем тоже
    document.getElementById('sub-balance').style.gap       = Math.round(8  * scale) + 'px';
    document.getElementById('sub-balance').style.marginTop = Math.round(18 * scale) + 'px';
  }

  if (bgImg.complete && bgImg.naturalWidth > 0) {
    calibrate();
  } else {
    bgImg.addEventListener('load', calibrate);
  }
  window.addEventListener('resize', calibrate);

  function openAdmin() {
    inputName.value    = state.name || '';
    inputBalance.value = state.balance || '';
    inputChange.value  = state.change  || '';
    inputPercent.value = state.percent || '';
    adminPanel.classList.remove('hidden');
  }
  function closeAdmin() { adminPanel.classList.add('hidden'); }

  avatarBtn.addEventListener('touchstart', function(e){ e.stopPropagation(); openAdmin(); }, {passive:true});
  avatarBtn.addEventListener('click', openAdmin);
  adminBackdrop.addEventListener('touchstart', function(e){ if(e.target===adminBackdrop) closeAdmin(); }, {passive:true});

  btnApply.addEventListener('click', function() {
    state.name    = inputName.value.trim() || 'kelly';
    state.balance = parseFloat(inputBalance.value) || 0;
    state.change  = parseFloat(inputChange.value)  || 0;
    state.percent = parseFloat(inputPercent.value) || 0;
    try { localStorage.setItem('phantom_state', JSON.stringify(state)); } catch(_){}
    render(); closeAdmin();
  });
  btnClose.addEventListener('click', closeAdmin);

  /* Pull-to-refresh */
  var startY = 0, pulling = false, PTR = 80;
  document.addEventListener('touchstart', function(e){ startY = e.touches[0].clientY; pulling=false; }, {passive:true});
  document.addEventListener('touchmove', function(e) {
    var t = e.target;
    if (t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA')) return;
    var dy = e.touches[0].clientY - startY;
    if (dy > 0 && adminPanel.classList.contains('hidden')) {
      var p = Math.min(dy, PTR);
      ptrIndicator.style.top = (p*0.7-56)+'px';
      ptrIndicator.querySelector('svg').style.transform = 'rotate('+(p/PTR*360)+'deg)';
      pulling = dy >= PTR;
    }
    e.preventDefault();
  }, {passive:false});
  document.addEventListener('touchend', function() {
    if (pulling) {
      ptrIndicator.classList.add('spinning');
      ptrIndicator.style.top = '16px';
      setTimeout(function(){ location.reload(); }, 600);
    } else {
      ptrIndicator.style.top = '-56px';
      ptrIndicator.querySelector('svg').style.transform = '';
    }
    pulling = false;
  }, {passive:true});

  document.addEventListener('gesturestart',  function(e){e.preventDefault();},{passive:false});
  document.addEventListener('gesturechange', function(e){e.preventDefault();},{passive:false});
  var lastTE = 0;
  document.addEventListener('touchend', function(e){
    var n=Date.now(); if(n-lastTE<300) e.preventDefault(); lastTE=n;
  }, {passive:false});

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){});
    });
  }
})();

/* ============================================================================
 * MONITOR LAST MILE SRJ3 v2.0
 * Bookmarklet single-file vanilla JS — Mercado Livre Last Mile
 * ============================================================================ */
(function () {
  'use strict';

  try {
    if (window.__MLM_SRJ3__ && typeof window.__MLM_SRJ3__.destroy === 'function') {
      window.__MLM_SRJ3__.destroy();
    }
  } catch (e) {}

  var APP = window.__MLM_SRJ3__ = {
    version: '2.0',
    panel: null,
    timers: { refresh: null, countdown: null },
    listeners: [],
    destroy: function () {
      try {
        if (this.timers.refresh)   clearInterval(this.timers.refresh);
        if (this.timers.countdown) clearInterval(this.timers.countdown);
        this.listeners.forEach(function (l) {
          try { l.target.removeEventListener(l.type, l.fn, l.opts); } catch (e) {}
        });
        this.listeners = [];
        if (this.panel && this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
        var st = document.getElementById('mlm_srj3_style');
        if (st && st.parentNode) st.parentNode.removeChild(st);
        var ts = document.getElementById('mlm_srj3_toasts');
        if (ts && ts.parentNode) ts.parentNode.removeChild(ts);
      } catch (e) {}
    }
  };

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    APP.listeners.push({ target: target, type: type, fn: fn, opts: opts });
  }

  var T = {
    bg: '#0a0e1a', bgPurple: '#1e1b4b',
    surface: 'rgba(17,24,39,.85)', surface2: 'rgba(30,27,75,.6)',
    surfaceHi: 'rgba(31,41,55,.95)',
    border: 'rgba(148,163,184,.15)', borderHi: 'rgba(124,58,237,.35)',
    text: '#e2e8f0', textHi: '#f1f5f9',
    muted: '#94a3b8', mutedHi: '#cbd5e1',
    ok: '#10b981', warn: '#f59e0b', err: '#ef4444', info: '#06b6d4',
    brand: '#7c3aed', brand2: '#06b6d4',
    grad: 'linear-gradient(135deg,#7c3aed 0%,#06b6d4 100%)',
    gradSoft: 'linear-gradient(135deg,rgba(124,58,237,.15) 0%,rgba(6,182,212,.15) 100%)',
    shadow: '0 25px 50px -12px rgba(0,0,0,.6)',
    shadowSm: '0 4px 12px rgba(0,0,0,.4)',
    glow: '0 0 24px rgba(124,58,237,.35)',
    fUI: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif",
    fMono: "'JetBrains Mono','Fira Code',Consolas,monospace",
    z: 2147483600
  };

  function mk(tag, css, html) {
    var el = document.createElement(tag);
    if (css)  el.style.cssText = css;
    if (html != null) el.innerHTML = html;
    return el;
  }
  function $(sel, root)  { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fmt(n) { if (n == null || isNaN(n)) return '0'; return Number(n).toLocaleString('pt-BR'); }
  function pad(n, len) { var s = String(n); while (s.length < (len || 2)) s = '0' + s; return s; }
  function pct(num, den) { if (!den || den <= 0) return '—'; return ((num / den) * 100).toFixed(1) + '%'; }
  function escapeHTML(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeCSV(v) {
    if (v == null) return '';
    var s = String(v);
    if (s.indexOf(';') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
  function copyText(txt) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    } catch (e) {}
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = txt;
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  function toastContainer() {
    var c = document.getElementById('mlm_srj3_toasts');
    if (!c) {
      c = mk('div', 'position:fixed;top:20px;right:20px;z-index:' + (T.z + 50) +
        ';display:flex;flex-direction:column;gap:10px;pointer-events:none;font-family:' + T.fUI);
      c.id = 'mlm_srj3_toasts';
      document.body.appendChild(c);
    }
    return c;
  }
  function toast(msg, kind) {
    var colors = { ok: T.ok, err: T.err, warn: T.warn, info: T.info };
    var col = colors[kind] || T.info;
    var t = mk('div',
      'background:' + T.surfaceHi + ';backdrop-filter:blur(20px);border:1px solid ' + col +
      ';border-left:3px solid ' + col + ';color:' + T.text +
      ';padding:12px 16px;border-radius:10px;box-shadow:' + T.shadowSm +
      ';font-size:13px;min-width:240px;max-width:360px;pointer-events:auto' +
      ';animation:mlm_slideIn .25s ease-out',
      escapeHTML(msg));
    toastContainer().appendChild(t);
    setTimeout(function () {
      t.style.animation = 'mlm_slideOut .25s ease-in forwards';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, 3200);
  }

  function confirmModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var overlay = mk('div',
        'position:fixed;inset:0;background:rgba(2,6,23,.7);backdrop-filter:blur(8px);z-index:' +
        (T.z + 100) + ';display:flex;align-items:center;justify-content:center' +
        ';font-family:' + T.fUI + ';animation:mlm_fadeIn .2s ease-out');
      var box = mk('div',
        'background:' + T.surfaceHi + ';border:1px solid ' + T.border +
        ';border-radius:14px;padding:24px;min-width:340px;max-width:480px;color:' + T.text +
        ';box-shadow:' + T.shadow + ';animation:mlm_slideUp .25s ease-out');
      var ttl = mk('div', 'font-size:15px;font-weight:600;color:' + T.textHi + ';margin-bottom:8px',
        escapeHTML(opts.title || 'Confirmar'));
      var msg = mk('div', 'font-size:13px;color:' + T.muted + ';margin-bottom:20px;line-height:1.5',
        escapeHTML(opts.message || ''));
      var actions = mk('div', 'display:flex;gap:8px;justify-content:flex-end');
      var btnCancel = mk('button',
        'background:transparent;border:1px solid ' + T.border + ';color:' + T.muted +
        ';padding:8px 18px;border-radius:8px;cursor:pointer;font-family:' + T.fUI +
        ';font-size:12px;font-weight:500', escapeHTML(opts.cancelText || 'Cancelar'));
      var okColor = opts.danger ? T.err : T.brand;
      var btnOk = mk('button',
        'background:' + okColor + ';border:none;color:#fff;padding:8px 18px;border-radius:8px' +
        ';cursor:pointer;font-family:' + T.fUI + ';font-size:12px;font-weight:600',
        escapeHTML(opts.okText || 'Confirmar'));
      function close(val) {
        overlay.style.animation = 'mlm_fadeOut .15s ease-in forwards';
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          document.removeEventListener('keydown', onKey);
          resolve(val);
        }, 160);
      }
      function onKey(e) {
        if (e.key === 'Escape') close(false);
        else if (e.key === 'Enter') close(true);
      }
      btnCancel.onclick = function () { close(false); };
      btnOk.onclick     = function () { close(true); };
      overlay.onclick   = function (e) { if (e.target === overlay) close(false); };
      document.addEventListener('keydown', onKey);
      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      box.appendChild(ttl); box.appendChild(msg); box.appendChild(actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      btnOk.focus();
    });
  }

  var ICON = {
    refresh:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
    play:     '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    download: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    file:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    copy:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    print:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    search:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    upload:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    msg:      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    report:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    min:      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    max:      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>',
    close:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>',
    zoomIn:   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    zoomOut:  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    chevR:    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    chevD:    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    trash:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>'
  };

  var STATE = {
    SSCS: ['SRJ1', 'SRJ3', 'SRJ5', 'SRJ7', 'SRJ8', 'SRJ10', 'SES1', 'SES2'],
    ssc: 'SRJ3',
    date: new Date().toISOString().slice(0, 10),
    routes: [], lastFetch: null, loading: false,
    tab: 'ROTAS', scale: 1, minimized: false, maximized: false, prevStyle: null,
    filters: {
      OFENSORAS:   { carrier: new Set(), cluster: new Set(), status: '' },
      INSUCESSOS:  { motivo: new Set(), carrier: new Set() },
      MOTORISTAS:  { carrier: new Set() },
      PNR:         { carrier: new Set() },
      AGENCIAS:    { sort: 'all' },
      DEVOLUCOES:  { sort: 'all' }
    },
    expanded: {},
    refreshMs: 600000, refreshPaused: false, nextRefreshAt: 0,
    fetching: false, refreshLockedByFetch: false,
    globalFilters: {
      status: new Set(),
      tipo: new Set(),
      modal: new Set(),
      carrier: new Set(),
      driver: new Set(),
      ciclo: new Set(),
      origem: new Set(),
      placa: '',
      rank: 'none'
    },
    // Controle de UI para preservar interação durante refresh
    ui: {
      openDropdown: null,        // qual dropdown está aberto
      dropdownScrollTop: 0,      // scroll dentro do dropdown
      contentScrollTop: 0,       // scroll da área de conteúdo
      searchValue: ''            // valor do campo de busca no dropdown
    }
  };
  APP.STATE = STATE; APP.render = function(){ if(typeof renderKPIs==='function')renderKPIs(); if(typeof renderActiveTab==='function')renderActiveTab(); };

  var Agenda = {
    KEY: 'mlm_srj3_agenda_v2', DATE_KEY: 'mlm_srj3_agenda_date', data: {},
    load: function () {
      try { var raw = localStorage.getItem(this.KEY); this.data = raw ? JSON.parse(raw) : {}; }
      catch (e) { this.data = {}; }
      return this.data;
    },
    save: function (obj) {
      try {
        localStorage.setItem(this.KEY, JSON.stringify(obj));
        localStorage.setItem(this.DATE_KEY, new Date().toISOString());
        this.data = obj; return true;
      } catch (e) { toast('Erro ao salvar agenda', 'err'); return false; }
    },
    clear: function () {
      try { localStorage.removeItem(this.KEY); localStorage.removeItem(this.DATE_KEY); } catch (e) {}
      this.data = {};
    },
    lastImport: function () {
      try {
        var d = localStorage.getItem(this.DATE_KEY);
        if (!d) return 'Nunca';
        return new Date(d).toLocaleString('pt-BR');
      } catch (e) { return 'Nunca'; }
    },
    count: function () { return Object.keys(this.data).length; },
    normalize: function (nome) {
      if (!nome) return '';
      return String(nome).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ').trim();
    },
    lookup: function (nome) { return this.data[this.normalize(nome)] || null; }
  };
  Agenda.load();

  var Prefs = {
    KEY: 'mlm_srj3_prefs_v2',
    load: function () {
      try {
        var raw = localStorage.getItem(this.KEY);
        if (!raw) return;
        var p = JSON.parse(raw);
        if (p.ssc && STATE.SSCS.indexOf(p.ssc) >= 0) STATE.ssc = p.ssc;
        if (typeof p.scale === 'number' && p.scale >= 0.6 && p.scale <= 1.5) STATE.scale = p.scale;
        if (typeof p.refreshPaused === 'boolean') STATE.refreshPaused = p.refreshPaused;
        if (p.tab) STATE.tab = p.tab;
      } catch (e) {}
    },
    save: function () {
      try {
        localStorage.setItem(this.KEY, JSON.stringify({
          ssc: STATE.ssc, scale: STATE.scale,
          refreshPaused: STATE.refreshPaused, tab: STATE.tab
        }));
      } catch (e) {}
    }
  };
  Prefs.load();

  var styleEl = mk('style');
  styleEl.id = 'mlm_srj3_style';
  styleEl.textContent = [
    '@keyframes mlm_fadeIn { from{opacity:0} to{opacity:1} }',
    '@keyframes mlm_fadeOut { from{opacity:1} to{opacity:0} }',
    '@keyframes mlm_slideIn { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }',
    '@keyframes mlm_slideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(20px);opacity:0} }',
    '@keyframes mlm_slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }',
    '@keyframes mlm_shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }',
    '@keyframes mlm_pulse { 0%,100%{opacity:1} 50%{opacity:.55} }',
    '@keyframes mlm_spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }',
    '@keyframes mlm_glow { 0%,100%{box-shadow:0 0 16px rgba(124,58,237,.3)} 50%{box-shadow:0 0 24px rgba(124,58,237,.6)} }',
    '#mlm_srj3_panel ::-webkit-scrollbar { width:10px; height:10px }',
    '#mlm_srj3_panel ::-webkit-scrollbar-track { background:rgba(15,23,42,.4); border-radius:5px }',
    '#mlm_srj3_panel ::-webkit-scrollbar-thumb { background:rgba(124,58,237,.4); border-radius:5px }',
    '#mlm_srj3_panel ::-webkit-scrollbar-thumb:hover { background:rgba(124,58,237,.7) }',
    '#mlm_srj3_panel *, #mlm_srj3_panel *::before, #mlm_srj3_panel *::after { box-sizing:border-box }',
    '#mlm_srj3_panel button { font-family:' + T.fUI + '; outline:none }',
    '#mlm_srj3_panel input, #mlm_srj3_panel select, #mlm_srj3_panel textarea { font-family:' + T.fUI + '; outline:none }',
    '#mlm_srj3_panel input:focus, #mlm_srj3_panel select:focus, #mlm_srj3_panel textarea:focus { border-color:' + T.brand + '; box-shadow:0 0 0 3px rgba(124,58,237,.15) }',
    '.mlm_hover_lift { transition:transform .15s ease, box-shadow .15s ease }',
    '.mlm_hover_lift:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,.4) }',
    '.mlm_tab_active { background:' + T.grad + ' !important; color:#fff !important; box-shadow:' + T.glow + ' }',
    '.mlm_chip_on { background:' + T.gradSoft + ' !important; border-color:' + T.brand + ' !important; color:' + T.textHi + ' !important }',
    '.mlm_skeleton { background:linear-gradient(90deg,rgba(148,163,184,.08) 0%,rgba(148,163,184,.18) 50%,rgba(148,163,184,.08) 100%); background-size:200% 100%; animation:mlm_shimmer 1.4s ease-in-out infinite; border-radius:6px }',
    '.mlm_kpi_pulse { animation:mlm_pulse 2s ease-in-out infinite }',
    '.mlm_spin { animation:mlm_spin 1s linear infinite }',
    '.mlm_btn { background:transparent; border:1px solid ' + T.border + '; color:' + T.mutedHi + '; padding:7px 14px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:500; display:inline-flex; align-items:center; gap:6px; transition:all .15s ease }',
    '.mlm_btn:hover { border-color:' + T.borderHi + '; color:' + T.textHi + '; background:rgba(124,58,237,.08) }',
    '.mlm_btn_primary { background:' + T.grad + '; border:none; color:#fff }',
    '.mlm_btn_primary:hover { filter:brightness(1.15); transform:translateY(-1px) }',
    '.mlm_btn_ok { border-color:' + T.ok + '; color:' + T.ok + ' }',
    '.mlm_btn_ok:hover { background:rgba(16,185,129,.1); color:' + T.ok + ' }',
    '.mlm_btn_warn { border-color:' + T.warn + '; color:' + T.warn + ' }',
    '.mlm_btn_warn:hover { background:rgba(245,158,11,.1); color:' + T.warn + ' }',
    '.mlm_btn_err { border-color:' + T.err + '; color:' + T.err + ' }',
    '.mlm_btn_err:hover { background:rgba(239,68,68,.1); color:' + T.err + ' }'
  ].join('\n');
  document.head.appendChild(styleEl);
  // ==========================================================================
  // BUILD DO PAINEL
  // ==========================================================================
  var panel = mk('div',
    'position:fixed;top:60px;left:60px;width:1180px;max-height:88vh;' +
    'background:linear-gradient(135deg,' + T.bg + ' 0%,' + T.bgPurple + ' 100%);' +
    'border:1px solid ' + T.border + ';border-radius:16px;box-shadow:' + T.shadow + ';' +
    'color:' + T.text + ';font-family:' + T.fUI + ';font-size:13px;' +
    'z-index:' + T.z + ';display:flex;flex-direction:column;overflow:hidden;' +
    'backdrop-filter:blur(20px);transform:scale(' + STATE.scale + ');transform-origin:top left;' +
    'animation:mlm_slideUp .3s ease-out');
  panel.id = 'mlm_srj3_panel';
  APP.panel = panel;

  var header = mk('div',
    'display:flex;align-items:center;gap:14px;padding:14px 18px;background:' + T.surface +
    ';border-bottom:1px solid ' + T.border + ';cursor:move;user-select:none;flex-shrink:0');
  header.id = 'mlm_srj3_header';

  var logoDot = mk('div',
    'width:10px;height:10px;border-radius:50%;background:' + T.grad +
    ';box-shadow:' + T.glow + ';flex-shrink:0;animation:mlm_glow 3s ease-in-out infinite');
  var titleWrap = mk('div', 'display:flex;align-items:center;gap:10px;flex-shrink:0');
  var titleEl = mk('div', 'font-size:14px;font-weight:600;color:' + T.textHi,
    'Monitor Last Mile <span style="color:' + T.brand2 + '">SRJ3</span>');
  var badge = mk('span',
    'background:' + T.grad + ';color:#fff;font-size:10px;font-weight:700;' +
    'padding:2px 8px;border-radius:10px;font-family:' + T.fMono, 'v' + APP.version);
  titleWrap.appendChild(titleEl); titleWrap.appendChild(badge);

  var spacer = mk('div', 'flex:1');

  var refreshWrap = mk('div',
    'display:flex;align-items:center;gap:8px;padding:6px 12px;background:rgba(15,23,42,.5);' +
    'border:1px solid ' + T.border + ';border-radius:10px;font-size:11px;color:' + T.muted);
  var refreshIcon = mk('span', 'color:' + T.brand2 + ';display:flex', ICON.refresh);
  refreshIcon.id = 'mlm_srj3_refresh_icon';
  var refreshLabel = mk('span',
    'font-family:' + T.fMono + ';color:' + T.mutedHi + ';font-weight:500', 'Próx: --:--');
  refreshLabel.id = 'mlm_srj3_refresh_label';
  var refreshBtn = mk('button',
    'background:transparent;border:none;color:' + T.muted + ';cursor:pointer;padding:2px 4px;' +
    'display:flex;align-items:center;border-radius:4px',
    STATE.refreshPaused ? ICON.play : ICON.pause);
  refreshBtn.title = STATE.refreshPaused ? 'Retomar' : 'Pausar';
  refreshWrap.appendChild(refreshIcon);
  refreshWrap.appendChild(refreshLabel);
  refreshWrap.appendChild(refreshBtn);

  var lastUpdate = mk('div', 'font-size:11px;color:' + T.muted + ';font-family:' + T.fMono);
  lastUpdate.textContent = 'Aguardando...';

  function winBtn(svg, title) {
    var b = mk('button',
      'background:transparent;border:1px solid ' + T.border + ';color:' + T.muted +
      ';width:28px;height:28px;border-radius:7px;cursor:pointer;display:flex;' +
      'align-items:center;justify-content:center;transition:all .15s ease', svg);
    b.title = title;
    b.onmouseenter = function () {
      this.style.borderColor = T.borderHi; this.style.color = T.textHi;
      this.style.background = 'rgba(124,58,237,.1)';
    };
    b.onmouseleave = function () {
      this.style.borderColor = T.border; this.style.color = T.muted;
      this.style.background = 'transparent';
    };
    return b;
  }
  var btnZoomOut = winBtn(ICON.zoomOut, 'Diminuir zoom');
  var btnZoomIn  = winBtn(ICON.zoomIn,  'Aumentar zoom');
  var btnMin     = winBtn(ICON.min,     'Minimizar');
  var btnMax     = winBtn(ICON.max,     'Maximizar');
  var btnClose   = winBtn(ICON.close,   'Fechar');
  btnClose.onmouseenter = function () {
    this.style.borderColor = T.err; this.style.color = T.err;
    this.style.background = 'rgba(239,68,68,.1)';
  };

  var winCtrls = mk('div', 'display:flex;gap:6px;align-items:center');
  winCtrls.appendChild(btnZoomOut); winCtrls.appendChild(btnZoomIn);
  winCtrls.appendChild(btnMin); winCtrls.appendChild(btnMax); winCtrls.appendChild(btnClose);

  header.appendChild(logoDot); header.appendChild(titleWrap);
  header.appendChild(spacer); header.appendChild(refreshWrap);
  header.appendChild(lastUpdate); header.appendChild(winCtrls);
  panel.appendChild(header);

  var controls = mk('div',
    'display:flex;align-items:center;gap:10px;padding:14px 18px;background:rgba(15,23,42,.4);' +
    'border-bottom:1px solid ' + T.border + ';flex-wrap:wrap;flex-shrink:0');

  var lblSSC = mk('span', 'font-size:11px;color:' + T.muted + ';font-weight:600;letter-spacing:.5px', 'SSC');
  var selSSC = mk('select',
    'background:' + T.surface + ';border:1px solid ' + T.border + ';color:' + T.textHi +
    ';padding:7px 12px;border-radius:8px;font-size:12px;cursor:pointer;font-weight:600;' +
    'font-family:' + T.fMono);
  STATE.SSCS.forEach(function (s) {
    var op = mk('option', '', s);
    op.value = s;
    if (s === STATE.ssc) op.selected = true;
    selSSC.appendChild(op);
  });

  var lblDate = mk('span', 'font-size:11px;color:' + T.muted + ';font-weight:600;margin-left:6px', 'DATA');
  var inpDate = mk('input',
    'background:' + T.surface + ';border:1px solid ' + T.border + ';color:' + T.textHi +
    ';padding:7px 12px;border-radius:8px;font-size:12px;font-family:' + T.fMono + ';color-scheme:dark');
  inpDate.type = 'date'; inpDate.value = STATE.date;

  var btnSearch = mk('button', '', ICON.search + '<span>Buscar</span>');
  btnSearch.style.cssText = 'background:' + T.grad + ';border:none;color:#fff;padding:8px 16px;' +
    'border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;' +
    'align-items:center;gap:6px;transition:all .15s ease';
  btnSearch.onmouseenter = function () { this.style.filter = 'brightness(1.15)'; };
  btnSearch.onmouseleave = function () { this.style.filter = 'none'; };

  var ctrlSpacer = mk('div', 'flex:1');

  function actionBtn(icon, label, color) {
    var b = mk('button', '', icon + '<span>' + escapeHTML(label) + '</span>');
    b.style.cssText = 'background:transparent;border:1px solid ' + (color || T.border) +
      ';color:' + (color || T.mutedHi) + ';padding:7px 14px;border-radius:8px;cursor:pointer;' +
      'font-size:12px;font-weight:500;display:inline-flex;align-items:center;gap:6px;' +
      'transition:all .15s ease';
    return b;
  }
  var btnReport     = actionBtn(ICON.msg,    'Report Hora a Hora', T.ok);
  var btnFechamento = actionBtn(ICON.report, 'Gerar Fechamento',   T.warn);
  var btnAgenda     = actionBtn(ICON.upload, 'Importar Agenda',    null);

  controls.appendChild(lblSSC); controls.appendChild(selSSC);
  controls.appendChild(lblDate); controls.appendChild(inpDate);
  controls.appendChild(btnSearch); controls.appendChild(ctrlSpacer);
  controls.appendChild(btnReport); controls.appendChild(btnFechamento); controls.appendChild(btnAgenda);
  panel.appendChild(controls);

  // KPIs
  var kpiWrap = mk('div',
    'display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:14px 18px;' +
    'background:rgba(15,23,42,.2);border-bottom:1px solid ' + T.border + ';flex-shrink:0');

  var KPI_DEFS = [
    { id: 'total',     label: 'Total Pacotes',     accent: T.brand2 },
    { id: 'delivered', label: 'Entregues',         accent: T.ok },
    { id: 'failed',    label: 'Insucessos',        accent: T.err },
    { id: 'pnr',       label: 'PNR',               accent: T.warn },
    { id: 'running',   label: 'Rotas Andamento',   accent: T.info },
    { id: 'finished',  label: 'Rotas Finalizadas', accent: T.brand }
  ];
  KPI_DEFS.forEach(function (k) {
    var card = mk('div',
      'background:' + T.surface + ';border:1px solid ' + T.border +
      ';border-left:3px solid ' + k.accent + ';border-radius:10px;padding:12px 14px;' +
      'position:relative;overflow:hidden;transition:transform .15s ease');
    card.className = 'mlm_hover_lift';
    card.id = 'mlm_srj3_kpi_' + k.id;
    var lbl = mk('div',
      'font-size:10px;color:' + T.muted + ';font-weight:600;letter-spacing:.5px;' +
      'text-transform:uppercase;margin-bottom:6px', k.label);
    var val = mk('div',
      'font-size:22px;font-weight:700;color:' + T.textHi + ';font-family:' + T.fMono +
      ';line-height:1.1', '—');
    val.id = 'mlm_srj3_kpi_' + k.id + '_val';
    var sub = mk('div', 'font-size:10px;color:' + T.muted + ';margin-top:3px;font-family:' + T.fMono);
    sub.id = 'mlm_srj3_kpi_' + k.id + '_sub';
    sub.textContent = '\u00A0';
    card.appendChild(lbl); card.appendChild(val); card.appendChild(sub);
    kpiWrap.appendChild(card);
  });
  panel.appendChild(kpiWrap);
// Motivos de insucesso que NÃO contam contra o DS (não foram tentativas reais)
  var MOTIVOS_FORA_DO_DS = [
    'nao esta na agencia', 'não está na agência', 'nao estao na agencia',
    'não estão na agência', 'pacote nao esta na agencia', 'pacote não está na agência'
  ];

  function isInsucessoForaDoDS(motivo) {
    if (!motivo) return false;
    var norm = String(motivo).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return MOTIVOS_FORA_DO_DS.indexOf(norm) >= 0;
  }

  // Recalcula totais considerando que "Não está na agência" não conta no DS
  function getDSStats(routes) {
    var total = 0, delivered = 0, failed = 0, pnr = 0, foraDS = 0;
    routes.forEach(function (r) {
      total     += r.totalPkg  || 0;
      delivered += r.delivered || 0;
      pnr       += r.pnr       || 0;
      (r.failures || []).forEach(function (f) {
        if (isInsucessoForaDoDS(f.reason)) foraDS++;
        else failed++;
      });
      // fallback: se não tem r.failures detalhado, usa r.failed
      if (!r.failures || r.failures.length === 0) failed += r.failed || 0;
    });
    // Base do DS: descontando os que estão "fora do DS"
    var baseDS = total - foraDS;
    var dsPct = baseDS > 0 ? (delivered / baseDS) * 100 : 0;
    return {
      total: total, delivered: delivered, failed: failed,
      pnr: pnr, foraDS: foraDS, baseDS: baseDS, dsPct: dsPct
    };
  }

  function renderKPIs() {
    var all = STATE.routes || [];
    // Ignora rotas "A caminho do destino" (planned) em TUDO
    var r = all.filter(function (rt) { return rt.status !== 'A caminho do destino'; });
    var s = getDSStats(r);
    var total = s.total, delivered = s.delivered, failed = s.failed, pnr = s.pnr;
    var running = 0, finished = 0, aCaminho = 0;
    all.forEach(function (rt) {
      if (rt.status === 'Encerradas') finished++;
      else if (rt.status === 'Abertas') running++;
      else if (rt.status === 'A caminho do destino') aCaminho++;
    });
    function set(id, txt, sub, color, pulse) {
      var v = document.getElementById('mlm_srj3_kpi_' + id + '_val');
      var subEl = document.getElementById('mlm_srj3_kpi_' + id + '_sub');
      var c = document.getElementById('mlm_srj3_kpi_' + id);
      if (v) { v.textContent = txt; if (color) v.style.color = color; }
      if (subEl) subEl.textContent = sub || '\u00A0';
      if (c) c.classList.toggle('mlm_kpi_pulse', !!pulse);
    }
    set('total', fmt(total), r.length + ' rotas' + (s.foraDS > 0 ? ' · ' + s.foraDS + ' fora DS' : ''));
    var dsPct = s.dsPct;
    set('delivered', fmt(delivered), dsPct.toFixed(1) + '% DS',
        dsPct >= 95 ? T.ok : dsPct >= 90 ? T.warn : T.err);
    var insPct = s.baseDS > 0 ? (failed / s.baseDS) * 100 : 0;
    set('failed', fmt(failed), insPct.toFixed(1) + '%',
        insPct <= 3 ? T.ok : insPct <= 5 ? T.warn : T.err, insPct > 7);
    var pnrPct = total > 0 ? (pnr / total) * 100 : 0;
    set('pnr', fmt(pnr), pnrPct.toFixed(1) + '%',
        pnrPct <= 1 ? T.ok : pnrPct <= 3 ? T.warn : T.err, pnrPct > 5);
    set('running', fmt(running), 'de ' + r.length + (aCaminho > 0 ? ' · ' + aCaminho + ' a caminho' : ''), T.info);
    var finPct = r.length > 0 ? (finished / r.length) * 100 : 0;
    set('finished', fmt(finished), finPct.toFixed(0) + '%', finPct >= 80 ? T.ok : T.brand);
  }

  // ABAS
  var TABS = [
    { id: 'ROTAS',      label: 'Rotas' },
    { id: 'OFENSORAS',  label: 'Ofensoras' },
    { id: 'INSUCESSOS', label: 'Insucessos' },
    { id: 'MOTORISTAS', label: 'Motoristas' },
    { id: 'PNR',        label: 'PNR' },
    { id: 'AGENCIAS',   label: 'Agências' },
    { id: 'DEVOLUCOES', label: 'Devoluções' }
  ];
  var tabsBar = mk('div',
    'display:flex;gap:6px;padding:12px 18px 0 18px;background:rgba(15,23,42,.2);' +
    'flex-shrink:0;flex-wrap:wrap');
  TABS.forEach(function (tab) {
    var btn = mk('button',
      'background:' + T.surface + ';border:1px solid ' + T.border + ';color:' + T.mutedHi +
      ';padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:600;' +
      'transition:all .2s ease;text-transform:uppercase', escapeHTML(tab.label));
    btn.dataset.tab = tab.id;
    if (tab.id === STATE.tab) btn.classList.add('mlm_tab_active');
    btn.onclick = function () { switchTab(tab.id); };
    tabsBar.appendChild(btn);
  });
  panel.appendChild(tabsBar);

  // Container principal: filtros (fixos) + área de dados (atualizada por refresh)
  var content = mk('div',
    'flex:1;overflow-y:auto;background:rgba(10,14,26,.4);min-height:300px;' +
    'display:flex;flex-direction:column');
  panel.appendChild(content);

  // Barra de filtros — NUNCA é destruída no auto-refresh
  var filtersContainer = mk('div',
    'padding:16px 18px 0 18px;flex-shrink:0;position:sticky;top:0;' +
    'background:rgba(10,14,26,.95);backdrop-filter:blur(10px);z-index:10');
  content.appendChild(filtersContainer);

  // Área de dados — esta SIM é atualizada
  var dataArea = mk('div', 'padding:8px 18px 16px 18px;flex:1');
  content.appendChild(dataArea);

  var footer = mk('div',
    'padding:10px 18px;background:' + T.surface + ';border-top:1px solid ' + T.border +
    ';display:flex;align-items:center;gap:12px;font-size:11px;color:' + T.muted +
    ';flex-shrink:0;font-family:' + T.fMono);
  var footerCount = mk('span', '', '0 de 0 itens');
  footerCount.id = 'mlm_srj3_footer_count';
  footer.appendChild(footerCount);
  footer.appendChild(mk('span', 'flex:1'));
  footer.appendChild(mk('span', 'color:' + T.muted + ';font-size:10px',
    'Arraste o header para mover'));
  panel.appendChild(footer);

 function switchTab(tabId) {
    STATE.tab = tabId;
    Prefs.save();
    // Atualiza visual dos botões de aba
    $$('button[data-tab]', tabsBar).forEach(function (b) {
      if (b.dataset.tab === tabId) b.classList.add('mlm_tab_active');
      else b.classList.remove('mlm_tab_active');
    });
    // Fecha qualquer dropdown aberto
    document.querySelectorAll('[data-mlm-dropdown="1"]').forEach(function (d) {
      d.style.display = 'none';
    });
    STATE.ui.openDropdown = null;
    clearRefreshPending();
    // Re-renderiza filtros + dados da nova aba
    renderActiveTab();
  }

  // Render COMPLETO: usado quando troca de aba ou primeira vez
  function renderActiveTab() {
    if (STATE.loading && (!STATE.routes || STATE.routes.length === 0)) {
      filtersContainer.innerHTML = '';
      dataArea.innerHTML = '';
      renderSkeleton();
      return;
    }
    renderFiltersOnly();
    renderDataOnly();
  }

  // Render só dos filtros (raramente chamado, só ao trocar de aba)
  function renderFiltersOnly() {
    filtersContainer.innerHTML = '';
    filtersContainer.appendChild(renderGlobalFiltersBar());
  }

  // Render só dos dados — chamado pelo auto-refresh
  // NÃO MEXE NOS FILTROS, preserva dropdowns abertos
  function renderDataOnly() {
    // Salva scroll antes de redesenhar
    STATE.ui.contentScrollTop = content.scrollTop;
    dataArea.innerHTML = '';
    switch (STATE.tab) {
      case 'ROTAS':      renderRotas();      break;
      case 'OFENSORAS':  renderOfensoras();  break;
      case 'INSUCESSOS': renderInsucessos(); break;
      case 'MOTORISTAS': renderMotoristas(); break;
      case 'PNR':        renderPNR();        break;
      case 'AGENCIAS':   renderAgencias();   break;
      case 'DEVOLUCOES': renderDevolucoes(); break;
    }
    // Restaura scroll
    requestAnimationFrame(function () {
      content.scrollTop = STATE.ui.contentScrollTop;
    });
  }
  // Mostra banner discreto quando há dados novos mas dropdown está aberto
  function showRefreshPending() {
    var existing = document.getElementById('mlm_srj3_refresh_pending');
    if (existing) return;
    var banner = mk('div',
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
      'background:' + T.grad + ';color:#fff;padding:10px 18px;border-radius:24px;' +
      'box-shadow:' + T.shadow + ';font-size:12px;font-weight:600;cursor:pointer;' +
      'z-index:' + (T.z + 20) + ';display:flex;align-items:center;gap:8px;' +
      'animation:mlm_slideUp .25s ease-out;font-family:' + T.fUI,
      '<span>↻</span><span>Novos dados disponíveis · clique para atualizar</span>');
    banner.id = 'mlm_srj3_refresh_pending';
    banner.onclick = function () {
      // Fecha todos dropdowns e atualiza
      document.querySelectorAll('[data-mlm-dropdown="1"]').forEach(function (d) {
        d.style.display = 'none';
      });
      STATE.ui.openDropdown = null;
      banner.parentNode && banner.parentNode.removeChild(banner);
      renderDataOnly();
    };
    document.body.appendChild(banner);
  }

  function clearRefreshPending() {
    var b = document.getElementById('mlm_srj3_refresh_pending');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function renderSkeleton() {
    var grid = mk('div', 'display:flex;flex-direction:column;gap:8px');
    for (var i = 0; i < 6; i++) {
      var row = mk('div', 'display:flex;gap:8px');
      row.appendChild(mk('div', 'height:36px;width:140px',
        '<div class="mlm_skeleton" style="height:100%;width:100%"></div>'));
      row.appendChild(mk('div', 'height:36px;flex:1',
        '<div class="mlm_skeleton" style="height:100%;width:100%"></div>'));
      grid.appendChild(row);
    }
    dataArea.appendChild(grid);
  }

  function setFooterCount(shown, total) {
    var el = document.getElementById('mlm_srj3_footer_count');
    if (el) el.textContent = fmt(shown) + ' de ' + fmt(total) + ' itens';
  }
// ==========================================================================
  // FILTROS GLOBAIS
  // ==========================================================================
  var RANK_OPTIONS = [
    { id: 'none',           label: 'Padrão' },
    { id: 'ins_desc',       label: 'Mais insucessos' },
    { id: 'ins_asc',        label: 'Menos insucessos' },
    { id: 'pend_desc',      label: 'Mais pacotes pendentes' },
    { id: 'pend_asc',       label: 'Menos pacotes pendentes' },
    { id: 'prog_desc',      label: 'Maior progresso' },
    { id: 'prog_asc',       label: 'Menor progresso' },
    { id: 'carrier_az',     label: 'Transportadora A-Z' },
    { id: 'comercial_desc', label: 'Mais comerciais' }
  ];

  function applyGlobalFilters(routes) {
    var g = STATE.globalFilters;
    var out = routes.filter(function (r) {
      if (g.status.size  > 0 && !g.status.has(r.status))             return false;
      if (g.tipo.size    > 0 && !g.tipo.has(r.tipo || r.routeType))  return false;
      if (g.modal.size   > 0 && !g.modal.has(r.modal || r.vehicle))  return false;
      if (g.carrier.size > 0 && !g.carrier.has(r.carrier))           return false;
      if (g.driver.size  > 0 && !g.driver.has(r.driver))             return false;
      if (g.ciclo.size   > 0 && !g.ciclo.has(String(r.ciclo || r.cycle || ''))) return false;
      if (g.origem.size  > 0 && !g.origem.has(r.origem || r.origin)) return false;
      if (g.placa && String(r.placa || r.plate || '').toLowerCase().indexOf(g.placa.toLowerCase()) < 0) return false;
      return true;
    });

    var progresso = function (r) {
      var t = r.totalPkg || 0;
      if (!t) return 0;
      return ((r.delivered || 0) / t) * 100;
    };
    var pendentes = function (r) {
      return (r.totalPkg || 0) - (r.delivered || 0) - (r.failed || 0);
    };

    switch (g.rank) {
      case 'ins_desc':       out.sort(function (a, b) { return (b.failed || 0) - (a.failed || 0); }); break;
      case 'ins_asc':        out.sort(function (a, b) { return (a.failed || 0) - (b.failed || 0); }); break;
      case 'pend_desc':      out.sort(function (a, b) { return pendentes(b) - pendentes(a); }); break;
      case 'pend_asc':       out.sort(function (a, b) { return pendentes(a) - pendentes(b); }); break;
      case 'prog_desc':      out.sort(function (a, b) { return progresso(b) - progresso(a); }); break;
      case 'prog_asc':       out.sort(function (a, b) { return progresso(a) - progresso(b); }); break;
      case 'carrier_az':     out.sort(function (a, b) { return String(a.carrier || '').localeCompare(String(b.carrier || '')); }); break;
      case 'comercial_desc': out.sort(function (a, b) { return (b.comerciais || 0) - (a.comerciais || 0); }); break;
    }
    return out;
  }
// Atualiza conteúdo mantendo o dropdown atual aberto
  function refreshActiveTabKeepDropdown(activeKey) {
    renderKPIs();
    // Re-renderiza filtros (pra atualizar contagem nos botões) E dados
    renderFiltersOnly();
    renderDataOnly();
    // Reabre o dropdown que estava ativo
    setTimeout(function () {
      var btns = filtersContainer.querySelectorAll('[data-mlm-filter-key="' + activeKey + '"]');
      if (btns.length > 0) {
        btns[0].click();
        STATE.ui.openDropdown = activeKey;
      }
    }, 0);
  }

  function renderGlobalFiltersBar() {
    var routes = STATE.routes || [];
    var g = STATE.globalFilters;

    function uniq(getter) {
      var s = {};
      routes.forEach(function (r) { var v = getter(r); if (v) s[v] = true; });
      return Object.keys(s).sort();
    }

    var wrap = mk('div',
      'background:rgba(15,23,42,.5);border:1px solid ' + T.border +
      ';border-radius:10px;padding:10px 12px;margin-bottom:12px;' +
      'display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end');
    wrap.dataset.mlmFiltersbar = '1';

    function multiSel(label, key, opts) {
      var box = mk('div', 'display:flex;flex-direction:column;gap:3px;min-width:140px;position:relative');
      box.appendChild(mk('label',
        'font-size:9px;color:' + T.muted + ';font-weight:600;text-transform:uppercase;letter-spacing:.5px',
        escapeHTML(label)));

      var count = g[key].size;
      var btnLabel = count === 0
        ? 'Todos'
        : count === 1
          ? Array.from(g[key])[0]
          : count + ' selecionados';

      var btn = mk('button',
        'background:' + T.surface + ';border:1px solid ' + (count > 0 ? T.brand : T.border) +
        ';color:' + (count > 0 ? T.textHi : T.mutedHi) +
        ';padding:6px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:' + T.fUI +
        ';display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:30px',
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px">' +
        escapeHTML(btnLabel) + '</span>' +
        '<span style="opacity:.6;display:inline-flex">' + ICON.chevD + '</span>');

      var dropdown = mk('div',
        'position:absolute;top:100%;left:0;margin-top:4px;min-width:200px;max-width:280px;' +
        'max-height:280px;overflow-y:auto;background:' + T.surfaceHi +
        ';border:1px solid ' + T.borderHi + ';border-radius:8px;box-shadow:' + T.shadow +
        ';z-index:' + (T.z + 30) + ';padding:6px;display:none;backdrop-filter:blur(20px)');

      // Campo de busca interno
      if (opts.length > 8) {
        var search = mk('input',
          'width:100%;background:' + T.surface + ';border:1px solid ' + T.border +
          ';color:' + T.textHi + ';padding:5px 8px;border-radius:5px;font-size:11px;' +
          'margin-bottom:6px;font-family:' + T.fUI);
        search.type = 'text';
        search.placeholder = 'Buscar...';
        search.oninput = function () {
          var q = search.value.toLowerCase();
          listWrap.querySelectorAll('[data-opt]').forEach(function (it) {
            it.style.display = it.dataset.opt.toLowerCase().indexOf(q) >= 0 ? 'flex' : 'none';
          });
        };
        dropdown.appendChild(search);
      }

      var listWrap = mk('div', 'display:flex;flex-direction:column;gap:1px');
      dropdown.appendChild(listWrap);

      if (opts.length === 0) {
        listWrap.appendChild(mk('div',
          'padding:8px;color:' + T.muted + ';font-size:11px;font-style:italic;text-align:center',
          'Sem opções'));
      }

      opts.forEach(function (o) {
        var item = mk('label',
          'display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:5px;cursor:pointer;' +
          'font-size:11px;color:' + T.mutedHi + ';transition:background .1s ease;user-select:none');
        item.dataset.opt = String(o);
        item.onmouseenter = function () { item.style.background = 'rgba(124,58,237,.12)'; };
        item.onmouseleave = function () { item.style.background = 'transparent'; };
        var cb = mk('input', 'accent-color:' + T.brand + ';cursor:pointer;width:13px;height:13px');
        cb.type = 'checkbox';
        cb.checked = g[key].has(o);
        cb.onchange = function (ev) {
          ev.stopPropagation();
          if (cb.checked) g[key].add(o); else g[key].delete(o);
          // Atualiza só o conteúdo, mantém o dropdown aberto
          refreshActiveTabKeepDropdown(key);
        };
        var txt = mk('span',
          'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
          escapeHTML(String(o)));
        item.appendChild(cb);
        item.appendChild(txt);
        listWrap.appendChild(item);
      });

      // Botões "Marcar todos" / "Limpar" no rodapé
      if (opts.length > 1) {
        var footer = mk('div',
          'display:flex;gap:4px;margin-top:6px;padding-top:6px;border-top:1px solid ' + T.border);
        var bAll = mk('button',
          'flex:1;background:transparent;border:1px solid ' + T.border + ';color:' + T.mutedHi +
          ';padding:4px;border-radius:5px;font-size:10px;cursor:pointer', 'Todos');
        bAll.onclick = function (e) {
          e.stopPropagation();
          opts.forEach(function (o) { g[key].add(o); });
          refreshActiveTabKeepDropdown(key);
        };
        var bNone = mk('button',
          'flex:1;background:transparent;border:1px solid ' + T.border + ';color:' + T.mutedHi +
          ';padding:4px;border-radius:5px;font-size:10px;cursor:pointer', 'Limpar');
        bNone.onclick = function (e) {
          e.stopPropagation();
          g[key].clear();
          refreshActiveTabKeepDropdown(key);
        };
        footer.appendChild(bAll);
        footer.appendChild(bNone);
        dropdown.appendChild(footer);
      }

      btn.dataset.mlmFilterKey = key;
      btn.onclick = function (e) {
        e.stopPropagation();
        // Fecha outros dropdowns abertos
        document.querySelectorAll('[data-mlm-dropdown="1"]').forEach(function (d) {
          if (d !== dropdown) d.style.display = 'none';
        });
        var willOpen = dropdown.style.display !== 'block';
        dropdown.style.display = willOpen ? 'block' : 'none';
        STATE.ui.openDropdown = willOpen ? key : null;
        // Se fechou o dropdown e tem dados pendentes, atualiza
        if (!willOpen) {
          var pending = document.getElementById('mlm_srj3_refresh_pending');
          if (pending) {
            clearRefreshPending();
            renderDataOnly();
          }
        }
      };
      dropdown.dataset.mlmDropdown = '1';

      box.appendChild(btn);
      box.appendChild(dropdown);
      return box;
    }

    function txtInput(label, key, type) {
      var box = mk('div', 'display:flex;flex-direction:column;gap:3px;min-width:110px');
      box.appendChild(mk('label',
        'font-size:9px;color:' + T.muted + ';font-weight:600;text-transform:uppercase;letter-spacing:.5px',
        escapeHTML(label)));
      var inp = mk('input',
        'background:' + T.surface + ';border:1px solid ' + T.border + ';color:' + T.textHi +
        ';padding:5px 8px;border-radius:6px;font-size:11px;font-family:' + T.fMono +
        (type === 'date' ? ';color-scheme:dark' : ''));
      inp.type = type || 'text';
      inp.value = g[key] || '';
      if (type !== 'date') inp.placeholder = '...';
      inp.oninput = function () { g[key] = inp.value; renderActiveTab(); };
      inp.onchange = function () { g[key] = inp.value; renderActiveTab(); };
      box.appendChild(inp);
      return box;
    }

    function rankSel() {
      var box = mk('div', 'display:flex;flex-direction:column;gap:3px;min-width:170px');
      box.appendChild(mk('label',
        'font-size:9px;color:' + T.muted + ';font-weight:600;text-transform:uppercase;letter-spacing:.5px',
        'Ranquear por'));
      var sel = mk('select',
        'background:' + T.surface + ';border:1px solid ' + T.border + ';color:' + T.textHi +
        ';padding:5px 8px;border-radius:6px;font-size:11px;font-family:' + T.fUI);
      RANK_OPTIONS.forEach(function (o) {
        var op = mk('option', '', escapeHTML(o.label));
        op.value = o.id;
        if (g.rank === o.id) op.selected = true;
        sel.appendChild(op);
      });
      sel.onchange = function () { g.rank = sel.value; renderActiveTab(); };
      box.appendChild(sel);
      return box;
    }

    wrap.appendChild(multiSel('Status',         'status',  ['Abertas', 'Encerradas', 'A caminho do destino']));
    wrap.appendChild(multiSel('Tipo de rota',   'tipo',    ['Entrega', 'Mista', 'Coleta']));
    wrap.appendChild(multiSel('Modal',          'modal',   uniq(function (r) { return r.modal || r.vehicle; })));
    wrap.appendChild(multiSel('Transportadora', 'carrier', uniq(function (r) { return r.carrier; })));
    wrap.appendChild(multiSel('Motorista',      'driver',  uniq(function (r) { return r.driver; })));
    wrap.appendChild(multiSel('Ciclo',          'ciclo',   ['CHP', 'AM1', 'PM1', 'SD']));
    wrap.appendChild(multiSel('Origem',         'origem',  uniq(function (r) { return r.origem || r.origin; })));
    wrap.appendChild(txtInput('Placa',          'placa'));
    wrap.appendChild(rankSel());

    var btnClear = mk('button', '', '<span>Limpar</span>');
    btnClear.className = 'mlm_btn mlm_btn_err';
    btnClear.style.alignSelf = 'flex-end';
    btnClear.onclick = function () {
      g.status.clear(); g.tipo.clear(); g.modal.clear(); g.carrier.clear();
      g.driver.clear(); g.ciclo.clear(); g.origem.clear();
      g.placa = ''; g.rank = 'none';
      renderActiveTab();
    };
    wrap.appendChild(btnClear);

    return wrap;
  }
  // HELPERS DE RENDER
  function chipFilter(opts) {
    var wrap = mk('div', 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px');
    if (opts.label) {
      wrap.appendChild(mk('span',
        'font-size:10px;color:' + T.muted + ';font-weight:600;margin-right:4px',
        escapeHTML(opts.label.toUpperCase())));
    }
    opts.values.forEach(function (v) {
      var on = opts.selectedSet.has(v);
      var chip = mk('button',
        'background:' + T.surface + ';border:1px solid ' + T.border + ';color:' + T.mutedHi +
        ';padding:4px 10px;border-radius:14px;cursor:pointer;font-size:11px;font-weight:500',
        escapeHTML(String(v)));
      if (on) chip.classList.add('mlm_chip_on');
      chip.onclick = function () {
        if (opts.selectedSet.has(v)) opts.selectedSet.delete(v);
        else opts.selectedSet.add(v);
        if (opts.onChange) opts.onChange();
      };
      wrap.appendChild(chip);
    });
    if (opts.selectedSet.size > 0) {
      var clear = mk('button',
        'background:transparent;border:1px solid ' + T.err + ';color:' + T.err +
        ';padding:4px 10px;border-radius:14px;cursor:pointer;font-size:11px', 'Limpar');
      clear.onclick = function () { opts.selectedSet.clear(); if (opts.onChange) opts.onChange(); };
      wrap.appendChild(clear);
    }
    return wrap;
  }

  function exportBar(tabId, getData, columns, title) {
    var wrap = mk('div',
      'display:flex;gap:8px;justify-content:flex-end;margin-bottom:10px;flex-wrap:wrap');
    var bCSV = mk('button', '', ICON.download + '<span>CSV</span>');
    bCSV.className = 'mlm_btn';
    var bXLS = mk('button', '', ICON.file + '<span>Excel</span>');
    bXLS.className = 'mlm_btn mlm_btn_ok';
    var bPDF = mk('button', '', ICON.print + '<span>PDF</span>');
    bPDF.className = 'mlm_btn mlm_btn_warn';
    bCSV.onclick = function () { csvExport(getData(), columns, tabId + '_' + STATE.date); };
    bXLS.onclick = function () { xlsxExport(getData(), columns, tabId + '_' + STATE.date, title); };
    bPDF.onclick = function () { pdfExport(getData(), columns, title); };
    wrap.appendChild(bCSV); wrap.appendChild(bXLS); wrap.appendChild(bPDF);
    return wrap;
  }

  function toggleBlock(id, label, contentRender) {
    var isOpen = !!STATE.expanded[id];
    var wrap = mk('div', 'margin-top:8px');
    var btn = mk('button',
      'background:rgba(15,23,42,.5);border:1px solid ' + T.border + ';color:' + T.mutedHi +
      ';padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:500;' +
      'display:inline-flex;align-items:center;gap:6px',
      '<span style="display:inline-flex">' + (isOpen ? ICON.chevD : ICON.chevR) + '</span>' +
      '<span>' + escapeHTML(label) + '</span>');
    var box = mk('div',
      'margin-top:6px;padding:10px 12px;background:rgba(15,23,42,.5);' +
      'border:1px solid ' + T.border + ';border-radius:6px;font-family:' + T.fMono +
      ';font-size:11px;color:' + T.mutedHi + ';line-height:1.6;word-break:break-all;' +
      'max-height:240px;overflow-y:auto;display:' + (isOpen ? 'block' : 'none'));
    box.appendChild(contentRender());
    btn.onclick = function () {
      var open = !STATE.expanded[id];
      STATE.expanded[id] = open;
      box.style.display = open ? 'block' : 'none';
      btn.firstChild.innerHTML = open ? ICON.chevD : ICON.chevR;
    };
    wrap.appendChild(btn); wrap.appendChild(box);
    return wrap;
  }

  function table(rows, columns) {
    var tbl = mk('table',
      'width:100%;border-collapse:separate;border-spacing:0;font-size:12px;' +
      'background:' + T.surface + ';border-radius:8px;overflow:hidden;border:1px solid ' + T.border);
    var thead = mk('thead'); var tr = mk('tr');
    columns.forEach(function (c) {
      var th = mk('th',
        'padding:10px 12px;text-align:left;font-size:10px;color:' + T.muted +
        ';font-weight:600;text-transform:uppercase;background:rgba(15,23,42,.6);' +
        'border-bottom:1px solid ' + T.border + (c.width ? ';width:' + c.width : ''),
        escapeHTML(c.label));
      tr.appendChild(th);
    });
    thead.appendChild(tr); tbl.appendChild(thead);
    var tbody = mk('tbody');
    if (!rows || rows.length === 0) {
      var trE = mk('tr');
      var tdE = mk('td',
        'padding:24px;text-align:center;color:' + T.muted + ';font-style:italic',
        'Nenhum item para exibir');
      tdE.colSpan = columns.length;
      trE.appendChild(tdE); tbody.appendChild(trE);
    } else {
      rows.forEach(function (row) {
        var rTr = mk('tr');
        columns.forEach(function (c) {
          var raw = row[c.key];
          var v = c.format ? c.format(raw, row) : (raw == null ? '—' : raw);
          var color = c.color ? c.color(raw, row) : null;
          var td = mk('td',
            'padding:10px 12px;color:' + (color || T.text) + ';font-size:12px;' +
            'border-bottom:1px solid ' + T.border + (c.mono ? ';font-family:' + T.fMono : ''),
            String(v));
          rTr.appendChild(td);
        });
        tbody.appendChild(rTr);
      });
    }
    tbl.appendChild(tbody);
    return tbl;
  }
// ==========================================================================
  // RENDER ROTAS (todas as rotas com filtros aplicados)
  // ==========================================================================
  function renderRotas() {
    var routes = applyGlobalFilters(STATE.routes || []);
    var totalRoutes = (STATE.routes || []).length;

    // === Mini resumo no topo ===
    var stats = getDSStats(routes);
    var summaryBar = mk('div',
      'display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px');
    function miniStat(label, val, color) {
      var c = mk('div',
        'background:' + T.surface + ';border:1px solid ' + T.border +
        ';border-left:3px solid ' + color + ';border-radius:8px;padding:8px 10px');
      c.appendChild(mk('div',
        'font-size:9px;color:' + T.muted + ';font-weight:600;text-transform:uppercase',
        escapeHTML(label)));
      c.appendChild(mk('div',
        'font-size:15px;font-weight:700;color:' + T.textHi + ';font-family:' + T.fMono +
        ';margin-top:3px', String(val)));
      return c;
    }
    summaryBar.appendChild(miniStat('Rotas filtradas', routes.length + '/' + totalRoutes, T.brand2));
    summaryBar.appendChild(miniStat('Pacotes', fmt(stats.total), T.info));
    summaryBar.appendChild(miniStat('Entregues', fmt(stats.delivered), T.ok));
    summaryBar.appendChild(miniStat('DS%', stats.dsPct.toFixed(1) + '%',
      stats.dsPct >= 95 ? T.ok : stats.dsPct >= 90 ? T.warn : T.err));
    summaryBar.appendChild(miniStat('Pendentes',
      fmt(Math.max(0, stats.total - stats.delivered - stats.failed - stats.foraDS)), T.warn));
    dataArea.appendChild(summaryBar);

    // === Export bar ===
    dataArea.appendChild(exportBar('ROTAS',
      function () {
        return routes.map(function (r) {
          var pendentes = Math.max(0, (r.totalPkg || 0) - (r.delivered || 0) - (r.failed || 0));
          var prog = r.totalPkg > 0 ? ((r.delivered || 0) / r.totalPkg * 100).toFixed(1) + '%' : '0%';
          return {
            rota: r.routeId, motorista: r.driver, placa: r.placa || r.plate || '',
            carrier: r.carrier, ciclo: r.ciclo || r.cycle || '', tipo: r.tipo || r.routeType || '',
            modal: r.modal || r.vehicle || '', origem: r.origem || r.origin || '',
            status: r.status, total: r.totalPkg, entregues: r.delivered,
            pendentes: pendentes, insucessos: r.failed, pnr: r.pnr, progresso: prog
          };
        });
      },
      [
        { key: 'rota', label: 'Rota' }, { key: 'motorista', label: 'Motorista' },
        { key: 'placa', label: 'Placa' }, { key: 'carrier', label: 'Transp.' },
        { key: 'ciclo', label: 'Ciclo' }, { key: 'tipo', label: 'Tipo' },
        { key: 'modal', label: 'Modal' }, { key: 'origem', label: 'Origem' },
        { key: 'status', label: 'Status' }, { key: 'total', label: 'Total' },
        { key: 'entregues', label: 'Entreg.' }, { key: 'pendentes', label: 'Pend.' },
        { key: 'insucessos', label: 'Insuc.' }, { key: 'pnr', label: 'PNR' },
        { key: 'progresso', label: 'Progresso' }
      ], 'Rotas — ' + STATE.ssc + ' — ' + STATE.date));

    // === Estado vazio ===
    if (routes.length === 0) {
      dataArea.appendChild(mk('div',
        'text-align:center;padding:40px;color:' + T.muted + ';font-style:italic',
        'Nenhuma rota encontrada com os filtros aplicados.'));
      setFooterCount(0, totalRoutes);
      return;
    }

    // === Cards de rotas ===
    var grid = mk('div', 'display:flex;flex-direction:column;gap:8px');
    routes.forEach(function (r) {
      var pendentes = Math.max(0, (r.totalPkg || 0) - (r.delivered || 0) - (r.failed || 0));
      var prog = r.totalPkg > 0 ? ((r.delivered || 0) / r.totalPkg) * 100 : 0;
      var statusColor =
        (r.status === 'FINISHED' || r.status === 'FINALIZADA') ? T.ok :
        (r.status === 'IN_PROGRESS' || r.status === 'RUNNING') ? T.info : T.muted;

      var card = mk('div',
        'background:' + T.surface + ';border:1px solid ' + T.border +
        ';border-left:3px solid ' + statusColor + ';border-radius:10px;padding:12px 14px');

      // Linha 1 — Rota + tags
      var line1 = mk('div', 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px');
      line1.appendChild(mk('div',
        'font-family:' + T.fMono + ';font-size:13px;font-weight:700;color:' + T.textHi,
        escapeHTML(r.routeId || '—')));
      if (r.ciclo || r.cycle) {
        line1.appendChild(mk('span',
          'background:rgba(6,182,212,.15);color:' + T.brand2 + ';font-size:10px;font-weight:700;' +
          'padding:2px 8px;border-radius:6px;font-family:' + T.fMono,
          escapeHTML(r.ciclo || r.cycle)));
      }
      if (r.tipo || r.routeType) {
        line1.appendChild(mk('span',
          'background:rgba(124,58,237,.15);color:' + T.brand + ';font-size:10px;font-weight:700;' +
          'padding:2px 8px;border-radius:6px',
          escapeHTML(r.tipo || r.routeType)));
      }
      if (r.modal || r.vehicle) {
        line1.appendChild(mk('span',
          'background:rgba(148,163,184,.1);color:' + T.mutedHi + ';font-size:10px;font-weight:600;' +
          'padding:2px 8px;border-radius:6px',
          escapeHTML(r.modal || r.vehicle)));
      }
      line1.appendChild(mk('span',
        'color:' + statusColor + ';font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;' +
        'background:' + (statusColor === T.ok ? 'rgba(16,185,129,.15)' :
                          statusColor === T.info ? 'rgba(6,182,212,.15)' : 'rgba(148,163,184,.15)'),
        escapeHTML(r.status || '—')));
      line1.appendChild(mk('span',
        'font-size:10px;color:' + T.muted + ';margin-left:auto;font-family:' + T.fMono,
        escapeHTML(r.carrier || '') + (r.origem || r.origin ? ' · ' + escapeHTML(r.origem || r.origin) : '')));
      card.appendChild(line1);

      // Linha 2 — Motorista + placa
      var line2 = mk('div', 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px');
      line2.appendChild(mk('div',
        'font-size:12px;color:' + T.mutedHi,
        '👤 ' + escapeHTML(r.driver || 'Sem motorista')));
      if (r.placa || r.plate) {
        line2.appendChild(mk('span',
          'background:rgba(6,182,212,.15);color:' + T.brand2 + ';font-size:11px;font-weight:700;' +
          'padding:2px 8px;border-radius:6px;font-family:' + T.fMono,
          escapeHTML(r.placa || r.plate)));
      }
      card.appendChild(line2);

      // Linha 3 — Stats
      var stats = mk('div', 'display:flex;gap:14px;font-size:11px;flex-wrap:wrap;margin-bottom:8px');
      function stat(lbl, val, color) {
        return mk('div', '',
          '<span style="color:' + T.muted + '">' + escapeHTML(lbl) + ':</span> ' +
          '<span style="color:' + color + ';font-family:' + T.fMono + ';font-weight:600">' +
          escapeHTML(String(val)) + '</span>');
      }
      stats.appendChild(stat('Total', fmt(r.totalPkg || 0), T.text));
      stats.appendChild(stat('Entregues', fmt(r.delivered || 0), T.ok));
      stats.appendChild(stat('Pendentes', fmt(pendentes), T.warn));
      stats.appendChild(stat('Insucessos', fmt(r.failed || 0), T.err));
      stats.appendChild(stat('PNR', fmt(r.pnr || 0), T.warn));
      card.appendChild(stats);

      // Barra de progresso
      var progWrap = mk('div',
        'background:rgba(15,23,42,.6);border-radius:6px;height:6px;overflow:hidden;position:relative');
      var progBar = mk('div',
        'height:100%;width:' + prog.toFixed(1) + '%;background:' +
        (prog >= 95 ? T.ok : prog >= 70 ? T.brand2 : prog >= 40 ? T.warn : T.err) +
        ';transition:width .3s ease');
      progWrap.appendChild(progBar);
      var progLbl = mk('div',
        'font-size:10px;color:' + T.muted + ';font-family:' + T.fMono +
        ';margin-top:3px;text-align:right',
        'Progresso: ' + prog.toFixed(1) + '%');
      card.appendChild(progWrap);
      card.appendChild(progLbl);

      grid.appendChild(card);
    });
    dataArea.appendChild(grid);
    setFooterCount(routes.length, totalRoutes);
  }
  
  // ==========================================================================
  // RENDER OFENSORAS
  // ==========================================================================
  function renderOfensoras() {
    var allRoutes = applyGlobalFilters(STATE.routes || []);
    var ofensoras = allRoutes.filter(function (r) {
      return (r.failed || 0) > 0 || (r.pnr || 0) > 0;
    });
    ofensoras.sort(function (a, b) {
      return ((b.failed || 0) + (b.pnr || 0)) - ((a.failed || 0) + (a.pnr || 0));
    });
    var f = STATE.filters.OFENSORAS;
    var carriers = [], clusters = [];
    ofensoras.forEach(function (r) {
      if (r.carrier && carriers.indexOf(r.carrier) < 0) carriers.push(r.carrier);
      if (r.cluster && clusters.indexOf(r.cluster) < 0) clusters.push(r.cluster);
    });
    carriers.sort(); clusters.sort();
    var filtered = ofensoras.filter(function (r) {
      if (f.carrier.size > 0 && !f.carrier.has(r.carrier)) return false;
      if (f.cluster.size > 0 && !f.cluster.has(r.cluster)) return false;
      return true;
    });

    // ====== TOP 5 MOTIVOS DE OFENSA ======
    var motivosCount = {};
    filtered.forEach(function (r) {
      (r.failures || []).forEach(function (pk) {
        var m = pk.reason || 'Sem motivo';
        motivosCount[m] = (motivosCount[m] || 0) + 1;
      });
      (r.pnrList || []).forEach(function (pk) {
        var m = 'PNR: ' + (pk.reason || 'Não retirado');
        motivosCount[m] = (motivosCount[m] || 0) + 1;
      });
    });
    var motivosArr = Object.keys(motivosCount).map(function (k) {
      return { motivo: k, qtd: motivosCount[k] };
    }).sort(function (a, b) { return b.qtd - a.qtd; });
    var top5 = motivosArr.slice(0, 5);
    var totalMotivos = motivosArr.reduce(function (s, m) { return s + m.qtd; }, 0) || 1;

    dataArea.appendChild(mk('div',
      'font-size:13px;font-weight:600;color:' + T.textHi + ';margin-bottom:10px',
      'Rotas Ofensoras <span style="color:' + T.muted + ';font-size:11px">(' +
      filtered.length + ' de ' + ofensoras.length + ')</span>'));

    // === TABELA TOP 5 ===
    if (top5.length > 0) {
      var topCard = mk('div',
        'background:' + T.surface + ';border:1px solid ' + T.border +
        ';border-left:3px solid ' + T.err + ';border-radius:10px;padding:12px 14px;margin-bottom:14px');
      topCard.appendChild(mk('div',
        'font-size:12px;font-weight:600;color:' + T.textHi + ';margin-bottom:8px',
        '🔥 TOP 5 Motivos de Ofensa'));
      var topTbl = mk('table',
        'width:100%;border-collapse:separate;border-spacing:0;font-size:12px');
      var thead = mk('thead'); var trh = mk('tr');
      ['#', 'Motivo', 'Qtd', '%'].forEach(function (h) {
        trh.appendChild(mk('th',
          'padding:8px 10px;text-align:left;font-size:10px;color:' + T.muted +
          ';font-weight:600;text-transform:uppercase;border-bottom:1px solid ' + T.border, h));
      });
      thead.appendChild(trh); topTbl.appendChild(thead);
      var tbody = mk('tbody');
      top5.forEach(function (m, i) {
        var tr = mk('tr');
        var color = i === 0 ? T.err : i === 1 ? T.warn : T.mutedHi;
        tr.appendChild(mk('td',
          'padding:8px 10px;color:' + color + ';font-family:' + T.fMono +
          ';font-weight:700;border-bottom:1px solid ' + T.border, '#' + (i + 1)));
        tr.appendChild(mk('td',
          'padding:8px 10px;color:' + T.textHi + ';border-bottom:1px solid ' + T.border,
          escapeHTML(m.motivo)));
        tr.appendChild(mk('td',
          'padding:8px 10px;color:' + T.err + ';font-family:' + T.fMono +
          ';font-weight:600;border-bottom:1px solid ' + T.border, fmt(m.qtd)));
        tr.appendChild(mk('td',
          'padding:8px 10px;color:' + T.mutedHi + ';font-family:' + T.fMono +
          ';border-bottom:1px solid ' + T.border,
          ((m.qtd / totalMotivos) * 100).toFixed(1) + '%'));
        tbody.appendChild(tr);
      });
      topTbl.appendChild(tbody);
      topCard.appendChild(topTbl);
      dataArea.appendChild(topCard);
    }

    // === FILTROS LOCAIS DA ABA ===
    if (carriers.length > 0) dataArea.appendChild(chipFilter({
      label: 'Carrier', values: carriers, selectedSet: f.carrier,
      onChange: function () { renderActiveTab(); }
    }));
    if (clusters.length > 0) dataArea.appendChild(chipFilter({
      label: 'Cluster', values: clusters, selectedSet: f.cluster,
      onChange: function () { renderActiveTab(); }
    }));

    dataArea.appendChild(exportBar('OFENSORAS',
      function () {
        return filtered.map(function (r) {
          return {
            rota: r.routeId, motorista: r.driver, carrier: r.carrier,
            cluster: r.cluster, total: r.totalPkg, entregues: r.delivered,
            insucessos: r.failed, pnr: r.pnr, status: r.status
          };
        });
      },
      [
        { key: 'rota', label: 'Rota' }, { key: 'motorista', label: 'Motorista' },
        { key: 'carrier', label: 'Carrier' }, { key: 'cluster', label: 'Cluster' },
        { key: 'total', label: 'Total' }, { key: 'entregues', label: 'Entregues' },
        { key: 'insucessos', label: 'Insucessos' }, { key: 'pnr', label: 'PNR' },
        { key: 'status', label: 'Status' }
      ], 'Rotas Ofensoras — ' + STATE.ssc + ' — ' + STATE.date));

    // === RANKING DE OFENSORES ===
    dataArea.appendChild(mk('div',
      'font-size:12px;font-weight:600;color:' + T.textHi + ';margin:14px 0 8px 0',
      '📊 Ranking de Ofensores (' + filtered.length + ')'));

    var grid = mk('div', 'display:flex;flex-direction:column;gap:10px');
    filtered.forEach(function (r, idx) {
      var card = mk('div',
        'background:' + T.surface + ';border:1px solid ' + T.border + ';border-radius:10px;' +
        'padding:12px 14px;border-left:3px solid ' +
        ((r.failed || 0) > 5 ? T.err : (r.failed || 0) > 2 ? T.warn : T.info));
      var top = mk('div', 'display:flex;align-items:center;gap:12px;flex-wrap:wrap');
      top.appendChild(mk('span',
        'background:' + T.gradSoft + ';color:' + T.textHi + ';font-size:11px;font-weight:700;' +
        'padding:2px 8px;border-radius:8px;font-family:' + T.fMono, '#' + (idx + 1)));
      top.appendChild(mk('div',
        'font-family:' + T.fMono + ';font-size:13px;font-weight:600;color:' + T.textHi,
        escapeHTML(r.routeId || '—')));
      top.appendChild(mk('div', 'font-size:12px;color:' + T.mutedHi,
        escapeHTML(r.driver || 'Sem motorista')));
      top.appendChild(mk('div',
        'font-size:10px;color:' + T.muted + ';margin-left:auto;font-family:' + T.fMono,
        escapeHTML(r.carrier || '') + (r.cluster ? ' · ' + escapeHTML(r.cluster) : '')));
      var stats = mk('div', 'display:flex;gap:14px;margin-top:8px;font-size:11px;flex-wrap:wrap');
      function stat(lbl, val, color) {
        return mk('div', '',
          '<span style="color:' + T.muted + '">' + escapeHTML(lbl) + ':</span> ' +
          '<span style="color:' + color + ';font-family:' + T.fMono + ';font-weight:600">' +
          escapeHTML(String(val)) + '</span>');
      }
      stats.appendChild(stat('Total', fmt(r.totalPkg || 0), T.text));
      stats.appendChild(stat('Entregues', fmt(r.delivered || 0), T.ok));
      stats.appendChild(stat('Insucessos', fmt(r.failed || 0), T.err));
      stats.appendChild(stat('PNR', fmt(r.pnr || 0), T.warn));
      stats.appendChild(stat('Status', r.status || '—', T.info));
      card.appendChild(top); card.appendChild(stats);
      var problemIds = (r.failedIds || []).concat(r.pnrIds || []);
      if (problemIds.length > 0) {
        card.appendChild(toggleBlock('ofens_' + r.routeId,
          'Ver ' + problemIds.length + ' pacotes problemáticos',
          function () { var d = mk('div'); d.textContent = problemIds.join(', '); return d; }));
      }
      grid.appendChild(card);
    });
    dataArea.appendChild(grid);
    setFooterCount(filtered.length, ofensoras.length);
  }

  // ==========================================================================
  // RENDER INSUCESSOS
  // ==========================================================================
  function renderInsucessos() {
    var allRoutes = applyGlobalFilters(STATE.routes || [])
      .filter(function (r) { return r.status !== 'A caminho do destino'; });
    var routes = allRoutes.filter(function (r) { return (r.failed || 0) > 0; });
    routes.sort(function (a, b) { return (b.failed || 0) - (a.failed || 0); });

    var totalInsucessos = 0;
    routes.forEach(function (r) { totalInsucessos += r.failed || 0; });

    dataArea.appendChild(mk('div',
      'font-size:13px;font-weight:600;color:' + T.textHi + ';margin-bottom:10px',
      'Insucessos <span style="color:' + T.muted + ';font-size:11px">(' +
      fmt(totalInsucessos) + ' pacotes em ' + routes.length + ' rotas)</span>'));

    if (routes.length === 0) {
      dataArea.appendChild(mk('div',
        'text-align:center;padding:40px;color:' + T.muted + ';font-style:italic',
        'Nenhum insucesso registrado com os filtros aplicados.'));
      setFooterCount(0, 0);
      return;
    }

    // === TOP 10 ROTAS COM MAIS INSUCESSOS ===
    var top10 = routes.slice(0, 10);
    var topCard = mk('div',
      'background:' + T.surface + ';border:1px solid ' + T.border +
      ';border-left:3px solid ' + T.err + ';border-radius:10px;padding:12px 14px;margin-bottom:14px');
    topCard.appendChild(mk('div',
      'font-size:12px;font-weight:600;color:' + T.textHi + ';margin-bottom:8px',
      '🔥 TOP 10 Rotas com Mais Insucessos'));

    var tbl = mk('table',
      'width:100%;border-collapse:separate;border-spacing:0;font-size:12px');
    var thead = mk('thead'); var trh = mk('tr');
    ['#', 'Rota', 'Motorista', 'Carrier', 'Insucessos', '% do Total'].forEach(function (h) {
      trh.appendChild(mk('th',
        'padding:8px 10px;text-align:left;font-size:10px;color:' + T.muted +
        ';font-weight:600;text-transform:uppercase;border-bottom:1px solid ' + T.border, h));
    });
    thead.appendChild(trh); tbl.appendChild(thead);
    var tbody = mk('tbody');
    top10.forEach(function (r, i) {
      var tr = mk('tr');
      var color = i === 0 ? T.err : i < 3 ? T.warn : T.mutedHi;
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + color + ';font-family:' + T.fMono +
        ';font-weight:700;border-bottom:1px solid ' + T.border, '#' + (i + 1)));
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.textHi + ';font-family:' + T.fMono +
        ';border-bottom:1px solid ' + T.border, escapeHTML(r.routeId)));
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.mutedHi + ';border-bottom:1px solid ' + T.border,
        escapeHTML(r.driver || '—')));
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.muted + ';font-family:' + T.fMono +
        ';font-size:11px;border-bottom:1px solid ' + T.border, escapeHTML(r.carrier || '—')));
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.err + ';font-family:' + T.fMono +
        ';font-weight:600;border-bottom:1px solid ' + T.border, fmt(r.failed)));
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.mutedHi + ';font-family:' + T.fMono +
        ';border-bottom:1px solid ' + T.border,
        ((r.failed / totalInsucessos) * 100).toFixed(1) + '%'));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    topCard.appendChild(tbl);
    dataArea.appendChild(topCard);

    // === AGRUPAMENTO POR CARRIER ===
    var byCarrier = {};
    routes.forEach(function (r) {
      var c = r.carrier || '—';
      if (!byCarrier[c]) byCarrier[c] = { carrier: c, total: 0, rotas: 0 };
      byCarrier[c].total += r.failed || 0;
      byCarrier[c].rotas++;
    });
    var carriersArr = Object.keys(byCarrier).map(function (k) { return byCarrier[k]; })
      .sort(function (a, b) { return b.total - a.total; });

    var carrierCard = mk('div',
      'background:' + T.surface + ';border:1px solid ' + T.border +
      ';border-left:3px solid ' + T.warn + ';border-radius:10px;padding:12px 14px;margin-bottom:14px');
    carrierCard.appendChild(mk('div',
      'font-size:12px;font-weight:600;color:' + T.textHi + ';margin-bottom:8px',
      '🏢 Insucessos por Transportadora'));

    var tbl2 = mk('table', 'width:100%;border-collapse:separate;border-spacing:0;font-size:12px');
    var thead2 = mk('thead'); var trh2 = mk('tr');
    ['Carrier', 'Rotas afetadas', 'Insucessos', '% do Total'].forEach(function (h) {
      trh2.appendChild(mk('th',
        'padding:8px 10px;text-align:left;font-size:10px;color:' + T.muted +
        ';font-weight:600;text-transform:uppercase;border-bottom:1px solid ' + T.border, h));
    });
    thead2.appendChild(trh2); tbl2.appendChild(thead2);
    var tbody2 = mk('tbody');
    carriersArr.forEach(function (c) {
      var tr = mk('tr');
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.textHi + ';font-weight:600;border-bottom:1px solid ' + T.border,
        escapeHTML(c.carrier)));
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.mutedHi + ';font-family:' + T.fMono +
        ';border-bottom:1px solid ' + T.border, fmt(c.rotas)));
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.err + ';font-family:' + T.fMono +
        ';font-weight:600;border-bottom:1px solid ' + T.border, fmt(c.total)));
      tr.appendChild(mk('td',
        'padding:8px 10px;color:' + T.mutedHi + ';font-family:' + T.fMono +
        ';border-bottom:1px solid ' + T.border,
        ((c.total / totalInsucessos) * 100).toFixed(1) + '%'));
      tbody2.appendChild(tr);
    });
    tbl2.appendChild(tbody2);
    carrierCard.appendChild(tbl2);
    dataArea.appendChild(carrierCard);

    // === EXPORT ===
    dataArea.appendChild(exportBar('INSUCESSOS',
      function () {
        return routes.map(function (r) {
          return {
            rota: r.routeId, motorista: r.driver, carrier: r.carrier,
            origem: r.origem, ciclo: r.ciclo, insucessos: r.failed,
            total: r.totalPkg, pendentes: r.pendentes
          };
        });
      },
      [
        { key: 'rota', label: 'Rota' }, { key: 'motorista', label: 'Motorista' },
        { key: 'carrier', label: 'Carrier' }, { key: 'origem', label: 'Origem' },
        { key: 'ciclo', label: 'Ciclo' }, { key: 'insucessos', label: 'Insucessos' },
        { key: 'total', label: 'Total' }, { key: 'pendentes', label: 'Pendentes' }
      ], 'Insucessos — ' + STATE.ssc + ' — ' + STATE.date));

    // === LISTA COMPLETA DE ROTAS COM INSUCESSO ===
    dataArea.appendChild(mk('div',
      'font-size:12px;font-weight:600;color:' + T.textHi + ';margin:14px 0 8px 0',
      '📋 Todas as rotas com insucesso (' + routes.length + ')'));

    var grid = mk('div', 'display:flex;flex-direction:column;gap:8px');
    routes.forEach(function (r) {
      var card = mk('div',
        'background:' + T.surface + ';border:1px solid ' + T.border + ';border-radius:8px;' +
        'padding:10px 12px;border-left:3px solid ' +
        ((r.failed || 0) > 5 ? T.err : (r.failed || 0) > 2 ? T.warn : T.info) +
        ';display:flex;align-items:center;gap:12px;flex-wrap:wrap');
      card.appendChild(mk('div',
        'font-family:' + T.fMono + ';font-size:12px;font-weight:600;color:' + T.textHi,
        escapeHTML(r.routeId)));
      card.appendChild(mk('div', 'font-size:11px;color:' + T.mutedHi,
        escapeHTML(r.driver || '—')));
      card.appendChild(mk('div',
        'font-size:10px;color:' + T.muted + ';font-family:' + T.fMono,
        escapeHTML(r.carrier || '—') + (r.origem ? ' · ' + escapeHTML(r.origem) : '')));
      card.appendChild(mk('span',
        'background:rgba(239,68,68,.15);color:' + T.err + ';font-size:11px;font-weight:700;' +
        'padding:2px 10px;border-radius:10px;font-family:' + T.fMono + ';margin-left:auto',
        fmt(r.failed) + ' insuc.'));
      grid.appendChild(card);
    });
    dataArea.appendChild(grid);
    setFooterCount(routes.length, allRoutes.length);
  }

  // ==========================================================================
  // RENDER MOTORISTAS
  // ==========================================================================
  function renderMotoristas() {
    var routes = STATE.routes || [];
    var byDriver = {};
    routes.forEach(function (r) {
      var key = r.driver || '— Sem motorista —';
      if (!byDriver[key]) {
        byDriver[key] = {
          driver: key, carrier: r.carrier || '', totalPkg: 0,
          delivered: 0, failed: 0, pnr: 0, routes: 0
        };
      }
      var d = byDriver[key];
      d.totalPkg += r.totalPkg || 0; d.delivered += r.delivered || 0;
      d.failed += r.failed || 0; d.pnr += r.pnr || 0; d.routes++;
      if (!d.carrier && r.carrier) d.carrier = r.carrier;
    });
    var drivers = Object.keys(byDriver).map(function (k) {
      var d = byDriver[k];
      d.dsPct = d.totalPkg > 0 ? (d.delivered / d.totalPkg) * 100 : 0;
      var ag = Agenda.lookup(d.driver);
      d.placa = ag ? (ag.placa || '') : '';
      d.tel = ag ? (ag.tel || '') : '';
      return d;
    });
    drivers.sort(function (a, b) { return a.dsPct - b.dsPct; });

    var f = STATE.filters.MOTORISTAS;
    var carriers = [];
    drivers.forEach(function (d) {
      if (d.carrier && carriers.indexOf(d.carrier) < 0) carriers.push(d.carrier);
    });
    carriers.sort();
    var filtered = drivers.filter(function (d) {
      if (f.carrier.size > 0 && !f.carrier.has(d.carrier)) return false;
      return true;
    });

    var hdr = mk('div',
      'display:flex;align-items:center;margin-bottom:10px;gap:12px;flex-wrap:wrap');
    hdr.appendChild(mk('div',
      'font-size:13px;font-weight:600;color:' + T.textHi,
      'Motoristas <span style="color:' + T.muted + ';font-size:11px">(' +
      filtered.length + ' de ' + drivers.length + ')</span>'));
    hdr.appendChild(mk('span',
      'font-size:10px;color:' + T.muted + ';font-family:' + T.fMono,
      'Agenda: ' + Agenda.count() + ' motoristas · ' + Agenda.lastImport()));
    dataArea.appendChild(hdr);

    if (carriers.length > 0) dataArea.appendChild(chipFilter({
      label: 'Carrier', values: carriers, selectedSet: f.carrier,
      onChange: function () { renderActiveTab(); }
    }));

    dataArea.appendChild(exportBar('MOTORISTAS',
      function () {
        return filtered.map(function (d) {
          return {
            motorista: d.driver, placa: d.placa, telefone: d.tel,
            carrier: d.carrier, rotas: d.routes, total: d.totalPkg,
            entregues: d.delivered, insucessos: d.failed, pnr: d.pnr,
            ds: d.dsPct.toFixed(1) + '%'
          };
        });
      },
      [
        { key: 'motorista', label: 'Motorista' }, { key: 'placa', label: 'Placa' },
        { key: 'telefone', label: 'Tel' }, { key: 'carrier', label: 'Carrier' },
        { key: 'rotas', label: 'Rotas' }, { key: 'total', label: 'Total' },
        { key: 'entregues', label: 'Entregues' }, { key: 'insucessos', label: 'Insucessos' },
        { key: 'pnr', label: 'PNR' }, { key: 'ds', label: 'DS%' }
      ], 'Motoristas — ' + STATE.ssc + ' — ' + STATE.date));

    var tbl = table(filtered, [
      { key: 'driver', label: 'Motorista',
        format: function (v, row) {
          var placa = row.placa ?
            '<span style="background:rgba(6,182,212,.15);color:' + T.brand2 +
            ';font-size:10px;font-weight:700;padding:1px 7px;border-radius:6px;' +
            'font-family:' + T.fMono + ';margin-left:6px">' + escapeHTML(row.placa) + '</span>' : '';
          return '<span style="color:' + T.textHi + '">' + escapeHTML(v) + '</span>' + placa;
        }
      },
      { key: 'tel', label: 'Tel.', mono: true,
        format: function (v) { return v ? escapeHTML(v) : '—'; },
        color: function (v) { return v ? T.mutedHi : T.muted; } },
      { key: 'carrier', label: 'Carrier', mono: true,
        format: function (v) { return escapeHTML(v || '—'); } },
      { key: 'routes', label: 'Rotas', mono: true, width: '60px' },
      { key: 'totalPkg', label: 'Total', mono: true, width: '80px',
        format: function (v) { return fmt(v); } },
      { key: 'delivered', label: 'Entreg.', mono: true, width: '80px',
        format: function (v) { return fmt(v); }, color: function () { return T.ok; } },
      { key: 'failed', label: 'Insuc.', mono: true, width: '80px',
        format: function (v) { return fmt(v); },
        color: function (v) { return v > 0 ? T.err : T.muted; } },
      { key: 'pnr', label: 'PNR', mono: true, width: '80px',
        format: function (v) { return fmt(v); },
        color: function (v) { return v > 0 ? T.warn : T.muted; } },
      { key: 'dsPct', label: 'DS%', mono: true, width: '80px',
        format: function (v) { return v.toFixed(1) + '%'; },
        color: function (v) { return v >= 95 ? T.ok : v >= 90 ? T.warn : T.err; } }
    ]);
    dataArea.appendChild(tbl);
    setFooterCount(filtered.length, drivers.length);
  }

  // ==========================================================================
  // RENDER PNR
  // ==========================================================================
  function renderPNR() {
    var routes = STATE.routes || [];
    var pkgs = [];
    routes.forEach(function (r) {
      (r.pnrList || []).forEach(function (pk) {
        pkgs.push({
          packageId: pk.packageId, rota: r.routeId, motorista: r.driver || '—',
          carrier: r.carrier || '', motivo: pk.reason || 'Não retirado', hora: pk.time || ''
        });
      });
    });
    var f = STATE.filters.PNR;
    var carriers = [];
    pkgs.forEach(function (p) {
      if (p.carrier && carriers.indexOf(p.carrier) < 0) carriers.push(p.carrier);
    });
    carriers.sort();
    var filtered = pkgs.filter(function (p) {
      if (f.carrier.size > 0 && !f.carrier.has(p.carrier)) return false;
      return true;
    });

    dataArea.appendChild(mk('div',
      'font-size:13px;font-weight:600;color:' + T.textHi + ';margin-bottom:10px',
      'PNR — Pacotes Não Retirados <span style="color:' + T.muted + ';font-size:11px">(' +
      filtered.length + ' de ' + pkgs.length + ')</span>'));

    if (carriers.length > 0) dataArea.appendChild(chipFilter({
      label: 'Carrier', values: carriers, selectedSet: f.carrier,
      onChange: function () { renderActiveTab(); }
    }));

    dataArea.appendChild(exportBar('PNR',
      function () { return filtered; },
      [
        { key: 'packageId', label: 'Pacote' }, { key: 'rota', label: 'Rota' },
        { key: 'motorista', label: 'Motorista' }, { key: 'carrier', label: 'Carrier' },
        { key: 'motivo', label: 'Motivo' }, { key: 'hora', label: 'Hora' }
      ], 'PNR — ' + STATE.ssc + ' — ' + STATE.date));

    var byRoute = {};
    filtered.forEach(function (p) {
      if (!byRoute[p.rota]) byRoute[p.rota] = [];
      byRoute[p.rota].push(p);
    });
    var grid = mk('div', 'display:flex;flex-direction:column;gap:10px');
    Object.keys(byRoute).sort(function (a, b) {
      return byRoute[b].length - byRoute[a].length;
    }).forEach(function (rk) {
      var items = byRoute[rk]; var first = items[0];
      var card = mk('div',
        'background:' + T.surface + ';border:1px solid ' + T.border + ';border-radius:10px;' +
        'padding:12px 14px;border-left:3px solid ' + T.warn);
      var head = mk('div', 'display:flex;align-items:center;gap:10px;flex-wrap:wrap');
      head.appendChild(mk('div',
        'font-family:' + T.fMono + ';font-size:13px;font-weight:600;color:' + T.textHi,
        escapeHTML(rk)));
      head.appendChild(mk('div', 'font-size:12px;color:' + T.mutedHi,
        escapeHTML(first.motorista)));
      head.appendChild(mk('div',
        'font-size:10px;color:' + T.muted + ';font-family:' + T.fMono,
        escapeHTML(first.carrier)));
      head.appendChild(mk('span',
        'background:rgba(245,158,11,.15);color:' + T.warn + ';font-size:11px;font-weight:700;' +
        'padding:2px 10px;border-radius:10px;font-family:' + T.fMono + ';margin-left:auto',
        fmt(items.length) + ' PNR'));
      card.appendChild(head);
      card.appendChild(toggleBlock('pnr_' + rk, 'Ver ' + items.length + ' pacotes',
        function () {
          var inner = mk('div');
          items.forEach(function (p) {
            var line = mk('div', 'padding:3px 0;border-bottom:1px dashed ' + T.border);
            line.innerHTML =
              '<span style="color:' + T.brand2 + '">' + escapeHTML(p.packageId) + '</span>' +
              ' · <span style="color:' + T.muted + '">' + escapeHTML(p.motivo) + '</span>';
            inner.appendChild(line);
          });
          return inner;
        }));
      grid.appendChild(card);
    });
    dataArea.appendChild(grid);
    setFooterCount(filtered.length, pkgs.length);
  }

  // ==========================================================================
  // RENDER AGENCIAS
  // ==========================================================================
  function renderAgencias() {
    var routes = STATE.routes || [];
    var byAg = {};
    routes.forEach(function (r) {
      var key = r.agencia || r.carrier || '—';
      if (!byAg[key]) byAg[key] = {
        agencia: key, totalPkg: 0, delivered: 0, failed: 0,
        pnr: 0, routes: 0, drivers: {}
      };
      var a = byAg[key];
      a.totalPkg += r.totalPkg || 0; a.delivered += r.delivered || 0;
      a.failed += r.failed || 0; a.pnr += r.pnr || 0; a.routes++;
      if (r.driver) a.drivers[r.driver] = true;
    });
    var ags = Object.keys(byAg).map(function (k) {
      var a = byAg[k];
      a.driversCount = Object.keys(a.drivers).length;
      a.dsPct = a.totalPkg > 0 ? (a.delivered / a.totalPkg) * 100 : 0;
      return a;
    });
    var f = STATE.filters.AGENCIAS;
    var filtered = ags.slice();
    if (f.sort === 'withIns') filtered = filtered.filter(function (a) { return a.failed > 0; });
    if (f.sort === 'noIns')   filtered = filtered.filter(function (a) { return a.failed === 0; });
    if (f.sort === 'moreP')   filtered.sort(function (a, b) { return b.totalPkg - a.totalPkg; });
    else if (f.sort === 'lessP') filtered.sort(function (a, b) { return a.totalPkg - b.totalPkg; });
    else filtered.sort(function (a, b) { return b.failed - a.failed; });

    dataArea.appendChild(mk('div',
      'font-size:13px;font-weight:600;color:' + T.textHi + ';margin-bottom:10px',
      'Agências <span style="color:' + T.muted + ';font-size:11px">(' +
      filtered.length + ' de ' + ags.length + ')</span>'));

    var segWrap = mk('div', 'display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap');
    [
      { id: 'all', label: 'Todas' }, { id: 'withIns', label: 'Com Insucessos' },
      { id: 'noIns', label: 'Sem Insucessos' }, { id: 'moreP', label: 'Mais Pacotes' },
      { id: 'lessP', label: 'Menos Pacotes' }
    ].forEach(function (s) {
      var btn = mk('button',
        'background:' + (f.sort === s.id ? T.gradSoft : T.surface) +
        ';border:1px solid ' + (f.sort === s.id ? T.brand : T.border) +
        ';color:' + (f.sort === s.id ? T.textHi : T.mutedHi) +
        ';padding:5px 12px;border-radius:14px;cursor:pointer;font-size:11px',
        escapeHTML(s.label));
      btn.onclick = function () { f.sort = s.id; renderActiveTab(); };
      segWrap.appendChild(btn);
    });
    dataArea.appendChild(segWrap);

    dataArea.appendChild(exportBar('AGENCIAS',
      function () {
        return filtered.map(function (a) {
          return {
            agencia: a.agencia, rotas: a.routes, motoristas: a.driversCount,
            total: a.totalPkg, entregues: a.delivered, insucessos: a.failed,
            pnr: a.pnr, ds: a.dsPct.toFixed(1) + '%'
          };
        });
      },
      [
        { key: 'agencia', label: 'Agência' }, { key: 'rotas', label: 'Rotas' },
        { key: 'motoristas', label: 'Motoristas' }, { key: 'total', label: 'Total' },
        { key: 'entregues', label: 'Entregues' }, { key: 'insucessos', label: 'Insucessos' },
        { key: 'pnr', label: 'PNR' }, { key: 'ds', label: 'DS%' }
      ], 'Agências — ' + STATE.ssc + ' — ' + STATE.date));

    dataArea.appendChild(table(filtered, [
      { key: 'agencia', label: 'Agência',
        format: function (v) { return '<span style="color:' + T.textHi + ';font-weight:600">' + escapeHTML(v) + '</span>'; } },
      { key: 'routes', label: 'Rotas', mono: true, width: '70px' },
      { key: 'driversCount', label: 'Motoristas', mono: true, width: '90px' },
      { key: 'totalPkg', label: 'Total', mono: true, width: '90px',
        format: function (v) { return fmt(v); } },
      { key: 'delivered', label: 'Entreg.', mono: true, width: '90px',
        format: function (v) { return fmt(v); }, color: function () { return T.ok; } },
      { key: 'failed', label: 'Insuc.', mono: true, width: '80px',
        format: function (v) { return fmt(v); },
        color: function (v) { return v > 0 ? T.err : T.muted; } },
      { key: 'pnr', label: 'PNR', mono: true, width: '80px',
        format: function (v) { return fmt(v); },
        color: function (v) { return v > 0 ? T.warn : T.muted; } },
      { key: 'dsPct', label: 'DS%', mono: true, width: '80px',
        format: function (v) { return v.toFixed(1) + '%'; },
        color: function (v) { return v >= 95 ? T.ok : v >= 90 ? T.warn : T.err; } }
    ]));
    setFooterCount(filtered.length, ags.length);
  }

  // ==========================================================================
  // RENDER DEVOLUCOES
  // ==========================================================================
  function renderDevolucoes() {
    var routes = STATE.routes || [];
    var pkgs = [];
    routes.forEach(function (r) {
      (r.returns || []).forEach(function (pk) {
        pkgs.push({
          packageId: pk.packageId, rota: r.routeId, motorista: r.driver || '—',
          carrier: r.carrier || '', motivo: pk.reason || 'Devolução',
          destino: pk.destination || 'Hub', hora: pk.time || ''
        });
      });
    });
    var f = STATE.filters.DEVOLUCOES;
    var filtered = pkgs.slice();
    if (f.sort === 'byDriver') filtered.sort(function (a, b) {
      return (a.motorista || '').localeCompare(b.motorista || '');
    });
    else if (f.sort === 'byCarrier') filtered.sort(function (a, b) {
      return (a.carrier || '').localeCompare(b.carrier || '');
    });

    dataArea.appendChild(mk('div',
      'font-size:13px;font-weight:600;color:' + T.textHi + ';margin-bottom:10px',
      'Devoluções <span style="color:' + T.muted + ';font-size:11px">(' +
      filtered.length + ' de ' + pkgs.length + ')</span>'));

    var segWrap = mk('div', 'display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap');
    [
      { id: 'all', label: 'Todas' }, { id: 'byDriver', label: 'Por Motorista' },
      { id: 'byCarrier', label: 'Por Carrier' }
    ].forEach(function (s) {
      var btn = mk('button',
        'background:' + (f.sort === s.id ? T.gradSoft : T.surface) +
        ';border:1px solid ' + (f.sort === s.id ? T.brand : T.border) +
        ';color:' + (f.sort === s.id ? T.textHi : T.mutedHi) +
        ';padding:5px 12px;border-radius:14px;cursor:pointer;font-size:11px',
        escapeHTML(s.label));
      btn.onclick = function () { f.sort = s.id; renderActiveTab(); };
      segWrap.appendChild(btn);
    });
    dataArea.appendChild(segWrap);

    dataArea.appendChild(exportBar('DEVOLUCOES',
      function () { return filtered; },
      [
        { key: 'packageId', label: 'Pacote' }, { key: 'rota', label: 'Rota' },
        { key: 'motorista', label: 'Motorista' }, { key: 'carrier', label: 'Carrier' },
        { key: 'motivo', label: 'Motivo' }, { key: 'destino', label: 'Destino' },
        { key: 'hora', label: 'Hora' }
      ], 'Devoluções — ' + STATE.ssc + ' — ' + STATE.date));

    dataArea.appendChild(table(filtered, [
      { key: 'packageId', label: 'Pacote', mono: true,
        color: function () { return T.brand2; } },
      { key: 'rota', label: 'Rota', mono: true,
        format: function (v) { return escapeHTML(v); } },
      { key: 'motorista', label: 'Motorista',
        format: function (v) { return escapeHTML(v); } },
      { key: 'carrier', label: 'Carrier', mono: true,
        format: function (v) { return escapeHTML(v); } },
      { key: 'motivo', label: 'Motivo',
        format: function (v) { return escapeHTML(v); },
        color: function () { return T.warn; } },
      { key: 'destino', label: 'Destino', mono: true,
        format: function (v) { return escapeHTML(v); } },
      { key: 'hora', label: 'Hora', mono: true, width: '80px',
        format: function (v) { return escapeHTML(v || '—'); } }
    ]));
    setFooterCount(filtered.length, pkgs.length);
  }
    // ==========================================================================
  // MODAIS
  // ==========================================================================
  function openModal(opts) {
    opts = opts || {};
    var overlay = mk('div',
      'position:fixed;inset:0;background:rgba(2,6,23,.7);backdrop-filter:blur(8px);' +
      'z-index:' + (T.z + 80) + ';display:flex;align-items:center;justify-content:center;' +
      'font-family:' + T.fUI + ';animation:mlm_fadeIn .2s ease-out;padding:20px');
    var box = mk('div',
      'background:linear-gradient(135deg,' + T.bg + ' 0%,' + T.bgPurple + ' 100%);' +
      'border:1px solid ' + T.border + ';border-radius:14px;color:' + T.text +
      ';box-shadow:' + T.shadow + ';animation:mlm_slideUp .25s ease-out;' +
      'width:' + (opts.width || '600px') + ';max-width:100%;max-height:90vh;' +
      'display:flex;flex-direction:column;overflow:hidden');
    var head = mk('div',
      'display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid ' + T.border +
      ';background:' + T.surface);
    head.appendChild(mk('div',
      'font-size:14px;font-weight:600;color:' + T.textHi + ';flex:1',
      escapeHTML(opts.title || 'Modal')));
    var btnX = mk('button',
      'background:transparent;border:1px solid ' + T.border + ';color:' + T.muted +
      ';width:28px;height:28px;border-radius:7px;cursor:pointer;display:flex;' +
      'align-items:center;justify-content:center', ICON.close);
    head.appendChild(btnX);
    box.appendChild(head);
    var body = mk('div', 'padding:18px 20px;overflow-y:auto;flex:1');
    box.appendChild(body);
    var foot = mk('div',
      'padding:12px 20px;border-top:1px solid ' + T.border + ';background:' + T.surface +
      ';display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap');
    box.appendChild(foot);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    function close() {
      overlay.style.animation = 'mlm_fadeOut .15s ease-in forwards';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener('keydown', onKey);
      }, 160);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    btnX.onclick = close;
    overlay.onclick = function (e) { if (e.target === overlay) close(); };
    document.addEventListener('keydown', onKey);
    return { overlay: overlay, body: body, footer: foot, close: close };
  }

  function openReportModal() {
    // Aplica filtros globais E descarta "A caminho do destino"
    var routes = applyGlobalFilters(STATE.routes || [])
      .filter(function (r) { return r.status !== 'A caminho do destino'; });
    var stats = getDSStats(routes);
    var finished = 0, running = 0, notStarted = 0;
    routes.forEach(function (r) {
      if (r.status === 'Encerradas') finished++;
      else if (r.status === 'Abertas') running++;
      else notStarted++;
    });

    // Detecta se há filtros ativos
    var g = STATE.globalFilters;
    var hasFilters = g.status.size + g.tipo.size + g.modal.size + g.carrier.size +
                     g.driver.size + g.ciclo.size + g.origem.size > 0 || g.placa;
    var pendentes = Math.max(0, stats.total - stats.delivered - stats.failed - stats.foraDS);

    // Top 3 ofensoras
    var top3 = routes.slice().filter(function (r) {
      return (r.failed || 0) > 0;
    }).sort(function (a, b) { return (b.failed || 0) - (a.failed || 0); }).slice(0, 3);

    // Top 3 motivos de insucesso (já descontando "fora do DS")
    var motivosMap = {};
    routes.forEach(function (r) {
      (r.failures || []).forEach(function (f) {
        if (isInsucessoForaDoDS(f.reason)) return;
        var m = f.reason || 'Sem motivo';
        motivosMap[m] = (motivosMap[m] || 0) + 1;
      });
    });
    var topMotivos = Object.keys(motivosMap).map(function (k) {
      return { motivo: k, qtd: motivosMap[k] };
    }).sort(function (a, b) { return b.qtd - a.qtd; }).slice(0, 3);

    var d = new Date(STATE.date + 'T12:00:00');
    var dataFmt = pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
    var now = new Date();
    var horaFmt = pad(now.getHours()) + ':' + pad(now.getMinutes());

    var dsEmoji = stats.dsPct >= 95 ? '🟢' : stats.dsPct >= 90 ? '🟡' : '🔴';
    var progRotas = routes.length > 0 ? ((finished / routes.length) * 100).toFixed(0) : 0;

    var textoWA =
      '*🚚 ' + STATE.ssc + ' • REPORT ' + horaFmt + ' • ' + dataFmt + '*\n' +
      (hasFilters ? '_⚙️ Filtros aplicados — ' + routes.length + ' rotas_\n' : '') +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📦 *Pacotes:* ' + fmt(stats.total) + '\n' +
      '✅ *Entregues:* ' + fmt(stats.delivered) + ' (' + stats.dsPct.toFixed(1) + '%)\n' +
      '⏳ *Pendentes:* ' + fmt(pendentes) + '\n' +
      '🔴 *Insucessos:* ' + fmt(stats.failed) +
        (stats.foraDS > 0 ? '  _(+' + stats.foraDS + ' fora DS)_' : '') + '\n' +
      '🟡 *PNR:* ' + fmt(stats.pnr) + '\n\n' +
      '*🎯 DS Operacional:* ' + dsEmoji + ' *' + stats.dsPct.toFixed(2) + '%*\n\n' +
      '*🛣️ Rotas:* ' + routes.length + ' total\n' +
      '  ✅ Encerradas: ' + finished + ' (' + progRotas + '%)\n' +
      '  🔄 Em andamento: ' + running + '\n' +
      (notStarted > 0 ? '  ⏸️ Não iniciadas: ' + notStarted + '\n' : '');

    if (topMotivos.length > 0) {
      textoWA += '\n*🔥 Top motivos de insucesso:*\n';
      topMotivos.forEach(function (m, i) {
        textoWA += (i + 1) + '. ' + m.motivo + ' — ' + m.qtd + '\n';
      });
    }
    if (top3.length > 0) {
      textoWA += '\n*⚠️ Top rotas ofensoras:*\n';
      top3.forEach(function (r, i) {
        textoWA += (i + 1) + '. ' + r.routeId + ' (' + (r.driver || '—') + ') — ' +
                   (r.failed || 0) + ' insuc.\n';
      });
    }
    textoWA += '\n_Atualizado em ' + horaFmt + ' • Monitor LM v' + APP.version + '_';

    var modal = openModal({ title: 'Report Hora a Hora', width: '580px' });
    modal.body.appendChild(mk('div',
      'font-size:11px;color:' + T.muted + ';margin-bottom:10px',
      'Texto formatado pronto para colar no WhatsApp.'));
    var ta = mk('textarea',
      'width:100%;min-height:380px;background:' + T.surface +
      ';border:1px solid ' + T.border + ';color:' + T.textHi +
      ';padding:14px;border-radius:10px;font-family:' + T.fMono +
      ';font-size:12px;line-height:1.6;resize:vertical');
    ta.value = textoWA;
    modal.body.appendChild(ta);

    var btnCopiar = mk('button', '', ICON.copy + '<span>Copiar</span>');
    btnCopiar.style.cssText = 'background:' + T.grad + ';border:none;color:#fff;padding:8px 16px;' +
      'border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;' +
      'align-items:center;gap:6px';
    btnCopiar.onclick = function () {
      // Garante que pega o valor atual do textarea (caso usuário tenha editado)
      var conteudo = ta.value;
      if (!conteudo) { toast('Nada para copiar', 'warn'); return; }
      // Fallback robusto: tenta clipboard API, depois execCommand
      try {
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, 99999);
      } catch (e) {}
      copyText(conteudo).then(function () {
        toast('Mensagem copiada!', 'ok');
      }).catch(function (err) {
        // Fallback final: execCommand
        try {
          ta.focus(); ta.select();
          var ok = document.execCommand('copy');
          if (ok) toast('Mensagem copiada!', 'ok');
          else toast('Selecione e use Ctrl+C', 'warn');
        } catch (e2) {
          toast('Falha ao copiar: ' + (err && err.message || 'erro'), 'err');
        }
      });
    };
    var btnFechar = mk('button', '', '<span>Fechar</span>');
    btnFechar.className = 'mlm_btn';
    btnFechar.onclick = modal.close;
    modal.footer.appendChild(btnFechar);
    modal.footer.appendChild(btnCopiar);
  }

  function openFechamentoModal() {
    // Aplica filtros globais E descarta "A caminho do destino"
    var routes = applyGlobalFilters(STATE.routes || [])
      .filter(function (r) { return r.status !== 'A caminho do destino'; });
    var stats = getDSStats(routes);
    var g = STATE.globalFilters;
    var hasFilters = g.status.size + g.tipo.size + g.modal.size + g.carrier.size +
                     g.driver.size + g.ciclo.size + g.origem.size > 0 || g.placa;
    var total = stats.total, delivered = stats.delivered;
    var failed = stats.failed, pnr = stats.pnr, foraDS = stats.foraDS;
    var dsPct = stats.dsPct.toFixed(2);
    var finished = 0, running = 0;
    routes.forEach(function (r) {
      if (r.status === 'FINISHED' || r.status === 'FINALIZADA' || r.status === 'Encerradas') finished++;
      else if (r.status === 'IN_PROGRESS' || r.status === 'RUNNING' || r.status === 'Abertas') running++;
    });
    var pendentes = Math.max(0, total - delivered - failed - foraDS);

    // Top 5 ofensoras
    var top5 = routes.slice().filter(function (r) {
      return (r.failed || 0) > 0 || (r.pnr || 0) > 0;
    }).sort(function (a, b) {
      return ((b.failed || 0) + (b.pnr || 0)) - ((a.failed || 0) + (a.pnr || 0));
    }).slice(0, 5);

    // Top 5 motivos (descontando "fora do DS")
    var motivosMap = {};
    routes.forEach(function (r) {
      (r.failures || []).forEach(function (f) {
        if (isInsucessoForaDoDS(f.reason)) return;
        var m = f.reason || 'Sem motivo';
        motivosMap[m] = (motivosMap[m] || 0) + 1;
      });
    });
    var topMotivos = Object.keys(motivosMap).map(function (k) {
      return { motivo: k, qtd: motivosMap[k] };
    }).sort(function (a, b) { return b.qtd - a.qtd; }).slice(0, 5);

    // Performance por transportadora
    var byCarrier = {};
    routes.forEach(function (r) {
      var c = r.carrier || '—';
      if (!byCarrier[c]) byCarrier[c] = { total: 0, delivered: 0, failed: 0, foraDS: 0, routes: 0 };
      var b = byCarrier[c];
      b.total += r.totalPkg || 0;
      b.delivered += r.delivered || 0;
      b.routes++;
      (r.failures || []).forEach(function (f) {
        if (isInsucessoForaDoDS(f.reason)) b.foraDS++;
        else b.failed++;
      });
      if (!r.failures || r.failures.length === 0) b.failed += r.failed || 0;
    });
    var carriersArr = Object.keys(byCarrier).map(function (k) {
      var b = byCarrier[k];
      var base = b.total - b.foraDS;
      b.dsPct = base > 0 ? (b.delivered / base) * 100 : 0;
      b.name = k;
      return b;
    }).sort(function (a, b) { return b.dsPct - a.dsPct; });

    var d = new Date(STATE.date + 'T12:00:00');
    var dataFmt = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    var now = new Date();
    var horaFmt = pad(now.getHours()) + ':' + pad(now.getMinutes());

    var dsEmoji = stats.dsPct >= 95 ? '🟢' : stats.dsPct >= 90 ? '🟡' : '🔴';

    var modal = openModal({ title: 'Gerar Fechamento', width: '820px' });
    var grid = mk('div', 'display:grid;grid-template-columns:1fr 1fr;gap:16px');
    modal.body.appendChild(grid);
    var form = mk('div', 'display:flex;flex-direction:column;gap:10px');
    grid.appendChild(form);

    function fld(label, type) {
      var w = mk('div');
      w.appendChild(mk('label',
        'display:block;font-size:10px;color:' + T.muted + ';font-weight:600;' +
        'text-transform:uppercase;margin-bottom:4px', label));
      var el;
      if (type === 'textarea') {
        el = mk('textarea',
          'width:100%;background:' + T.surface + ';border:1px solid ' + T.border +
          ';color:' + T.textHi + ';padding:8px 10px;border-radius:7px;font-size:12px;' +
          'font-family:' + T.fUI + ';min-height:60px;resize:vertical');
      } else {
        el = mk('input',
          'width:100%;background:' + T.surface + ';border:1px solid ' + T.border +
          ';color:' + T.textHi + ';padding:8px 10px;border-radius:7px;font-size:12px;' +
          'font-family:' + T.fUI);
        el.type = 'text';
      }
      w.appendChild(el);
      form.appendChild(w);
      return el;
    }
    var inpOperador = fld('Operador');
    var inpObs = fld('Observações', 'textarea');
    var inpAcoes = fld('Ações tomadas', 'textarea');
    var inpPendencia = fld('Pendências / Follow-up', 'textarea');

    var preview = mk('div',
      'background:' + T.surface + ';border:1px solid ' + T.border + ';border-radius:10px;' +
      'padding:12px;font-family:' + T.fMono + ';font-size:11px;color:' + T.mutedHi +
      ';line-height:1.6;white-space:pre-wrap;max-height:520px;overflow-y:auto');
    grid.appendChild(preview);

    function buildText() {
      var t = '';
      t += '╔══════════════════════════════════════════╗\n';
      t += '║  FECHAMENTO ' + STATE.ssc + ' • ' + dataFmt + '            \n';
      t += '╚══════════════════════════════════════════╝\n\n';
      t += '📅 Gerado em: ' + dataFmt + ' às ' + horaFmt + '\n';
      if (inpOperador.value) t += '👤 Operador: ' + inpOperador.value + '\n';
      if (hasFilters) t += '⚙️ Filtros aplicados — ' + routes.length + ' rotas no escopo\n';
      t += '\n';

      t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      t += '📊 INDICADORES GERAIS\n';
      t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      t += '  📦 Total de Pacotes: ' + fmt(total) + '\n';
      t += '  ✅ Entregues:        ' + fmt(delivered) + '\n';
      t += '  ⏳ Pendentes:        ' + fmt(pendentes) + '\n';
      t += '  🔴 Insucessos:       ' + fmt(failed) + '\n';
      if (foraDS > 0) {
        t += '  ⚪ Fora do DS:       ' + fmt(foraDS) + '  (não contabilizados)\n';
      }
      t += '  🟡 PNR:              ' + fmt(pnr) + '\n\n';
      t += '  🎯 DS Operacional:   ' + dsEmoji + ' ' + dsPct + '%\n';
      if (foraDS > 0) {
        t += '     (base ajustada: ' + fmt(stats.baseDS) + ' pacotes)\n';
      }
      t += '\n';

      t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      t += '🛣️  STATUS DAS ROTAS\n';
      t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      t += '  Total de Rotas:    ' + routes.length + '\n';
      t += '  ✅ Encerradas:     ' + finished + ' (' +
           (routes.length > 0 ? ((finished / routes.length) * 100).toFixed(0) : 0) + '%)\n';
      t += '  🔄 Em andamento:   ' + running + '\n\n';

      if (carriersArr.length > 0) {
        t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        t += '🏢 DESEMPENHO POR TRANSPORTADORA\n';
        t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        carriersArr.forEach(function (c, i) {
          var em = c.dsPct >= 95 ? '🟢' : c.dsPct >= 90 ? '🟡' : '🔴';
          t += '  ' + em + ' ' + c.name + '\n';
          t += '     Rotas: ' + c.routes + ' · Pacotes: ' + fmt(c.total) +
               ' · DS: ' + c.dsPct.toFixed(1) + '% · Insuc: ' + c.failed + '\n';
        });
        t += '\n';
      }

      if (topMotivos.length > 0) {
        t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        t += '🔥 TOP 5 MOTIVOS DE INSUCESSO\n';
        t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        topMotivos.forEach(function (m, i) {
          t += '  ' + (i + 1) + '. ' + m.motivo + ' — ' + m.qtd + '\n';
        });
        t += '\n';
      }

      if (top5.length > 0) {
        t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        t += '⚠️  TOP 5 ROTAS OFENSORAS\n';
        t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        top5.forEach(function (r, i) {
          t += '  ' + (i + 1) + '. ' + r.routeId + '\n';
          t += '     👤 ' + (r.driver || '—') + '  ·  🏢 ' + (r.carrier || '—') + '\n';
          t += '     🔴 Insuc: ' + (r.failed || 0) + '  ·  🟡 PNR: ' + (r.pnr || 0) +
               '  ·  📦 ' + (r.totalPkg || 0) + ' pkg\n';
        });
        t += '\n';
      }

      if (inpObs.value || inpAcoes.value || inpPendencia.value) {
        t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        t += '📝 NOTAS DO OPERADOR\n';
        t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        if (inpObs.value)       t += '\n📌 Observações:\n' + inpObs.value + '\n';
        if (inpAcoes.value)     t += '\n⚙️ Ações Tomadas:\n' + inpAcoes.value + '\n';
        if (inpPendencia.value) t += '\n⏭️ Pendências / Follow-up:\n' + inpPendencia.value + '\n';
        t += '\n';
      }

      t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      t += 'Monitor Last Mile v' + APP.version + ' · ' + STATE.ssc + '\n';
      return t;
    }

    function refresh() { preview.textContent = buildText(); }
    [inpOperador, inpObs, inpAcoes, inpPendencia].forEach(function (el) { el.oninput = refresh; });
    refresh();

    var btnCopiar = mk('button', '', ICON.copy + '<span>Copiar</span>');
    btnCopiar.style.cssText = 'background:' + T.grad + ';border:none;color:#fff;padding:8px 16px;' +
      'border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;' +
      'align-items:center;gap:6px';
    btnCopiar.onclick = function () {
      copyText(buildText()).then(function () { toast('Fechamento copiado', 'ok'); })
        .catch(function () { toast('Falha ao copiar', 'err'); });
    };
    var btnPDF = mk('button', '', ICON.print + '<span>Exportar PDF</span>');
    btnPDF.className = 'mlm_btn mlm_btn_warn';
    btnPDF.onclick = function () {
      var html = '<pre style="font-family:Consolas,monospace;font-size:11px;white-space:pre-wrap">' +
        escapeHTML(buildText()) + '</pre>';
      pdfExportHTML(html, 'Fechamento ' + STATE.ssc + ' — ' + dataFmt);
    };
    var btnFechar = mk('button', '', '<span>Fechar</span>');
    btnFechar.className = 'mlm_btn';
    btnFechar.onclick = modal.close;
    modal.footer.appendChild(btnFechar);
    modal.footer.appendChild(btnPDF);
    modal.footer.appendChild(btnCopiar);
  }

  function parseCSV(text) {
    var firstLine = text.split(/\r?\n/)[0] || '';
    var sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
    var rows = [], row = [], field = '', inQuotes = false, i = 0, len = text.length;
    while (i < len) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"')  { inQuotes = true; i++; continue; }
      if (c === sep)  { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }

  function openAgendaModal() {
    var modal = openModal({ title: 'Importar Agenda CSV', width: '720px' });
    modal.body.appendChild(mk('div',
      'font-size:12px;color:' + T.muted + ';line-height:1.6;margin-bottom:10px',
      'CSV com colunas <b style="color:' + T.mutedHi + '">Nome</b>, ' +
      '<b style="color:' + T.mutedHi + '">Placa</b>, <b style="color:' + T.mutedHi + '">Telefone</b>, ' +
      '<b style="color:' + T.mutedHi + '">Hub</b>. Aceita separador ; ou , e campos com aspas.'));

    var status = mk('div',
      'padding:10px 12px;background:rgba(15,23,42,.5);border:1px solid ' + T.border +
      ';border-radius:8px;font-size:11px;color:' + T.mutedHi + ';margin-bottom:14px;' +
      'font-family:' + T.fMono);
    function refreshStatus() {
      status.innerHTML = '<b>Agenda atual:</b> ' + Agenda.count() +
        ' motoristas · <b>Última:</b> ' + Agenda.lastImport();
    }
    refreshStatus();
    modal.body.appendChild(status);

    var topBtns = mk('div', 'display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap');
    var fileInput = mk('input', 'display:none');
    fileInput.type = 'file';
    fileInput.accept = '.csv,text/csv,text/plain';
    var btnUpload = mk('button', '', ICON.upload + '<span>Escolher CSV</span>');
    btnUpload.style.cssText = 'background:' + T.grad + ';border:none;color:#fff;padding:8px 16px;' +
      'border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;' +
      'align-items:center;gap:6px';
    btnUpload.onclick = function () { fileInput.click(); };
    var btnLimpar = mk('button', '', ICON.trash + '<span>Limpar Agenda</span>');
    btnLimpar.className = 'mlm_btn mlm_btn_err';
    btnLimpar.onclick = function () {
      confirmModal({
        title: 'Limpar agenda?',
        message: 'Remove todos os ' + Agenda.count() + ' motoristas salvos.',
        okText: 'Limpar', danger: true
      }).then(function (ok) {
        if (!ok) return;
        Agenda.clear(); refreshStatus(); previewWrap.innerHTML = '';
        toast('Agenda limpa', 'info');
      });
    };
    topBtns.appendChild(btnUpload); topBtns.appendChild(btnLimpar); topBtns.appendChild(fileInput);
    modal.body.appendChild(topBtns);

    var previewWrap = mk('div');
    modal.body.appendChild(previewWrap);
    var parsedData = null;

    fileInput.onchange = function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var rows = parseCSV(String(reader.result));
          if (!rows || rows.length < 2) { toast('CSV vazio', 'err'); return; }
          var header = rows[0].map(function (h) { return Agenda.normalize(h); });
          function colIdx(names) {
            for (var i = 0; i < names.length; i++) {
              var idx = header.indexOf(names[i]);
              if (idx >= 0) return idx;
            }
            return -1;
          }
          var iNome = colIdx(['nome', 'motorista', 'driver']);
          var iPlaca = colIdx(['placa', 'plate']);
          var iTel = colIdx(['telefone', 'tel', 'celular', 'fone']);
          var iHub = colIdx(['hub', 'agencia', 'cluster']);
          if (iNome < 0) { toast('Coluna "Nome" não encontrada', 'err'); return; }

          var obj = {}, sample = [];
          for (var r = 1; r < rows.length; r++) {
            var row = rows[r];
            if (!row || !row[iNome]) continue;
            var nome = String(row[iNome]).trim();
            if (!nome) continue;
            var key = Agenda.normalize(nome);
            var rec = {
              nome: nome,
              placa: iPlaca >= 0 ? String(row[iPlaca] || '').trim().toUpperCase() : '',
              tel:   iTel   >= 0 ? String(row[iTel]   || '').trim() : '',
              hub:   iHub   >= 0 ? String(row[iHub]   || '').trim() : ''
            };
            obj[key] = rec;
            if (sample.length < 8) sample.push(rec);
          }
          parsedData = obj;
          var count = Object.keys(obj).length;

          previewWrap.innerHTML = '';
          previewWrap.appendChild(mk('div',
            'font-size:12px;color:' + T.ok + ';margin-bottom:8px;font-weight:600',
            '✓ ' + count + ' motoristas detectados. Preview:'));
          var prevTbl = mk('table',
            'width:100%;border-collapse:collapse;font-size:11px;' +
            'background:' + T.surface + ';border-radius:8px;overflow:hidden');
          var thr = mk('tr', 'background:rgba(15,23,42,.6);color:' + T.muted);
          ['Nome', 'Placa', 'Telefone', 'Hub'].forEach(function (h) {
            thr.appendChild(mk('th', 'padding:8px 10px;text-align:left;font-size:10px', h));
          });
          prevTbl.appendChild(thr);
          sample.forEach(function (s) {
            var tr = mk('tr', 'border-top:1px solid ' + T.border);
            ['nome', 'placa', 'tel', 'hub'].forEach(function (k) {
              tr.appendChild(mk('td',
                'padding:7px 10px;color:' + T.mutedHi +
                ';font-family:' + (k === 'placa' ? T.fMono : T.fUI),
                escapeHTML(s[k] || '—')));
            });
            prevTbl.appendChild(tr);
          });
          previewWrap.appendChild(prevTbl);
        } catch (e) {
          toast('Erro ao processar CSV: ' + e.message, 'err');
        }
      };
      reader.onerror = function () { toast('Erro ao ler arquivo', 'err'); };
      reader.readAsText(file, 'UTF-8');
    };

    var btnSalvar = mk('button', '', '<span>Salvar Agenda</span>');
    btnSalvar.style.cssText = 'background:' + T.grad + ';border:none;color:#fff;padding:8px 16px;' +
      'border-radius:8px;cursor:pointer;font-size:12px;font-weight:600';
    btnSalvar.onclick = function () {
      if (!parsedData) { toast('Importe um CSV primeiro', 'warn'); return; }
      if (Agenda.save(parsedData)) {
        toast('Agenda salva com ' + Object.keys(parsedData).length + ' motoristas', 'ok');
        refreshStatus();
        if (STATE.tab === 'MOTORISTAS') renderActiveTab();
      }
    };
    var btnFechar = mk('button', '', '<span>Fechar</span>');
    btnFechar.className = 'mlm_btn';
    btnFechar.onclick = modal.close;
    modal.footer.appendChild(btnFechar);
    modal.footer.appendChild(btnSalvar);
  }

  // ==========================================================================
  // EXPORTS
  // ==========================================================================
  function downloadBlob(blob, filename) {
    try {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    } catch (e) { toast('Falha ao baixar', 'err'); }
  }
  function safeName(s) {
    return String(s || 'export').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 80);
  }

  function csvExport(rows, columns, filename) {
    if (!rows || rows.length === 0) { toast('Nada para exportar', 'warn'); return; }
    try {
      var lines = [];
      lines.push(columns.map(function (c) { return escapeCSV(c.label || c.key); }).join(';'));
      rows.forEach(function (row) {
        var line = columns.map(function (c) {
          var v = row[c.key];
          if (v == null) return '';
          var s = String(v).replace(/<[^>]+>/g, '');
          return escapeCSV(s);
        }).join(';');
        lines.push(line);
      });
      var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      downloadBlob(blob, safeName(filename) + '.csv');
      toast('CSV exportado (' + rows.length + ' linhas)', 'ok');
    } catch (e) { toast('Erro ao exportar CSV', 'err'); }
  }

  function xlsxExport(rows, columns, filename, title) {
    if (!rows || rows.length === 0) { toast('Nada para exportar', 'warn'); return; }
    try {
      var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
        'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8">' +
        '<style>table{border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt}' +
        'th{background:#7c3aed;color:#fff;padding:6px 10px;border:1px solid #5b21b6;font-weight:bold}' +
        'td{padding:5px 10px;border:1px solid #cbd5e1}' +
        'tr:nth-child(even) td{background:#f8fafc}' +
        '.title{font-size:14pt;font-weight:bold;color:#1e1b4b;padding:8px 0}' +
        '.meta{font-size:9pt;color:#64748b;padding-bottom:10px}</style></head><body>';
      if (title) html += '<div class="title">' + escapeHTML(title) + '</div>';
      html += '<div class="meta">Gerado em ' + new Date().toLocaleString('pt-BR') +
              ' · ' + rows.length + ' linhas</div><table><thead><tr>';
      columns.forEach(function (c) {
        html += '<th>' + escapeHTML(c.label || c.key) + '</th>';
      });
      html += '</tr></thead><tbody>';
      rows.forEach(function (row) {
        html += '<tr>';
        columns.forEach(function (c) {
          var v = row[c.key];
          if (v == null) v = '';
          html += '<td>' + escapeHTML(String(v).replace(/<[^>]+>/g, '')) + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></body></html>';
      var blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      downloadBlob(blob, safeName(filename) + '.xls');
      toast('Excel exportado (' + rows.length + ' linhas)', 'ok');
    } catch (e) { toast('Erro ao exportar Excel', 'err'); }
  }

  function pdfExport(rows, columns, title) {
    if (!rows || rows.length === 0) { toast('Nada para exportar', 'warn'); return; }
    var html = '<table><thead><tr>';
    columns.forEach(function (c) { html += '<th>' + escapeHTML(c.label || c.key) + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (row) {
      html += '<tr>';
      columns.forEach(function (c) {
        var v = row[c.key];
        if (v == null) v = '';
        html += '<td>' + escapeHTML(String(v).replace(/<[^>]+>/g, '')) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    pdfExportHTML(html, title);
  }

  function pdfExportHTML(innerHTML, title) {
    try {
      var w = window.open('', '_blank', 'width=1100,height=820');
      if (!w) { toast('Permita pop-ups', 'err'); return; }
      var css = '@page{size:A4;margin:14mm}' +
        'body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;' +
        'margin:0;padding:14px;font-size:11pt;line-height:1.5}' +
        '.hdr{border-bottom:2px solid #7c3aed;padding-bottom:10px;margin-bottom:14px}' +
        '.hdr h1{margin:0 0 4px 0;font-size:16pt;color:#1e1b4b}' +
        '.hdr .meta{font-size:9pt;color:#64748b;font-family:Consolas,monospace}' +
        'table{width:100%;border-collapse:collapse;margin-top:10px;font-size:9.5pt}' +
        'thead th{background:#7c3aed;color:#fff;padding:7px 9px;text-align:left;' +
        'font-weight:600;font-size:9pt;text-transform:uppercase;border:1px solid #5b21b6}' +
        'tbody td{padding:6px 9px;border-bottom:1px solid #e2e8f0}' +
        'tbody tr:nth-child(even) td{background:#f8fafc}' +
        'pre{background:#f1f5f9;padding:10px;border-radius:6px;font-family:Consolas,monospace;' +
        'white-space:pre-wrap;font-size:10pt}' +
        '.foot{margin-top:18px;padding-top:8px;border-top:1px solid #cbd5e1;' +
        'font-size:8pt;color:#94a3b8;text-align:center}';
      var doc = '<!doctype html><html><head><meta charset="UTF-8"><title>' +
        escapeHTML(title || 'Export') + '</title><style>' + css + '</style></head><body>' +
        '<div class="hdr"><h1>' + escapeHTML(title || 'Monitor Last Mile') + '</h1>' +
        '<div class="meta">SSC: ' + escapeHTML(STATE.ssc) +
        ' · Data: ' + escapeHTML(STATE.date) +
        ' · Gerado: ' + new Date().toLocaleString('pt-BR') + '</div></div>' +
        innerHTML +
        '<div class="foot">Monitor Last Mile v' + APP.version + ' · Mercado Livre</div>' +
        '<script>setTimeout(function(){window.print();},350);<\/script></body></html>';
      w.document.open();
      w.document.write(doc);
      w.document.close();
      toast('PDF aberto em nova janela', 'ok');
    } catch (e) { toast('Erro ao gerar PDF', 'err'); }
  }

  // ==========================================================================
  // DRAG, ZOOM, MIN/MAX
  // ==========================================================================
  (function setupDrag() {
    var dragging = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;
    on(header, 'mousedown', function (e) {
      if (e.target.closest('button')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      var rect = panel.getBoundingClientRect();
      origLeft = rect.left; origTop = rect.top;
      panel.style.left = origLeft + 'px'; panel.style.top = origTop + 'px';
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
      header.style.cursor = 'grabbing';
      e.preventDefault();
    });
    on(document, 'mousemove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      var newLeft = origLeft + dx, newTop = origTop + dy;
      var rect = panel.getBoundingClientRect();
      newLeft = Math.max(-rect.width + 120, Math.min(window.innerWidth - 120, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - 60, newTop));
      panel.style.left = newLeft + 'px'; panel.style.top = newTop + 'px';
    });
    on(document, 'mouseup', function () {
      if (dragging) { dragging = false; header.style.cursor = 'move'; }
    });
  })();

  function applyScale() {
    panel.style.transform = 'scale(' + STATE.scale + ')';
    panel.style.transformOrigin = 'top left';
    Prefs.save();
  }
  on(btnZoomIn, 'click', function () {
    STATE.scale = Math.min(1.5, +(STATE.scale + 0.1).toFixed(2));
    applyScale();
  });
  on(btnZoomOut, 'click', function () {
    STATE.scale = Math.max(0.6, +(STATE.scale - 0.1).toFixed(2));
    applyScale();
  });

  var minimizedState = { collapsed: false, prevHeight: '' };
  on(btnMin, 'click', function () {
    if (!minimizedState.collapsed) {
      minimizedState.prevHeight = panel.style.maxHeight || '';
      $$('#mlm_srj3_panel > *').forEach(function (el) {
        if (el !== header) {
          el.dataset._mlmHidden = el.style.display || '';
          el.style.display = 'none';
        }
      });
      panel.style.maxHeight = 'none';
      minimizedState.collapsed = true;
    } else {
      $$('#mlm_srj3_panel > *').forEach(function (el) {
        if (el !== header && '_mlmHidden' in el.dataset) {
          el.style.display = el.dataset._mlmHidden;
          delete el.dataset._mlmHidden;
        }
      });
      panel.style.maxHeight = minimizedState.prevHeight || '88vh';
      minimizedState.collapsed = false;
    }
  });

  on(btnMax, 'click', function () {
    if (!STATE.maximized) {
      STATE.prevStyle = {
        width: panel.style.width, height: panel.style.height,
        maxHeight: panel.style.maxHeight, top: panel.style.top,
        left: panel.style.left, right: panel.style.right,
        bottom: panel.style.bottom, transform: panel.style.transform
      };
      panel.style.width = (window.innerWidth - 24) + 'px';
      panel.style.height = (window.innerHeight - 24) + 'px';
      panel.style.maxHeight = 'none';
      panel.style.top = '12px'; panel.style.left = '12px';
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
      panel.style.transform = 'scale(1)';
      STATE.maximized = true;
    } else {
      var p = STATE.prevStyle || {};
      panel.style.width = p.width || '1180px';
      panel.style.height = p.height || '';
      panel.style.maxHeight = p.maxHeight || '88vh';
      panel.style.top = p.top || '60px';
      panel.style.left = p.left || '60px';
      panel.style.right = p.right || '';
      panel.style.bottom = p.bottom || '';
      panel.style.transform = p.transform || ('scale(' + STATE.scale + ')');
      STATE.maximized = false;
    }
  });

  on(btnClose, 'click', function () { APP.destroy(); });

  // ==========================================================================
  // AUTO-REFRESH
  // ==========================================================================
  function setRefreshIcon() {
    refreshBtn.innerHTML = STATE.refreshPaused ? ICON.play : ICON.pause;
    refreshBtn.title = STATE.refreshPaused ? 'Retomar' : 'Pausar';
  }
function updateCountdown() {
    if (STATE.fetching || STATE.refreshLockedByFetch) {
      // doFetch já cuida do label — não sobrescreve
      return;
    }
    if (STATE.refreshPaused) {
      refreshLabel.textContent = 'Pausado';
      refreshLabel.style.color = T.warn;
      return;
    }
    var ms = STATE.nextRefreshAt - Date.now();
    if (ms <= 0) {
      refreshLabel.textContent = 'Atualizando...';
      refreshLabel.style.color = T.brand2;
      return;
    }
    var totalSec = Math.floor(ms / 1000);
    var m = Math.floor(totalSec / 60), s = totalSec % 60;
    refreshLabel.textContent = 'Próx: ' + pad(m) + ':' + pad(s);
    refreshLabel.style.color = totalSec < 30 ? T.warn : T.mutedHi;
  }
  function updateLastUpdate() {
    if (!STATE.lastFetch) { lastUpdate.textContent = 'Aguardando...'; return; }
    var sec = Math.floor((Date.now() - STATE.lastFetch) / 1000);
    if (sec < 60)        lastUpdate.textContent = 'Atualizado há ' + sec + 's';
    else if (sec < 3600) lastUpdate.textContent = 'Atualizado há ' + Math.floor(sec / 60) + ' min';
    else                 lastUpdate.textContent = 'Atualizado há +1h';
  }
  function scheduleNextRefresh() { STATE.nextRefreshAt = Date.now() + STATE.refreshMs; }

 function startRefreshTimer() {
    if (APP.timers.refresh) clearInterval(APP.timers.refresh);
    if (APP.timers.countdown) clearInterval(APP.timers.countdown);
    scheduleNextRefresh();
    APP.timers.refresh = setInterval(function () {
      if (STATE.refreshPaused) return;
      if (STATE.refreshLockedByFetch) return; // <- pausa enquanto fetch ativo
      if (STATE.fetching) return;             // <- redundância de segurança
      if (Date.now() >= STATE.nextRefreshAt) {
        doFetch(true);
        // NÃO reagenda aqui — quem reagenda é o próprio doFetch ao terminar
      }
    }, 1000);
    APP.timers.countdown = setInterval(function () {
      updateCountdown();
      updateLastUpdate();
    }, 1000);
  }

  on(refreshBtn, 'click', function () {
    STATE.refreshPaused = !STATE.refreshPaused;
    setRefreshIcon();
    if (!STATE.refreshPaused) scheduleNextRefresh();
    updateCountdown();
    Prefs.save();
    toast(STATE.refreshPaused ? 'Auto-refresh pausado' : 'Retomado', 'info');
  });
  setRefreshIcon();

  // ==========================================================================
  // DO FETCH — API REAL DO ML
  // ==========================================================================
  var USE_MOCK = false;  // <- agora usa API real!
  var API_URL = 'https://envios.adminml.com/logistics/api/monitoring/get-routes-list';

  // Extrai o ciclo do campo cluster (T4_CHP -> CHP, T27_PM1 -> PM1, "2873" -> SD)
  function parseCiclo(cluster) {
    if (!cluster) return '';
    var s = String(cluster).toUpperCase();
    if (s.indexOf('CHP') >= 0) return 'CHP';
    if (s.indexOf('AM1') >= 0) return 'AM1';
    if (s.indexOf('PM1') >= 0) return 'PM1';
    if (s.indexOf('SD')  >= 0) return 'SD';
    // Se só veio número, assume SD
    if (/^\d+$/.test(s)) return 'SD';
    return s;
  }

  // Normaliza status do ML para o padrão do painel
  function parseStatus(substatus, finalDate, status) {
    var st = String(status || '').toLowerCase().trim();
    var sub = String(substatus || '').toLowerCase().trim();

    // ============================================================
    // ENCERRADAS = rota finalizada
    // ============================================================
    if (st === 'closed' || st === 'close' || st === 'finished' ||
        st === 'completed' || st === 'finalized' || st === 'ended') {
      return 'Encerradas';
    }
    if (finalDate && finalDate > 0) return 'Encerradas';

    // ============================================================
    // A CAMINHO DO DESTINO (NÃO contabiliza)
    // status=planned  OU  substatus=on_way_destination_facility
    // ============================================================
    if (st === 'planned' || st === 'plan' || st === 'to_be_started' || st === 'pending') {
      return 'A caminho do destino';
    }
    if (sub === 'on_way_destination_facility' || sub === 'on_way_to_destination' ||
        sub === 'going_to_destination' || sub === 'in_transit') {
      return 'A caminho do destino';
    }

    // ============================================================
    // ABERTAS = rota em andamento (saiu pra entrega)
    // ============================================================
    if (st === 'active' || st === 'started' || st === 'in_progress' ||
        st === 'running' || st === 'on_route' || st === 'on_going') {
      return 'Abertas';
    }
    if (sub === 'return_to_station' || sub === 'returning' || sub === 'on_route' ||
        sub === 'delivering' || sub === 'started' || sub === 'active') {
      return 'Abertas';
    }

    return 'Abertas';
  }
  // Converte uma rota do JSON do ML pro formato interno do painel
  function mapRoute(r) {
    var c = r.counters || {};

    // DEBUG: loga primeiras 3 rotas
    if (window.__MLM_DEBUG_COUNT === undefined) window.__MLM_DEBUG_COUNT = 0;
    if (window.__MLM_DEBUG_COUNT < 3) {
      console.log('[MLM debug rota cruda]', {
        id: r.id, status: r.status, substatus: r.substatus,
        cluster: r.cluster, plate: r.plate, vehicle: r.vehicle,
        counters: r.counters, driver: r.driver
      });
      window.__MLM_DEBUG_COUNT++;
    }

    var statusMapeado = parseStatus(r.substatus, r.finalDate, r.status);

    return {
      routeId:  String(r.id || ''),
      shippingId: r.shippingId || r.id || '',
      driver:   (r.driver && r.driver.driverName) || '—',
      driverId: r.driver && r.driver.driverId,
      driverClaims: r.driver && r.driver.driverClaims,
      driverLoyalty: r.driver && r.driver.loyalty && r.driver.loyalty.name,
      carrier:  r.carrier || '—',
      carrierId: r.carrierId,
      cluster:  r.cluster || '',
      ciclo:    parseCiclo(r.cluster),
      cycle:    parseCiclo(r.cluster),
      tipo:     r.type || r.deliveryType || 'last_mile',
      modal:    r.vehicle || r.deliveryType || '',
      vehicle:  r.vehicle || '',
      origem:   r.facilityId || r.origin || '',
      agencia:  r.facilityId || '',
      placa:    r.plate || '',
      plate:    r.plate || '',
      distance: r.distance || 0,
      promise:  r.promise || '',
      hasAlert: !!r.hasAlert,
      isLineHaul: !!r.isLineHaul,
      warningsQuantity: r.warningsQuantity || 0,
      progressPercent: r.progressPercent || '0',

      // STATUS MAPEADO (importante!)
      status:    statusMapeado,
      substatus: r.substatus || '',
      _rawStatus: r.status,   // guarda o original pra debug

      // CONTADORES
      totalPkg:    c.total        || 0,
      delivered:   c.delivered    || 0,
      failed:      c.notDelivered || 0,
      pnr:         c.pnr          || 0,
      pending:     c.pending      || 0,
      pendentes:   c.pending      || 0,
      comerciais:  c.business     || 0,
      residenciais: c.residential || 0,
      bags:        c.totalBags    || 0,

      // Datas
      initDate:  r.initDate,
      finalDate: r.finalDate,

      // Detalhes (virão de outro endpoint depois)
      failures: [], pnrList: [], returns: [],
      failedIds: [], pnrIds: [],

      // Raw pra debug
      _raw: r
    };
  }

  // Busca uma página da API
  function fetchPage(page) {
    return fetch(API_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceCenterId: STATE.ssc,
        siteId: 'MLB',
        page: page,
        pageSize: 50,
        order_by: 'performance'
      })
    }).then(function (resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    });
  }

  // Busca TODAS as páginas (1, 2, 3, ...) até hasNext=false
  function fetchAllPages() {
    var allRoutes = [];
    function loop(page) {
      return fetchPage(page).then(function (data) {
        var routes = (data && data.routes) || [];
        allRoutes = allRoutes.concat(routes);
        var pag = data && data.pagination;
        if (pag && pag.hasNext && page < 20) {  // limite de segurança: 20 páginas
          return loop(page + 1);
        }
        return allRoutes;
      });
    }
    return loop(1);
  }

  // Mock simplificado de fallback (caso queira testar sem API)
  function getMockData() {
    var carriers = ['LogExpress', 'RotaSul', 'DECARGO', 'Envios Extra'];
    var nomes = ['João Silva', 'Maria Santos', 'Carlos Lima', 'Ana Costa',
                 'Pedro Souza', 'Lucas Pereira', 'Rafael Alves', 'Bruno Dias'];
    var ciclos = ['CHP', 'AM1', 'PM1', 'SD'];
    var routes = [];
    for (var i = 1; i <= 10; i++) {
      var total = 30 + Math.floor(Math.random() * 80);
      var failedN = Math.floor(Math.random() * 5);
      var delivered = Math.max(0, total - failedN - Math.floor(Math.random() * 10));
      routes.push({
        routeId: 'R-' + STATE.ssc + '-' + pad(i, 3),
        driver: nomes[i % nomes.length],
        carrier: carriers[i % carriers.length],
        cluster: 'T' + i + '_' + ciclos[i % ciclos.length],
        ciclo: ciclos[i % ciclos.length],
        tipo: 'driver',
        origem: STATE.ssc,
        status: i % 2 === 0 ? 'Encerradas' : 'Abertas',
        totalPkg: total, delivered: delivered, failed: failedN, pnr: 0,
        pendentes: total - delivered - failedN,
        failures: [], pnrList: [], returns: [], failedIds: [], pnrIds: []
      });
    }
    return routes;
  }

  function doFetch(silent) {
    if (STATE.fetching) {
      if (!silent) toast('Já existe uma atualização em andamento...', 'warn');
      return Promise.resolve();
    }
    STATE.fetching = true;
    STATE.loading = true;
    STATE.refreshLockedByFetch = true;

    var isFirstLoad = !STATE.routes || STATE.routes.length === 0;
    if (!silent && isFirstLoad) {
      dataArea.innerHTML = '';
      renderSkeleton();
    }
    try { refreshIcon.firstChild.classList.add('mlm_spin'); } catch (e) {}
    refreshLabel.textContent = 'Atualizando...';
    refreshLabel.style.color = T.brand2;

    var startedAt = Date.now();
    var promise;

    if (USE_MOCK) {
      promise = new Promise(function (resolve) {
        setTimeout(function () { resolve(getMockData()); }, silent ? 200 : 600);
      });
    } else {
      // API REAL: busca todas as páginas e mapeia
      promise = fetchAllPages().then(function (rawRoutes) {
        return rawRoutes.map(mapRoute);
      });
    }

    return promise.then(function (routes) {
      if (Array.isArray(routes)) {
        STATE.routes = routes;
        STATE.lastFetch = Date.now();
      } else {
        console.warn('[MLM] Resposta inválida — mantendo snapshot anterior');
      }
      STATE.loading = false;
      STATE.fetching = false;
      STATE.refreshLockedByFetch = false;
      try { refreshIcon.firstChild.classList.remove('mlm_spin'); } catch (e) {}
      renderKPIs();
      // SEMPRE re-renderiza os dados.
      // Se tem dropdown aberto, mostra banner DEPOIS pra usuário saber que houve update.
      renderDataOnly();
      if (STATE.ui.openDropdown) {
        showRefreshPending();
      }
      updateLastUpdate();
      scheduleNextRefresh();
      if (!silent) {
        toast('Dados carregados (' + (STATE.routes.length) + ' rotas · ' +
              (Date.now() - startedAt) + 'ms)', 'ok');
      }
    }).catch(function (err) {
      STATE.loading = false;
      STATE.fetching = false;
      STATE.refreshLockedByFetch = false;
      try { refreshIcon.firstChild.classList.remove('mlm_spin'); } catch (e) {}
      toast('Erro ao buscar dados: ' + err.message + ' (mantendo últimos dados)', 'err');
      scheduleNextRefresh();
      if (!STATE.routes || STATE.routes.length === 0) {
        dataArea.innerHTML = '';
        dataArea.appendChild(mk('div',
          'text-align:center;padding:40px 20px;color:' + T.err + ';font-size:13px',
          '⚠ Erro ao carregar dados.<br>' +
          '<span style="color:' + T.muted + ';font-size:11px;font-family:' + T.fMono + '">' +
          escapeHTML(String(err.message || err)) + '</span><br><br>' +
          '<span style="color:' + T.muted + ';font-size:10px">' +
          'Verifique se você está logado no ML e rodando o bookmarklet a partir de envios.adminml.com</span>'));
      }
    });
  }

  // ==========================================================================
  // BIND + INIT
  // ==========================================================================
  on(selSSC, 'change', function () {
    STATE.ssc = this.value; Prefs.save(); doFetch(false);
  });
  on(inpDate, 'change', function () {
    STATE.date = this.value; doFetch(false);
  });
  on(btnSearch, 'click', function () {
    doFetch(false); scheduleNextRefresh();
  });
  on(btnReport, 'click', function () { openReportModal(); });
  on(btnFechamento, 'click', function () { openFechamentoModal(); });
  on(btnAgenda, 'click', function () { openAgendaModal(); });

  // Fechar dropdowns ao clicar fora
  on(document, 'click', function () {
    var hadOpen = !!STATE.ui.openDropdown;
    document.querySelectorAll('[data-mlm-dropdown="1"]').forEach(function (d) {
      d.style.display = 'none';
    });
    STATE.ui.openDropdown = null;
    // Se fechou e tinha refresh pendente, atualiza agora
    if (hadOpen) {
      var pending = document.getElementById('mlm_srj3_refresh_pending');
      if (pending) {
        clearRefreshPending();
        renderDataOnly();
      }
    }
  });
  document.body.appendChild(panel);
  renderKPIs();
  renderActiveTab();
  startRefreshTimer();
  doFetch(false);

  setTimeout(function () {
    toast('Monitor Last Mile ' + STATE.ssc + ' v' + APP.version + ' iniciado', 'info');
  }, 300);

  console.log('%c[MLM SRJ3] %cv' + APP.version + ' inicializado',
    'background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold',
    'color:#7c3aed;font-weight:600');

})();     

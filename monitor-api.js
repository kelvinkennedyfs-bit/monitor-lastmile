/* ============================================================================
 * MONITOR LAST MILE — API REAL (Mercado Livre) v3.1
 * Substitui dados mock pelos endpoints reais do ML
 * ============================================================================ */
(function () {
  'use strict';

  var IS_ML = location.hostname.indexOf('adminml.com') >= 0 ||
              location.hostname.indexOf('mercadolibre.com') >= 0 ||
              location.hostname.indexOf('mercadolivre.com') >= 0;

  if (!IS_ML) {
    console.log('[MLM API] Fora do dominio ML - mantendo mock');
    return;
  }

  console.log('[MLM API] Detectado dominio ML - substituindo mock por API real');

  var API_BASE = 'https://envios.adminml.com/logistics/api/monitoring';
  var ENDPOINTS = {
    routes:  API_BASE + '/get-routes-list',
    metrics: API_BASE + '/get-routes-metrics-summaries'
  };

  function getCSRFToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
  }

  function detectCurrentSSC() {
    var match = location.href.match(/[?&](ssc|serviceCenterId)=([A-Z0-9]+)/i);
    if (match) return match[2];
    try {
      var keys = Object.keys(sessionStorage).concat(Object.keys(localStorage));
      for (var i = 0; i < keys.length; i++) {
        if (/ssc|serviceCenter/i.test(keys[i])) {
          var v = sessionStorage.getItem(keys[i]) || localStorage.getItem(keys[i]);
          if (v && /^[A-Z]{3}\d$/.test(v)) return v;
        }
      }
    } catch (e) {}
    return 'SRJ3';
  }

  function apiPost(url, body) {
    var headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    var csrf = getCSRFToken();
    if (csrf) headers['x-csrf-token'] = csrf;
    return fetch(url, {
      method: 'POST', credentials: 'include',
      headers: headers, body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function fetchAllRoutes(ssc) {
    var all = [];
    var maxPages = 20;
    function page(p) {
      return apiPost(ENDPOINTS.routes, {
        serviceCenterId: ssc, siteId: 'MLB',
        page: p, pageSize: 50, order_by: 'performance'
      }).then(function (data) {
        if (data && data.routes) all = all.concat(data.routes);
        if (data && data.pagination && data.pagination.hasNext && p < maxPages) {
          return page(p + 1);
        }
        return all;
      });
    }
    return page(1);
  }

  function fetchMetrics(ssc) {
    return apiPost(ENDPOINTS.metrics, {
      serviceCenterId: ssc, siteId: 'MLB', order_by: 'performance',
      names: [
        'routes_summary', 'routes_active_metric_summary',
        'routes_not_delivered_metric_summary', 'routes_mixed_metric_summary',
        'packages_pending_metric_summary', 'packages_delivered_metric_summary',
        'packages_not_delivered_metric_summary', 'packages_not_pickup_metric_summary',
        'packages_pickup_metric_summary', 'bag_metric_summary',
        'general_status_ok_metric', 'general_status_not_ok_metric',
        'general_status_inactive_metric'
      ]
    });
  }

  function mapRoute(r) {
    var counters = r.counters || {};
    var driver   = r.driver   || {};
    var vehicle  = r.vehicle  || {};
    var planned  = r.plannedRoute || {};

    var statusMap = {
      'planned': 'PLANNED', 'in_progress': 'IN_PROGRESS',
      'finished': 'FINISHED', 'inactive': 'INACTIVE'
    };

    return {
      routeId:   r.cluster || ('#' + r.id),
      shippingId: r.id,
      driver:    (driver.driverName && driver.driverName !== '-') ? driver.driverName : '—',
      carrier:   r.carrier || '—',
      carrierId: r.carrierId,
      cluster:   r.cluster,
      cycle:     planned.cycleName || '',
      agencia:   r.facilityId || '',
      vehicle:   vehicle.description || r.vehicleDescriptionForFilter || '',
      plate:     vehicle.license || '',
      totalPkg:  counters.total || 0,
      delivered: counters.delivered || 0,
      failed:    counters.notDelivered || 0,
      pnr:       counters.notPickup || 0,
      pending:   counters.pending || 0,
      status:    statusMap[r.status] || (r.status || '—').toUpperCase(),
      substatus: r.substatus || '',
      isLineHaul: !!r.isLineHaul,
      progressPercent: planned.progressPercent || '0',
      distance: planned.distance || 0,
      promise: planned.promise || '',
      warningsQuantity: r.warningsQuantity || 0,
      hasAlert: !!(r.delayedRoute && r.delayedRoute.alert),
      failures: [], pnrList: [], returns: [],
      failedIds: [], pnrIds: [],
      _raw: r
    };
  }

  function fetchRealData() {
    var ssc = (window.__MLM_SRJ3__ && window.__MLM_SRJ3__.STATE && window.__MLM_SRJ3__.STATE.ssc)
              || detectCurrentSSC();
    console.log('[MLM API] Buscando dados reais SSC:', ssc);
    return Promise.all([
      fetchAllRoutes(ssc).catch(function (err) {
        console.error('[MLM API] Erro rotas:', err); return [];
      }),
      fetchMetrics(ssc).catch(function (err) {
        console.error('[MLM API] Erro metricas:', err); return {};
      })
    ]).then(function (results) {
      var rawRoutes = results[0];
      var metrics   = results[1];
      console.log('[MLM API] Rotas:', rawRoutes.length, '| Metricas:', metrics);
      window.__MLM_METRICS__ = metrics;
      return rawRoutes.map(mapRoute);
    });
  }

  function injectData() {
    var app = window.__MLM_SRJ3__;
    if (!app || !app.STATE) {
      console.warn('[MLM API] STATE ainda nao exposto, aguardando...');
      return false;
    }

    fetchRealData().then(function (routes) {
      app.STATE.routes = routes;
      app.STATE.lastFetch = Date.now();

      // Injeta metricas globais
      if (window.__MLM_METRICS__) {
        app.STATE.metrics = window.__MLM_METRICS__;
      }

      if (typeof app.render === 'function') {
        app.render();
        console.log('[MLM API] ✓ Painel atualizado com', routes.length, 'rotas reais');
      } else {
        console.warn('[MLM API] app.render nao existe - rotas injetadas mas pode precisar clicar em refresh');
      }
    }).catch(function (err) {
      console.error('[MLM API] Falha total:', err);
    });
    return true;
  }

  function start() {
    var tries = 0;
    var maxTries = 100;
    function loop() {
      tries++;
      if (injectData()) {
        // Sucesso - agenda auto-refresh
        setInterval(injectData, 60000);
        console.log('[MLM API] Auto-refresh a cada 60s ativo');
        return;
      }
      if (tries < maxTries) {
        setTimeout(loop, 100);
      } else {
        console.error('[MLM API] STATE nunca exposto. Verifique se "APP.STATE = STATE" foi adicionado ao monitor.js');
      }
    }
    loop();
  }

  start();

  window.__MLM_API__ = {
    fetchRealData: fetchRealData,
    fetchAllRoutes: fetchAllRoutes,
    fetchMetrics: fetchMetrics,
    injectData: injectData,
    detectCurrentSSC: detectCurrentSSC
  };
})();
/* Hyperions MC — hyperionsmc.com
   Interactividad de la landing: copiar IP, barra sticky y stats en vivo.
   Seguridad: los datos externos solo se escriben con textContent (nunca innerHTML)
   y los números se validan y acotan antes de usarse. */
(() => {
  'use strict';

  const SERVER_IP = 'hyperionsmc.com';
  const API_URL = 'https://api.mcsrvstat.us/3/' + SERVER_IP;
  const REFRESH_MS = 60000;
  const MAX_PLAYERS_CAP = 100000;

  const $ = (id) => document.getElementById(id);
  const els = {
    stickyBar: $('sticky-bar'),
    statCount: $('stat-count'),
    statMax: $('stat-max'),
    statBar: $('stat-bar'),
    statusPill: $('status-pill'),
    statusText: $('status-text'),
    versionLabel: $('version-label'),
  };

  /* --- Copiar IP (con feedback y fallback sin Clipboard API) --- */
  const copyButtons = [
    { btn: $('hero-copy-btn'), label: $('hero-copy-label'), original: 'Copiar IP' },
    { btn: $('sticky-copy-btn'), label: $('sticky-copy-label'), original: 'Copiar' },
    { btn: $('join-btn'), label: $('join-label'), original: '¡Únete ya!' },
  ];
  let copyTimer = 0;

  function showCopied() {
    copyButtons.forEach(({ btn, label }) => {
      if (!btn || !label) return;
      btn.classList.add('is-copied');
      label.textContent = '¡Copiada!';
    });
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyButtons.forEach(({ btn, label, original }) => {
        if (!btn || !label) return;
        btn.classList.remove('is-copied');
        label.textContent = original;
      });
    }, 1800);
  }

  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'visually-hidden';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* sin soporte: el usuario copia a mano */ }
    ta.remove();
  }

  function copyIp() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SERVER_IP).then(showCopied, () => { legacyCopy(SERVER_IP); showCopied(); });
    } else {
      legacyCopy(SERVER_IP);
      showCopied();
    }
  }
  copyButtons.forEach(({ btn }) => { if (btn) btn.addEventListener('click', copyIp); });

  /* --- Barra sticky al hacer scroll --- */
  function onScroll() {
    if (els.stickyBar) els.stickyBar.classList.toggle('is-visible', window.scrollY > 560);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Contador animado + barra de progreso --- */
  let rafId = 0;
  function renderCount(value, max) {
    if (els.statCount) els.statCount.textContent = String(value);
    if (els.statBar) {
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      els.statBar.style.width = pct.toFixed(1) + '%';
    }
  }

  function animateCount(target, max) {
    cancelAnimationFrame(rafId);
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      renderCount(Math.round(eased * target), max);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  /* --- Estados del badge --- */
  function setStatus(stateClass, text) {
    if (els.statusPill) {
      els.statusPill.classList.remove('is-online', 'is-offline', 'is-unknown');
      els.statusPill.classList.add(stateClass);
    }
    if (els.statusText) els.statusText.textContent = text;
  }

  /* --- Stats en vivo (api.mcsrvstat.us) con validación estricta --- */
  function toBoundedInt(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  async function fetchStats() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(API_URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (data && data.online === true) {
        const boundedMax = toBoundedInt(data.players && data.players.max, 1, MAX_PLAYERS_CAP);
        const max = boundedMax === null ? 500 : boundedMax;
        const boundedOnline = toBoundedInt(data.players && data.players.online, 0, max);
        const online = boundedOnline === null ? 0 : boundedOnline;

        if (els.statMax) els.statMax.textContent = String(max);
        setStatus('is-online', 'SERVIDOR EN LÍNEA');
        animateCount(online, max);

        const version = typeof data.version === 'string' ? data.version.slice(0, 40) : '';
        if (version && els.versionLabel) els.versionLabel.textContent = 'Java ' + version + ' · Bedrock';
      } else {
        cancelAnimationFrame(rafId);
        setStatus('is-offline', 'SERVIDOR OFFLINE');
        renderCount(0, 1);
      }
    } catch (_err) {
      cancelAnimationFrame(rafId);
      setStatus('is-unknown', 'ESTADO DESCONOCIDO');
      if (els.statCount) els.statCount.textContent = '—';
      if (els.statBar) els.statBar.style.width = '0%';
    } finally {
      clearTimeout(timeout);
    }
  }

  fetchStats();
  setInterval(fetchStats, REFRESH_MS);
})();

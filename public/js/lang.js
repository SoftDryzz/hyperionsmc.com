/* Hyperions MC — detección y cambio de idioma (ES en raíz, EN bajo /en/).
   Reglas: la preferencia manual (localStorage) manda; sin preferencia,
   navegador en español → ES y cualquier otro idioma o desconocido → EN (inclusión).
   Se carga SIN defer en el <head> para redirigir antes del primer pintado. */
(() => {
  'use strict';

  const MAP = {
    '/': '/en/',
    '/como-entrar/': '/en/how-to-join/',
    '/rangos/': '/en/ranks/',
    '/reglas/': '/en/rules/',
    '/soporte/': '/en/support/',
    '/tienda/': '/en/store/',
  };
  const REV = {};
  Object.keys(MAP).forEach((k) => { REV[MAP[k]] = k; });

  let path = location.pathname;
  if (!path.endsWith('/')) path += '/';
  const isEn = path === '/en/' || path.startsWith('/en/');
  const KEY = 'hy-lang';

  let pref = null;
  try { pref = localStorage.getItem(KEY); } catch (e) { /* almacenamiento bloqueado */ }

  function counterpart() {
    return isEn ? (REV[path] || '/') : (MAP[path] || '/en/');
  }

  /* Redirección automática (respeta la preferencia manual si existe) */
  if (pref === 'es' && isEn) { location.replace(counterpart()); return; }
  if (pref === 'en' && !isEn) { location.replace(counterpart()); return; }
  if (!pref && !isEn) {
    const nav = (navigator.language || '').toLowerCase();
    if (!nav.startsWith('es')) { location.replace(counterpart()); return; }
  }

  /* Conmutador manual ES/EN de la cabecera */
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('lang-switch');
    if (!btn) return;
    btn.addEventListener('click', () => {
      try { localStorage.setItem(KEY, isEn ? 'es' : 'en'); } catch (e) { /* sin persistencia */ }
      location.href = counterpart();
    });
  });
})();

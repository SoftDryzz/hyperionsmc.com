/* Hyperions MC — aplica la oferta de lanzamiento a los precios mensuales
   de la comparativa de rangos (precio original tachado + precio rebajado).
   Seguridad: DOM creado con createElement/textContent, nunca innerHTML. */
(() => {
  'use strict';

  const S = window.HY_SALE;
  if (!S || !S.active()) return;

  const EN = document.documentElement.lang === 'en';

  document.querySelectorAll('.rg-price').forEach((el) => {
    if (el.dataset.saleDone) return;
    const orig = el.textContent.trim();
    const num = parseFloat(orig.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!Number.isFinite(num)) return;

    const sale = Math.round(num * (1 - S.monthly) * 100) / 100;
    const s = sale.toFixed(2);
    const saleTxt = EN ? '€' + s + '/MO' : s.replace('.', ',') + ' €/MES';

    el.textContent = '';
    const old = document.createElement('span');
    old.className = 'rg-price__old';
    old.textContent = orig;
    const now = document.createElement('span');
    now.className = 'rg-price__new';
    now.textContent = saleTxt;
    el.append(old, ' ', now);
    el.dataset.saleDone = '1';
  });
})();

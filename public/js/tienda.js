/* Hyperions MC — hyperionsmc.com/tienda/
   Selector Mensual/Permanente + oferta de lanzamiento con cuenta atrás.
   Seguridad: solo se escribe con textContent (nunca innerHTML). */
(() => {
  'use strict';

  /* Precios mensuales base; el permanente equivale a 3,7 meses. */
  const MONTHLY = { hero: 4.99, demigod: 9.99, titan: 19.99, olympian: 34.99 };
  const PERM_FACTOR = 3.7;

  /* Oferta de lanzamiento: la configuración vive en /js/sale.js (window.HY_SALE).
     Al expirar, la web vuelve sola a los precios normales. */
  const SALE = window.HY_SALE || { end: 0, perm: 0, monthly: 0 };
  const saleActive = () => Date.now() < SALE.end;

  /* Textos según el idioma de la página (lang del <html>) */
  const EN = document.documentElement.lang === 'en';
  const TXT = {
    perMonth: EN ? 'per month' : 'al mes',
    oneTime: EN ? 'one-time · yours forever' : 'pago único · para siempre',
    savingsPerm: EN ? 'Equivalent to just 3.7 months — and it’s yours forever.' : 'Equivale a solo 3,7 meses — y es tuyo para siempre.',
    savingsMonthly: EN ? 'Switch to Permanent and make it yours forever.' : 'Cambia a Permanente y hazlo tuyo para siempre.',
  };

  const $ = (id) => document.getElementById(id);
  const btnMensual = $('td-btn-mensual');
  const btnPerm = $('td-btn-perm');
  const savingsNote = $('td-savings-note');
  const saleBox = $('td-sale');
  const saleTimer = $('td-sale-timer');
  const priceEls = {
    hero: $('td-price-hero'),
    demigod: $('td-price-demigod'),
    titan: $('td-price-titan'),
    olympian: $('td-price-olympian'),
  };
  const origEls = {
    hero: $('td-orig-hero'),
    demigod: $('td-orig-demigod'),
    titan: $('td-orig-titan'),
    olympian: $('td-orig-olympian'),
  };
  /* Solo las 4 tarjetas de rango: la Protección T5 también lleva
     .td-precio-nota pero es pago único fijo y no debe verse tocada. */
  const priceNotes = document.querySelectorAll('.td-precio-nota--rango');
  const mensualLines = document.querySelectorAll('.td-precio-mensual');

  /* Cada rango son dos paquetes distintos en Tebex: el boton cambia con el selector. */
  const PKG = {
    hero:     { perm: 7564089, mensual: 7564114 },
    demigod:  { perm: 7564092, mensual: 7564116 },
    titan:    { perm: 7564096, mensual: 7564121 },
    olympian: { perm: 7564104, mensual: 7564122 },
  };
  const TEBEX = 'https://hyperionsmc.tebex.store/package/';
  const buyEls = {
    hero: $('td-buy-hero'),
    demigod: $('td-buy-demigod'),
    titan: $('td-buy-titan'),
    olympian: $('td-buy-olympian'),
  };

  if (!btnMensual || !btnPerm) return;

  let permState = true; /* permanente por defecto, como el HTML estático */

  function fmt(n) {
    const s = n.toFixed(2);
    return EN ? '€' + s : s.replace('.', ',') + ' €';
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function render(perm) {
    permState = perm;
    const onSale = saleActive();
    const off = perm ? SALE.perm : SALE.monthly;

    Object.keys(MONTHLY).forEach((key) => {
      const base = perm ? round2(MONTHLY[key] * PERM_FACTOR) : MONTHLY[key];
      const final = onSale ? round2(base * (1 - off)) : base;
      if (priceEls[key]) priceEls[key].textContent = fmt(final);
      if (buyEls[key]) buyEls[key].href = TEBEX + (perm ? PKG[key].perm : PKG[key].mensual);
      const orig = origEls[key];
      if (orig) {
        if (onSale) { orig.textContent = fmt(base); orig.hidden = false; }
        else { orig.hidden = true; }
      }
    });

    const note = perm ? TXT.oneTime : TXT.perMonth;
    priceNotes.forEach((el) => { el.textContent = note; });

    /* La linea "o X al mes" sobra cuando el precio grande ya es el mensual. */
    mensualLines.forEach((el) => { el.hidden = !perm; });

    if (savingsNote) {
      savingsNote.textContent = perm ? TXT.savingsPerm : TXT.savingsMonthly;
    }

    btnPerm.classList.toggle('is-active', perm);
    btnMensual.classList.toggle('is-active', !perm);
    btnPerm.setAttribute('aria-pressed', String(perm));
    btnMensual.setAttribute('aria-pressed', String(!perm));
  }

  /* --- Cuenta atrás de la oferta --- */
  let timerId = 0;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    if (!saleBox) return;
    const ms = SALE.end - Date.now();
    if (ms <= 0) {
      saleBox.hidden = true;
      clearInterval(timerId);
      render(permState); /* vuelve a precios normales */
      return;
    }
    saleBox.hidden = false;
    const total = Math.floor(ms / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (saleTimer) saleTimer.textContent = d + 'd ' + pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  if (saleActive()) {
    tick();
    timerId = setInterval(tick, 1000);
  }

  render(true);

  btnMensual.addEventListener('click', () => render(false));
  btnPerm.addEventListener('click', () => render(true));
})();

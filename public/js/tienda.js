/* Hyperions MC — hyperionsmc.com/tienda/
   Selector Mensual/Permanente de la tienda de rangos.
   Seguridad: solo se escribe con textContent (nunca innerHTML). */
(() => {
  'use strict';

  /* Precios mensuales base; el permanente equivale a 3,7 meses. */
  const MONTHLY = { hero: 4.99, demigod: 9.99, titan: 19.99, olympian: 34.99 };
  const PERM_FACTOR = 3.7;

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
  const priceEls = {
    hero: $('td-price-hero'),
    demigod: $('td-price-demigod'),
    titan: $('td-price-titan'),
    olympian: $('td-price-olympian'),
  };
  const priceNotes = document.querySelectorAll('.td-precio-nota');

  if (!btnMensual || !btnPerm) return;

  function fmt(n) {
    const s = n.toFixed(2);
    return EN ? '€' + s : s.replace('.', ',') + ' €';
  }

  function render(perm) {
    Object.keys(MONTHLY).forEach((key) => {
      const el = priceEls[key];
      if (!el) return;
      const price = perm ? Math.round(MONTHLY[key] * PERM_FACTOR * 100) / 100 : MONTHLY[key];
      el.textContent = fmt(price);
    });

    const note = perm ? TXT.oneTime : TXT.perMonth;
    priceNotes.forEach((el) => { el.textContent = note; });

    if (savingsNote) {
      savingsNote.textContent = perm ? TXT.savingsPerm : TXT.savingsMonthly;
    }

    btnPerm.classList.toggle('is-active', perm);
    btnMensual.classList.toggle('is-active', !perm);
    btnPerm.setAttribute('aria-pressed', String(perm));
    btnMensual.setAttribute('aria-pressed', String(!perm));
  }

  btnMensual.addEventListener('click', () => render(false));
  btnPerm.addEventListener('click', () => render(true));
})();

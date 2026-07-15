/* Hyperions MC — hyperionsmc.com/tienda/
   Selector Mensual/Permanente de la tienda de rangos.
   Seguridad: solo se escribe con textContent (nunca innerHTML). */
(() => {
  'use strict';

  /* Precios mensuales base; el permanente equivale a 3,7 meses. */
  const MONTHLY = { hero: 4.99, demigod: 9.99, titan: 19.99, olympian: 34.99 };
  const PERM_FACTOR = 3.7;

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
    return n.toFixed(2).replace('.', ',') + ' €';
  }

  function render(perm) {
    Object.keys(MONTHLY).forEach((key) => {
      const el = priceEls[key];
      if (!el) return;
      const price = perm ? Math.round(MONTHLY[key] * PERM_FACTOR * 100) / 100 : MONTHLY[key];
      el.textContent = fmt(price);
    });

    const note = perm ? 'pago único · para siempre' : 'al mes';
    priceNotes.forEach((el) => { el.textContent = note; });

    if (savingsNote) {
      savingsNote.textContent = perm
        ? 'Equivale a solo 3,7 meses — y es tuyo para siempre.'
        : 'Cambia a Permanente y hazlo tuyo para siempre.';
    }

    btnPerm.classList.toggle('is-active', perm);
    btnMensual.classList.toggle('is-active', !perm);
    btnPerm.setAttribute('aria-pressed', String(perm));
    btnMensual.setAttribute('aria-pressed', String(!perm));
  }

  btnMensual.addEventListener('click', () => render(false));
  btnPerm.addEventListener('click', () => render(true));
})();

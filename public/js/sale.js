/* Hyperions MC — configuración compartida de la oferta de lanzamiento.
   Cambiar la fecha o los descuentos AQUÍ afecta a toda la web
   (tienda, rangos y los anuncios de portada). */
window.HY_SALE = {
  end: Date.parse('2026-08-17T23:59:59+02:00'),
  perm: 0.20,     /* descuento en pagos permanentes */
  monthly: 0.15,  /* descuento en pagos mensuales */
};
window.HY_SALE.active = function () { return Date.now() < this.end; };

/* Al expirar la oferta, oculta automáticamente todos los anuncios [data-sale] */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.HY_SALE.active()) {
    document.querySelectorAll('[data-sale]').forEach((el) => { el.hidden = true; });
  }
});

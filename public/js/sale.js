/* Hyperions MC — configuración compartida de la oferta de lanzamiento.
   Cambiar la fecha o los descuentos AQUÍ afecta a toda la web
   (tienda, rangos y los anuncios de portada). */
window.HY_SALE = {
  /* En Tebex la oferta esta configurada con dos fechas de fin distintas:
     rangos permanentes (-20%) hasta 25/08/2026 10:34 CEST, rangos mensuales
     (-15%) hasta 25/08/2026 10:36 CEST. Como aqui solo hay una cuenta atras
     para las dos, usamos la mas temprana (10:34): al reves habria un par de
     minutos en los que la web seguiria anunciando el descuento permanente
     ya expirado en Tebex, lo que perjudicaria al cliente. */
  end: Date.parse('2026-08-25T10:34:00+02:00'),
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

# Corrección de datos de rangos y ampliación de la tienda

**Fecha:** 2026-07-26
**Estado:** aprobado, pendiente de plan de implementación

## Problema

La web anuncia perks que el servidor no entrega. Los datos de rangos se
escribieron antes de que la base de datos de permisos quedara fija y nunca se
volvieron a comprobar. Los errores concretos:

- `/enderchest` figura como perk de Demigod cuando es de Titan.
- `/fly` no aparece en ninguna parte pese a ser el perk estrella de Titan.
- `/back` figura como perk de Hero cuando lo tiene todo el mundo gratis.
- La sección «PRÓXIMAMENTE» lista como futuros doce perks que ya están activos.
- Se anuncian «vaults privados» y «chest shops», que están descartados.

A esto se suman dos problemas de credibilidad. La portada dice «miles de
jugadores» mientras el contador en vivo de la misma página muestra 0/500, y se
afirma «sin pay-to-win» en un catálogo que vende un multiplicador ×2 al dinero.

Además faltan dos categorías de producto que ya existen en el servidor: las
llaves de cajas sueltas y los Dracmas en packs escalados.

## Fuente de verdad

Los datos de esta sección están verificados contra la base de datos de permisos
en producción. Ninguna cifra de la web puede contradecirlos.

### Tabla por rango

Todos los rangos son acumulativos: cada uno incluye todo lo del anterior.

| | Mortal | Hero | Demigod | Titan | Olympian |
|---|---|---|---|---|---|
| Homes | 1 | 5 | 10 | 20 | 40 |
| Multiplicador $ y XP | ×1.0 | ×1.1 | ×1.25 | ×1.5 | ×2.0 |
| Protecciones | 3 | 6 | 10 | 15 | 20 |
| Llaves cada 30 días | — | 1 Common | 2 Common | 1 Rare | 1 Epic |
| Anuncios en subasta | 3 | 5 | 8 | 12 | 20 |
| Kits exclusivos | — | 2 | 3 | 6 | 8 |
| EnderChest premium | — | — | — | `/ec` ampliado · 54 slots | `/ec` ampliado · 2 páginas |

`/back` pasa a la fila de comandos esenciales, que tiene marca en las cinco
columnas.

### Comandos que desbloquea cada rango

- **Hero** — `/hat`, `/afk`, teletransporte aleatorio sin espera ni cooldown,
  cosméticos, lista de amigos ampliada, recompensa diaria.
- **Demigod** — `/feed`, `/near`, `/nick` (con colores), `/tpahere`,
  teletransporte instantáneo (sin cuenta atrás).
- **Titan** — `/fly`, `/heal`, `/repair` (item y armadura), `/workbench`,
  `/tptoggle`, `/ec` ampliado a 54 slots, inmunidad al AFK-kick.
- **Olympian** — `/anvil`, `/skull`, `/condense`, `/ping`, prefijo
  personalizado, 2ª página del EnderChest.

El teletransporte de Hero y el de Demigod son perks distintos: Hero quita la
espera y el cooldown del teletransporte aleatorio; Demigod quita la cuenta atrás
de todos los teletransportes.

### Perks eliminados

Fuera de la web por completo: **vaults privados** y **chest shops**. Están
descartados y no van a existir.

### Único perk pendiente

**Cola prioritaria** (Demigod en adelante) es lo único que conserva la marca
PRÓXIMAMENTE. El resto de la sección desaparece.

## Precios

### Rangos

Se venden en dos formatos. El permanente se calcula como `mensual × 3,7`, la
fórmula que ya está en producción en `js/tienda.js`.

| Rango | Mensual | Permanente |
|---|---|---|
| Hero | 4,99 € | 18,46 € |
| Demigod | 9,99 € | 36,96 € |
| Titan | 19,99 € | 73,96 € |
| Olympian | 34,99 € | 129,46 € |

La oferta de lanzamiento (−50% permanente, −40% mensual, hasta el 17/08) se
aplica **solo a los rangos**.

### Llaves de cajas

Cinco tiers de menor a mayor: Common, Rare, Epic, Legendary, Mythic. Se venden
en packs de 1, 5 y 10, con −10% en el pack de 5 y −20% en el de 10.

| Tier | 1 llave | Pack 5 | Pack 10 | In-game |
|---|---|---|---|---|
| Common | 1,40 € | 6,30 € | 11,20 € | no se vende |
| Rare | 3,50 € | 15,75 € | 28,00 € | 5 💎 |
| Epic | 7,00 € | 31,50 € | 56,00 € | 10 💎 |
| Legendary | 14,00 € | 63,00 € | 112,00 € | 15 💎 |
| Mythic | 28,00 € | 126,00 € | 224,00 € | 30 💎 |

El precio en euros es deliberadamente algo más alto que la vía de los Dracmas.
El objetivo es que comprar Dracmas salga a cuenta: en Legendary y Mythic el
ahorro es del 25% a tasa base y llega al 47% con el pack de 100 Dracmas. En Rare
y Epic las dos vías cuestan lo mismo a tasa base y el ahorro solo aparece al
comprar volumen.

La Common no se vende in-game. Se obtiene con el rango (Hero 1 y Demigod 2 cada
30 días) o suelta en euros.

### Dracmas

Moneda premium a **0,70 €/💎**, la tasa que ya usa la tienda. Packs con bonus
por volumen:

| Pack | Precio | Bonus | €/💎 |
|---|---|---|---|
| 10 💎 | 7,00 € | — | 0,70 € |
| 25 💎 | 15,75 € | +10% | 0,63 € |
| 50 💎 | 28,00 € | +20% | 0,56 € |
| 100 💎 | 49,00 € | +30% | 0,49 € |

El pack de 50 baja de los 35,00 € actuales a 28,00 €, así que los 35,00 €
aparecen tachados como precio anterior.

Ni las llaves ni los Dracmas ni la Protección T5 entran en la oferta de
lanzamiento. Rebajar el pago directo en euros anularía el incentivo hacia los
Dracmas.

### Protección T5

Se queda como está: 22,00 €, o 31 💎 in-game. Su precio en Dracmas sigue siendo
coherente con la tasa y con la escalera de llaves — la llave más cara (30 💎)
queda justo por debajo.

## Cambios de credibilidad

| Ubicación | Texto actual | Cambio |
|---|---|---|
| `index.html:95` | «Miles de supervivientes ya escriben su leyenda» | Comunidad nueva: entrar ahora significa elegir sitio antes que nadie |
| `index.html:153` | «Miles de jugadores, clanes y alianzas activas» | Comunidad pequeña y cercana, staff que te conoce por el nick |
| `index.html:162` | «sin pay-to-win» | «Sin ventajas de combate: lo que se vende es comodidad y progresión, nunca poder en PvP» |
| `tienda/index.html:7` | meta «sin pay-to-win» | Misma reformulación |
| `en/store/index.html:7` | meta «no pay-to-win» | Misma reformulación |

Las menciones de «un mundo que nunca duerme» y «Un Olimpo que nunca duerme»
también se revisan: conviven en la misma pantalla que un contador a 0.

La identidad mitológica griega se mantiene íntegra. Solo cambia lo falsificable.

## Contenido nuevo

**Java y Bedrock** pasan a ser visibles como diferenciador en portada y tienda,
no solo un badge discreto. El servidor acepta Java 1.21.x y Bedrock.

**Nota post-compra** en la tienda: tras comprar hay que entrar al servidor una
vez para que se aplique. Evita el ticket de «he pagado y no me ha llegado».

## Diseño técnico

### Estructura de la tienda

Seis bloques en este orden:

1. Hero de la página.
2. Rangos — selector mensual/permanente, banner de oferta y cuatro tarjetas.
3. Llaves de cajas — cinco tarjetas, una por tier, con tres opciones de pack.
4. Dracmas — cuatro packs.
5. Protección T5 — tarjeta existente, sin cambios.
6. Notas, incluida la nota post-compra.

Cada tarjeta de llave muestra las dos vías de compra, siguiendo el patrón que ya
usa la tarjeta de Protección («también comprable in-game por 31 💎»). Enseñar el
ahorro convierte el recargo en argumento de venta.

### Precios estáticos frente a precios en JS

Solo los rangos necesitan JavaScript, porque tienen selector mensual/permanente
y descuento con cuenta atrás. Las llaves, los Dracmas y la Protección tienen
precio fijo, así que van en HTML plano.

Esto evita añadir estado innecesario: sin JS no hay parpadeo al cargar, el SEO
es perfecto y no aparecen nuevas superficies de CSP. `js/tienda.js` sigue
gestionando únicamente los cuatro precios de rango.

### Corrección de CSP

`public/tienda/index.html:206-208` usa atributos `style` inline. El Caddyfile
declara `style-src 'self'` sin `unsafe-inline`, así que el navegador los
descarta en producción: ese encabezado está sin estilar en la web publicada
ahora mismo. Se sustituyen por clases en `css/tienda.css`.

Es un fallo que solo se manifiesta tras desplegar, porque el servidor local no
envía cabeceras CSP. Ninguna plantilla nueva puede introducir `style` inline.

### Destacar `/fly`

`/fly` recibe tratamiento visual propio, no una fila más:

- En la comparativa, clase `.rg-tr--star` con fondo teñido, borde dorado y badge.
- En la tarjeta Titan de la tienda, primera posición con estrella, y `/ec`
  ampliado justo debajo como segundo argumento.

Es el perk que decide la comparación entre Demigod y Titan, así que tiene que
verse antes que nada.

### Seguridad

Se mantienen las reglas del repositorio: nada de `innerHTML`, solo `textContent`
y `createElement`, y ningún estilo ni script inline.

## Alcance

Doce páginas en total, seis en español y seis en inglés. Los archivos afectados:

**Español**
- `public/index.html` — copy de credibilidad y visibilidad Java/Bedrock
- `public/rangos/index.html` — tabla completa reescrita
- `public/tienda/index.html` — tarjetas corregidas, llaves, Dracmas, nota
  post-compra, corrección de estilos inline

**Inglés**
- `public/en/index.html`
- `public/en/ranks/index.html`
- `public/en/store/index.html` — parte de 48 líneas de retraso respecto a la
  versión española: le faltan las tarjetas de Dracmas y Protección

**Estilos**
- `public/css/rangos.css` — fila destacada de `/fly`
- `public/css/tienda.css` — rejilla de llaves, packs de Dracmas, clases que
  sustituyen a los estilos inline

Todo el texto de cara al jugador va en español en la web española y en inglés en
la inglesa. Los nombres de comandos y de rango se quedan en inglés en ambas.

## Riesgo conocido

Cada perk vive escrito a mano en cuatro sitios: tabla ES, tarjeta ES, tabla EN y
tarjeta EN. Esa duplicación es la causa raíz del error de `/enderchest` y va a
seguir ahí después de este trabajo.

No se resuelve ahora porque la alternativa —renderizar el catálogo con
JavaScript— sacrificaría el SEO y el funcionamiento sin JS en un sitio estático
de marketing, que es precisamente su punto fuerte. La mitigación es parcial: los
precios de rango ya están centralizados en `js/tienda.js` y este documento queda
como referencia única de los datos verificados.

Si el catálogo vuelve a crecer, merece la pena reconsiderar una generación
estática en tiempo de build.

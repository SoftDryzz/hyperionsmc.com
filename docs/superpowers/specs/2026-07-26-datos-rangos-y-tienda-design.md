# Corrección de datos de rangos y ampliación de la tienda

**Fecha:** 2026-07-26
**Estado:** aprobado, pendiente de plan de implementación

## Problema

La web anuncia perks que el servidor no entrega. Los datos de rangos se
escribieron antes de que la base de datos de permisos quedara fija y nunca se
volvieron a comprobar. Los errores concretos:

- `/enderchest` figura como perk de Demigod cuando es de Titan.
- `/fly` no aparece en ninguna parte pese a ser el perk estrella de Titan.
- La sección «PRÓXIMAMENTE» marca como futuros perks que ya están activos.
- Se anuncian «vaults privados» y «chest shops», que están descartados.
- Se venden cuatro perks que el servidor no entrega: cosméticos y prefijo
  personalizado no existen para ningún rango, `/friends` sigue en desarrollo, y
  la recompensa diaria figura como perk de Hero siendo gratuita para todos.

A esto se suman dos problemas de credibilidad. La portada dice «miles de
jugadores» mientras el contador en vivo de la misma página muestra 0/500, y se
afirma «sin pay-to-win» en un catálogo que vende un multiplicador ×2 al dinero.

Además faltan dos categorías de producto que ya existen en el servidor: las
llaves de cajas sueltas y los Dracmas en packs escalados.

## Fuente de verdad

Los datos de esta sección están verificados contra la base de datos de permisos
en producción. Ninguna cifra de la web puede contradecirlos.

Existe un segundo documento, `Rangos-Hyperions.md`, gestionado junto a LuckPerms.
No son intercambiables y conviene saber cuál manda en cada cosa:

| Para esto | Manda |
|---|---|
| Nodos de permiso, plugins, en qué rango se desbloquea un comando | `Rangos-Hyperions.md` |
| Cifras por rango (homes, protecciones, llaves, kits, multiplicador) | Este spec |

El motivo es que las cifras de `Rangos-Hyperions.md` han derivado: dice
protecciones «2 → 5» cuando la auditoría da 3/6/10/15/20, y llaves «1 → 4/mes»
cuando el reparto real es 1 Common / 2 Common / 1 Rare / 1 Epic. Su tabla de
comandos y sus nodos de permiso, en cambio, siguen siendo la referencia buena.

Esa divergencia entre dos documentos que se contradicen es la razón de ser del
check automático descrito al final.

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

### Gratis para todos los rangos

Estas filas van marcadas en las cinco columnas, Mortal incluido. No son perks de
pago y anunciarlas como tales es el error que este trabajo corrige:

- Comandos esenciales (15) — `/spawn`, `/tpa`, `/msg`, `/pay`, `/warp`,
  `/balance` y demás.
- Recompensa diaria — premio por conectarte cada día. ProRewards, `todos`.

### Comandos que desbloquea cada rango

- **Hero** — `/hat`, `/back`, `/afk`, teletransporte aleatorio sin espera ni
  cooldown.
- **Demigod** — `/feed`, `/near`, `/nick` (con colores), `/tpahere`,
  teletransporte instantáneo 🔒 (sin cuenta atrás).
- **Titan** — `/fly` 🔒, `/heal` 🔒, `/repair` 🔒 (item y armadura),
  `/workbench`, `/tptoggle`, `/ec` ampliado a 54 slots, inmunidad al AFK-kick.
- **Olympian** — `/anvil`, `/skull`, `/condense`, `/ping`, 2ª página del
  EnderChest.

🔒 = bloqueado en combate por **ProCombat**. Fuera de combate funciona normal.

El teletransporte de Hero y el de Demigod son perks distintos: Hero quita la
espera y el cooldown del teletransporte aleatorio; Demigod quita la cuenta atrás
de todos los teletransportes.

**`/fly` está bloqueado en combate**, y eso conviene decirlo en vez de
esconderlo. El perk estrella del catálogo no funciona en PvP, que es la prueba
más directa del mensaje «se vende comodidad, no poder en combate». El candado es
argumento de venta, no letra pequeña.

### Precisión sobre el EnderChest

Es **EnderChestCE**, no el `/enderchest` de EssentialsX. La página 1 sale de 27
slots salvo que el rango tenga `enderchest.pages.1`, que la sube a 54. El número
de páginas lo marca el `enderchest.pages.N` más alto.

- Demigod y por debajo: sin EnderChest. `default` lo tiene **negado**.
- Titan: `enderchest.command` + `enderchest.pages.1` → 1 página de 54.
- Olympian: hereda lo anterior y suma `pages.2` → 2 páginas.

### Perks eliminados

Fuera de la web por completo. Los dos primeros están descartados por decisión de
producto; los cuatro siguientes se retiran porque la base de datos de permisos
demuestra que el servidor no los entrega:

| Perk | Dónde figuraba | Por qué se retira |
|---|---|---|
| Vaults privados | PRÓXIMAMENTE | Descartado, no va a existir |
| Chest shops | PRÓXIMAMENTE | Descartado, no va a existir |
| Cosméticos | Hero en adelante | El único permiso es `procosmetics.admin`. Ningún rango los concede: ProCosmetics es compra individual |
| Lista de amigos ampliada | Hero en adelante | `Rangos-Hyperions.md` lo marca 🔨 **en progreso** (`network/ProFriends`), y el límite de 20 es el `default` de un plugin sin terminar |
| Prefijo personalizado | Olympian | Cero usuarios con prefijo propio. Cada rango tiene el suyo, pero personalizado no existe, y choca con la regla de que el namespace de prefijo es exclusivo del rango de pago |
| Recompensa diaria | Hero en adelante | Es para todos los jugadores (`todos` en la auditoría). No se borra: baja a la fila gratuita |

Solo la recompensa diaria sobrevive, bajando a la sección gratuita. Cosméticos,
`/friends` y prefijo personalizado se eliminan de la web por completo.

`/friends` vuelve cuando ProFriends esté terminado y tenga cifras reales. No se
anuncia como PRÓXIMAMENTE: la única marca de ese tipo que queda es la cola
prioritaria.

### Corrección respecto al brief inicial

El brief de partida pedía sacar `/back` de Hero por ser gratuito para todos. La
tabla de comandos de `Rangos-Hyperions.md` lo desmiente: `essentials.back` se
desbloquea en **HERO**. **`/back` se queda en Hero.**

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

El factor ×3,7 es una **decisión deliberada, no una fórmula heredada**. Sitúa el
punto de equilibrio en el cuarto mes: a partir de ahí el permanente sale más
barato, así que cualquiera que piense quedarse una temporada lo comprará y no
generará ingreso recurrente. El estándar del sector está en ×6–×10. Se mantiene
×3,7 porque el servidor arranca y prioriza caja inmediata sobre MRR. El factor
vive en una sola constante de `js/tienda.js`, así que revisarlo más adelante es
cambiar una línea.

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
- Con el **candado de ProCombat** visible, igual que `/heal` y `/repair`.

Es el perk que decide la comparación entre Demigod y Titan, así que tiene que
verse antes que nada. El candado no se esconde: que el perk más caro del
catálogo no funcione en PvP es la prueba de que se vende comodidad y no poder.

### Seguridad

Se mantienen las reglas del repositorio: nada de `innerHTML`, solo `textContent`
y `createElement`, y ningún estilo ni script inline.

## Alcance

El sitio tiene doce páginas; este trabajo toca seis, más estilos e
infraestructura nueva.

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

Las cuatro páginas de rangos y tienda reciben además los atributos
`data-catalog` que hacen posible el check.

**Estilos**
- `public/css/rangos.css` — fila destacada de `/fly`
- `public/css/tienda.css` — rejilla de llaves, packs de Dracmas, clases que
  sustituyen a los estilos inline

**Infraestructura nueva**
- `data/catalogo.json` — fuente de verdad legible por máquina
- `tools/check-catalogo.py` — comprobación de coincidencia y cobertura
- `.github/workflows/check-catalogo.yml` — ejecución en push y PR
- `deploy.ps1` — envuelve el deploy del README y aborta si el check falla
- `README.md` — documentar el check y sustituir los tres comandos sueltos por
  el wrapper

Todo el texto de cara al jugador va en español en la web española y en inglés en
la inglesa. Los nombres de comandos y de rango se quedan en inglés en ambas.

## Comprobación automática del catálogo

### Por qué un documento no basta

Cada dato del catálogo vive escrito a mano en **cinco** sitios: tabla ES,
tarjeta ES, tabla EN, tarjeta EN y **Tebex**, que es de donde sale el dinero de
verdad. Esa duplicación es la causa raíz del error de `/enderchest`.

Ya hubo antes un documento de referencia única, `Rangos-Hyperions.md`, y el
catálogo derivó igual: dice llaves «1 → 4/mes» y protecciones «2 → 5» cuando la
auditoría da otra cosa. Un documento registra la deriva, no la impide. Este spec
tampoco lo haría.

Lo que sí la impide es un check automático, y no exige renderizar con JavaScript
ni renunciar al SEO.

### La quinta copia está desconectada, no solo desincronizada

Los diez botones de compra apuntan a la raíz de la tienda, sin un solo enlace
directo a paquete:

```
10 × https://hyperionsmc.tebex.store
```

Quien pulsa «Comprar TITAN» aterriza en un escaparate genérico y tiene que
buscar Titan por su cuenta. Si el precio de Tebex no coincide con el de la web,
la contradicción aparece en el checkout, que es el peor momento posible. Tebex
entra en el check como una copia más.

### Diseño del check

**Fuente de verdad legible por máquina.** Un `data/catalogo.json` con las cifras
por rango, los precios y los tiers de llaves. Este documento explica el porqué;
el JSON es lo que se compara.

**El HTML declara lo que afirma.** Cada elemento que muestra un dato del
catálogo lleva un atributo que lo identifica:

```html
<td class="rg-td rg-val-hero" data-catalog="hero.homes">5</td>
<span class="td-precio" data-catalog="price.hero.monthly">4,99 €</span>
```

Así el script no necesita conocer la estructura del HTML ni parsear texto libre,
que es frágil. Recorre los atributos, busca cada clave en el JSON y compara el
valor normalizado.

**Dos afirmaciones que verifica:**

1. *Coincidencia* — todo `data-catalog` del HTML cuadra con el JSON.
2. *Cobertura* — toda clave del JSON aparece al menos en la página española y en
   la inglesa. Así una traducción olvidada también falla, que es exactamente
   cómo `/en/store/` se quedó 48 líneas atrás.

**Tebex** se comprueba contra su Headless API pública
(`/api/accounts/{token}/categories?includePackages=1`), comparando los precios
con las claves `price.*`. Si la API no responde, el check avisa pero no falla:
una caída de red no debe bloquear un deploy. Un precio que **sí** responde y no
coincide falla en duro.

### Dónde se ejecuta

No hay build, ni CI, ni hooks: el deploy son tres comandos `scp` a mano. El
check se engancha en dos sitios porque cubren cosas distintas:

- **`.github/workflows/check-catalogo.yml`** — en cada push y PR. Cubre lo que
  entra en git.
- **`deploy.ps1`** — envuelve los tres comandos del README, ejecuta el check y
  aborta antes del `scp` si falla. Cubre lo que llega al VPS, que no siempre es
  lo que está en git.

Solo con la Action se podría desplegar desde local código que nunca la pasó.
Solo con el script local, un push a `main` entraría sin revisar.

**Herramientas:** Python 3.12 en local y en la Action, sin dependencias externas
(`json`, `html.parser`, `urllib` de la biblioteca estándar). Evita añadir
`package.json` a un repo que hoy no tiene ninguno.

### Límite conocido

El check verifica **cifras**, no prosa. Que Hero prometa un comando que no
existe seguirá siendo invisible para el script: `data-catalog` cubre números y
precios, no listas de perks. Contra eso la única defensa sigue siendo comparar
con la base de datos de permisos, como se ha hecho aquí.

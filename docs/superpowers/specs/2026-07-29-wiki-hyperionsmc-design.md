# Wiki de Hyperions MC — diseño

**Fecha:** 2026-07-29
**Estado:** aprobado, pendiente de plan de implementación
**Encargo:** `docs/wiki-encargo.md`

## Problema

El servidor tiene mucha información repartida en carteles del tutorial in-game y
no hay dónde consultarla fuera del juego. El jugador que abre la web está a media
partida, con una duda concreta y poca paciencia.

La wiki es bilingüe desde el primer día. La comunidad hispana es mayoritaria y la
internacional está creciendo; ninguna de las dos versiones es la traducción de
cortesía de la otra.

## Reglas heredadas del brief

Son condiciones del encargo, no preferencias de estilo:

1. **Ninguna cifra inventada.** Precios, multiplicadores, cooldowns y límites solo
   pueden salir del brief o de `data/catalogo.json`. Ante la duda se escribe
   «pendiente de confirmar», nunca un número plausible.
2. **Los comandos van literales**, en minúscula y con su barra: `/ec`, `/jobs`.
   No se traducen en la versión inglesa.
3. **Los nombres propios no se traducen**: Dracma, Nexo/Nexus, La Fosa/The Pit y
   los rangos (Mortal, Hero, Demigod, Titan, Olympian).
4. **Tono directo.** Cada página abre con la respuesta, no con una introducción.
   Las cifras van en tablas, no enterradas en párrafos.
5. **Nada de promesas de obtención sin confirmar.** Si un sistema existe pero no
   está documentado cómo se consigue, se dice.
6. **Se ve en móvil.** El buscador encuentra por comando (`/ec`) y por concepto
   («bóveda», «vault»).

Y una séptima que **no viene del encargo sino del owner** (2026-07-29), anotada
aparte para que no se confunda con las anteriores:

7. **La wiki no menciona la modalidad Prison**, que no está lanzada. Aplica solo
   a la wiki: la sección de Prison OP de la portada se queda como está.

## Marca

- **Lema:** «Tu leyenda comienza aquí» / «Your legend starts here». **Se unifica
  en toda la web**: la portada pasa a usarlo en lugar de «El Olimpo de los
  Supervivientes».
- **Discord:** `discord.gg/w4aDfwE68`, el que ya está publicado en las 42
  apariciones del repositorio. El enlace que aparecía en el prompt
  (`szhxEdmQv9`) queda descartado.
- **Tienda:** las páginas existentes `/tienda/` y `/en/store/`.

## Fuente de verdad

Dos orígenes, con reparto claro:

| Para esto | Manda |
|---|---|
| Cifras de rango, precios de tienda, llaves | `data/catalogo.json` |
| Mecánicas del servidor (Nexo, muerte, subastas, ender, cosméticos) | `docs/wiki-encargo.md`, transcrito de los carteles in-game |

Ninguna página de la wiki puede contradecir a `data/catalogo.json`. Cuando una
cifra ya vive ahí, la wiki **no la reescribe**: la inyecta.

### Dónde el encargo y el catálogo no dicen lo mismo

El encargo describe los rangos de pago; el catálogo describe los cinco rangos.
Cuatro puntos difieren y **manda el catálogo**, que es más preciso:

| El encargo dice | El catálogo dice | Qué escribe la wiki |
|---|---|---|
| homes 5 → 40 | 1 · 5 · 10 · 20 · 40 | El reparto completo, con Mortal en 1 |
| multiplicador ×1.1 → ×2.0 | ×1.0 · ×1.1 · ×1.25 · ×1.5 · ×2.0 | El reparto completo, con Mortal en ×1.0 |
| «una llave cada 30 días» | Demigod 2 Common · Olympian 1 Epic + 1 Legendary | «Llaves cada 30 días», en plural y sin número |
| huecos de subasta 3 → 20 | 3 · 5 · 8 · 12 · 20 | El reparto completo |

La wiki nunca escribe «una llave»: Demigod recibe dos y Olympian dos de tipos
distintos. El sitio publicado ya lo dice así.

Las cifras del EnderChest **no están en el catálogo**: entran ahora como claves
`wiki.ec.*`. No había nada con lo que contrastarlas.

## Arquitectura

### Por qué hay un generador

Cada página del sitio actual es un 52% de plantilla repetida —cabecera, pie y
metadatos idénticos— medido sobre `/soporte/`: 7,5 KB de contenido real frente a
8 KB de cascarón. Con 12 páginas se lleva; la wiki son 13 páginas por dos
idiomas solo en la fase 1, y copiar 26 cascarones garantiza que se desincronicen.

El generador elimina esa copia sin renunciar a nada: la salida sigue siendo HTML
estático, indexable y funcional sin JavaScript.

### Estructura de archivos

```
wiki/
├─ paginas.json              metadatos de todas las páginas
├─ es/<slug>.html            solo el cuerpo, sin cabecera ni pie
└─ en/<slug>.html
```

`paginas.json` reúne los metadatos en un único archivo, en vez de repartirlos en
cabeceras por documento. Así la estructura de la wiki se ve de un vistazo y el
menú se genera de ahí.

```json
{
  "secciones": [
    { "id": "objetos", "es": "Objetos y cosmética", "en": "Items & cosmetics" }
  ],
  "paginas": [
    {
      "par": "ender-vault",
      "seccion": "objetos",
      "orden": 40,
      "comandos": ["/ec", "/ec 2", "/ec 3"],
      "es": {
        "slug": "boveda-del-ender",
        "titulo": "Bóveda del Ender",
        "resumen": "Hasta 3 páginas de 54 espacios que no pierdes al morir.",
        "alias": ["vault", "bóveda", "cofre del ender"]
      },
      "en": {
        "slug": "ender-vault",
        "titulo": "Ender Vault",
        "resumen": "Up to 3 pages of 54 slots that you keep when you die.",
        "alias": ["vault", "enderchest"]
      }
    }
  ]
}
```

`par` une las dos versiones de una misma página y es lo que permite que el
cambio de idioma no saque al visitante de donde estaba.

### El cuerpo se escribe en HTML

Sin Markdown y sin parser. El motivo consta en «Decisiones registradas».

Cada archivo contiene solo lo que va dentro del artículo. Sin `<html>`, sin
cabecera, sin pie. Empieza directamente por el primer `<h2>`: el `<h1>` con el
título lo pone el generador desde `paginas.json`, para que no pueda
desincronizarse del que aparece en el menú y en el buscador.

### Las tres formas de `{{ }}`

El generador reconoce exactamente tres, y falla ante cualquier otra:

| Forma | Produce |
|---|---|
| `{{clave.del.catalogo}}` | `<span data-catalog="clave.del.catalogo">valor</span>` |
| `{{nexo.vida(tier, miembros)}}` | El número calculado, sin `data-catalog` |
| `{{{{` | Un `{{` literal, sin intentar resolver nada |

El desescapado de `{{{{` ocurre **después** de resolver las otras dos, para que
un literal escapado no pueda convertirse en una invocación. `}}` no necesita
escape: fuera de una invocación abierta es texto normal.

**Por qué existe la forma calculada.** Las tablas del Nexo contienen unas 25
cifras que son cuentas, no datos: `1.6`, `3.1`, `6.1`, los topes por tier, los
porcentajes de ventaja. Ninguna puede salir de una clave del catálogo. Si se
teclean a mano se teclean **dos veces, una por idioma**, que es exactamente el
riesgo que la inyección existe para eliminar. `{{nexo.vida(T5, 4)}}` lo calcula
el generador desde `baseT5`, `porMiembro` y `tope`, y sale idéntico en los dos
idiomas por construcción.

No lleva `data-catalog` porque no hay clave que verificar: el valor es una
función de otras claves que sí lo llevan.

### Formato decimal por idioma

El catálogo guarda `10.0` con punto. El español escribe `10,0` con coma, igual
que el resto del sitio escribe `4,99 €`.

El generador formatea los decimales según el idioma de la página: coma en `/wiki/`
y punto en `/en/wiki/`. El verificador no se entera porque `normalize()` ya
equipara `10,0` y `10.0` — es la misma función que permite que la tienda muestre
`4,99 €` y `€4.99` para la misma clave.

### Qué envuelve el generador

La plantilla produce, en este orden:

1. Cabecera del sitio, la misma que el resto de páginas.
2. **Barra lateral** con las secciones y sus páginas, marcando la actual.
3. **Buscador**, en todas las páginas y no solo en el índice: el jugador llega a
   la wiki desde Google, no siempre por la portada.
4. **Migas de pan**: Wiki › Sección › Página.
5. `<h1>` con el título y, debajo, el resumen de `paginas.json`. Es la respuesta
   inmediata que pide el brief.
6. El cuerpo del archivo.
7. Pie del sitio, con el enlace de Discord.

### La página índice

Es la única sin slug. En `paginas.json` lleva `"slug": ""` en ambos idiomas y
`"seccion": null`, y el generador la escribe en `public/wiki/index.html` y
`public/en/wiki/index.html` — sin carpeta intermedia.

Tiene cuerpo propio como cualquier otra, en `wiki/es/index.html` y
`wiki/en/index.html`. Lo que la distingue es que el generador le añade, después
del cuerpo, el listado completo de secciones y páginas.

### Dónde cuelga la wiki

Entrada nueva **Wiki** en la cabecera del sitio, junto a «Rangos», y en la
columna «Servidor» del pie. En los dos idiomas.

### El punto de entrada en móvil

La cabecera no vale por sí sola. `public/css/styles.css` oculta `.nav-link` por
debajo de 460 px —se añadió el 29/07 porque «Rangos» desbordaba— así que una
entrada «Wiki» al lado sería **invisible en cualquier teléfono**. El encargo pone
el móvil como criterio de éxito.

Se añade un **botón de menú** en la cabecera, visible solo por debajo de 460 px,
que despliega Rangos, Wiki y Tienda. Resuelve de paso el problema que ya existe:
hoy «Rangos» solo se alcanza desde el pie en móvil.

Requisitos: se abre y se cierra con teclado, `aria-expanded` en el botón, y se
cierra al pulsar fuera o al navegar. Sin `innerHTML` y sin estilos inline, como
todo lo demás.

### Dónde vive la plantilla y qué queda duplicado

La plantilla es un archivo propio, `wiki/plantilla.html`, con marcadores que el
generador rellena. No se incrusta en el código del generador: así se puede
editar el cascarón sin tocar Python.

**Queda una duplicación conocida.** Esa plantilla reproduce la cabecera y el pie
que siguen escritos a mano en las 12 páginas actuales. Un cambio de cascarón hay
que aplicarlo en dos sitios, y los tres cambios de este mismo spec —lema, entrada
«Wiki» y menú móvil— son justo de ese tipo.

No se resuelve ahora: absorber las 12 páginas al generador es un trabajo aparte,
con su propio riesgo sobre páginas que ya funcionan y posicionan. Queda anotado
como deuda, y el `git diff --exit-code` de la Action al menos garantiza que la
mitad generada no se desvía en silencio.

### El generador

`tools/build_wiki.py`, biblioteca estándar únicamente. Lee `wiki/paginas.json` y
`data/catalogo.json`, y escribe:

- `public/wiki/<slug>/index.html` y `public/en/wiki/<slug>/index.html`
- `public/js/wiki-index.js` con el índice del buscador

**Falla y no genera nada** si encuentra: una clave `{{...}}` que no existe en el
catálogo, un cuerpo que falta, un slug duplicado, un archivo de cuerpo no
declarado en `paginas.json`, o una página sin su pareja en el otro idioma.

### Las cifras se inyectan

En el cuerpo se escribe la clave, nunca el número:

```html
<td>{{wiki.nexo.tope}}</td>
```

El generador emite `<span data-catalog="wiki.nexo.tope">10.0</span>` con el valor
del catálogo.

Esto importa especialmente aquí porque **cada cifra aparece dos veces, una por
idioma**. Que la página española diga 40 min y la inglesa 45 es un fallo
plausible y silencioso; inyectando, no puede ocurrir.

## Cifras que entran al catálogo

Bajo la clave `wiki`. Todas son idénticas en ambos idiomas —cifras, símbolos y
unidades—, así que la comprobación de cobertura las cubre sin tratamiento
especial.

### Nexo

| Clave | Valor |
|---|---|
| `wiki.nexo.baseT13` | 1.1 |
| `wiki.nexo.baseT4` | 2.1 |
| `wiki.nexo.baseT5` | 3.0 |
| `wiki.nexo.porMiembro` | 0.5 |
| `wiki.nexo.tope` | 10.0 |
| `wiki.nexo.pvp` | −1.0 |
| `wiki.nexo.mob` | −0.5 |
| `wiki.nexo.netherMult` | ×1.5 |
| `wiki.nexo.endMult` | ×2 |
| `wiki.nexo.raidMin` | 40 min |
| `wiki.nexo.regenMin` | 60 min |
| `wiki.nexo.ofrendaDiamantes` | 8 |
| `wiki.nexo.ofrendaResta` | 1 min |
| `wiki.nexo.ofrendaTope` | 20 min |
| `wiki.nexo.gracia` | 24 h |

### Combate

| Clave | Valor |
|---|---|
| `wiki.muerte.penalizacion` | 5% |
| `wiki.muerte.cooldown` | 15 min |
| `wiki.bounty.minimo` | 100 |
| `wiki.bounty.comision` | 5% |
| `wiki.bounty.autocabeza` | 1% |
| `wiki.combatlog.clon` | 45 s |

### Subastas y bóveda

| Clave | Valor |
|---|---|
| `wiki.subasta.comision` | 5% |
| `wiki.subasta.duracion` | 48 h |
| `wiki.ec.paginas` | 3 |
| `wiki.ec.slots` | 54 |
| `wiki.ec.precio1` | 20 💎 |
| `wiki.ec.precio2` | 34 💎 |
| `wiki.ec.precio3` | 58 💎 |

### El verificador tiene que ver las páginas de la wiki

`tools/check_catalogo.py` lleva la lista de archivos escrita a mano:

```python
ES_FILES = ['public/index.html', 'public/rangos/index.html', 'public/tienda/index.html']
EN_FILES = ['public/en/index.html', 'public/en/ranks/index.html', 'public/en/store/index.html']
```

Las páginas generadas no están ahí. Añadir las 28 claves sin tocar ese archivo
produce **56 errores de cobertura** —28 claves × 2 idiomas— y `deploy.ps1` aborta.
Comprobado ejecutándolo.

Las dos listas pasan a construirse por patrón, de modo que cualquier página
futura entre sola:

```python
ES_FILES = ['public/index.html', 'public/rangos/index.html', 'public/tienda/index.html'] \
    + sorted(str(p.relative_to(RAIZ)) for p in (RAIZ / 'public/wiki').rglob('index.html'))
```

Y su equivalente para `public/en/wiki`.

**Las dos mitades del verificador no valen lo mismo sobre HTML generado**, y
conviene no confundirlas:

- La **coincidencia** (que el valor del HTML cuadre con el JSON) no puede fallar
  sobre una página generada: el generador acaba de sacar ese valor de ese JSON.
  Es redundante, y es a lo que se refiere el apartado «Integración» cuando dice
  que sería una garantía aparente.
- La **cobertura** (que cada clave aparezca en ES y en EN) sí aporta: detecta una
  clave declarada y nunca usada, o usada solo en un idioma. Es la que obliga a
  que el reparto de abajo se cumpla de verdad.

**Toda clave añadida tiene que usarse en la fase 1**, o la cobertura falla desde
el primer build.

Reparto de las 28:

| Claves | Página que las usa |
|---|---|
| `wiki.nexo.*` (15) | Las tres del Nexo |
| `wiki.muerte.*` (2) · `wiki.bounty.*` (3) · `wiki.combatlog.clon` | Matar y morir |
| `wiki.subasta.*` (2) | Casa de subastas |
| `wiki.ec.*` (5) | Bóveda del Ender |

Los huecos de subasta no se añaden: ya existen como `rango.*.subastas`.

## El Nexo

Es el sistema más complejo del servidor y el que más tráfico va a tener. Tres
páginas en la sección `base`.

### La vida base depende del tier de protección

La fórmula completa es **base del tier + 0.5 por miembro**, con tope en 10.0:

| Tier de protección | Base | Solo | 4 miembros | 10 miembros | Llega al tope con |
|---|---|---|---|---|---|
| Tiers 1–3 | 1.1 | 1.6 | 3.1 | 6.1 | 18 miembros |
| Tier 4 | 2.1 | 2.6 | 4.1 | 7.1 | 16 miembros |
| Tier 5 (de pago) | 3.0 | 3.5 | 5.0 | 8.0 | 14 miembros |

Esa tabla va en «Qué es el Nexo». Es la información que un jugador busca de
verdad —cuánta vida tengo y cuánta me falta— y responde de un vistazo.

El Tier 5 se marca como **de pago**, con enlace a `/tienda/`. El encargo obliga
a decir cómo se obtiene cada cosa, y ocultarlo dejaría a medias justo a quien
está haciendo la cuenta de cuánto aguanta su base.

### Lo que el Tier 5 cambia de verdad

Sube la vida inicial y el área protegida; nada más. Su peso depende del tamaño
del clan, y conviene que la wiki lo diga porque es lo que el jugador quiere
saber antes de comprarlo:

| Miembros | Tiers 1–3 | Tier 5 | Ventaja |
|---|---|---|---|
| 1 | 1.6 | 3.5 | +119% |
| 4 | 3.1 | 5.0 | +61% |
| 10 | 6.1 | 8.0 | +31% |
| 14 | 8.1 | 10.0 | +23% |
| 18 | 10.0 | 10.0 | **0%** |

**A partir de 18 miembros los dos llegan al tope y el T5 no aporta vida.** Es un
refuerzo para quien juega solo o en grupo pequeño, no una ventaja permanente.

Queda anotado que esto convive con la frase «nunca poder en PvP» de la portada.
El owner lo considera una mejora de protección de terreno y no una ventaja de
combate, y la portada se queda como está. La tabla de arriba permite a cualquiera
juzgarlo por su cuenta, que es lo que corresponde a una wiki.

### La regla del tope, redactada con cuidado

El material recibido dice «tope 10.0» y «a partir de 20 miembros ya no suma».
Las dos se pisan: el tope llega antes que los 20 miembros en los tres tiers, y
en el T5 llega con 14.

Confirmado con el owner: **la regla real es el tope de 10.0.** Un clan puede
seguir admitiendo gente, pero no suma vida.

Por eso la wiki escribe «sube 0.5 por miembro hasta un máximo de 10.0» y
acompaña la tabla de arriba. **No se menciona el límite de 20 miembros**: haría
creer a un clan de 14 en T5 que todavía le queda margen, que es justo el tipo de
error que esta wiki existe para no cometer.

### Las tres páginas

| Página | Slug ES | Slug EN | Contenido |
|---|---|---|---|
| Qué es el Nexo | `nexo` | `nexus` | Qué es, fórmula de vida, tabla de referencia por miembros |
| Cómo se pierde | `como-se-pierde-el-nexo` | `losing-your-nexus` | Daño por tipo de muerte, multiplicadores de dimensión, ejemplo trabajado |
| Raid y regeneración | `raid-y-regeneracion` | `raid-and-regen` | Ventana de raid, regeneración, ofrendas, gracia inicial |

### El ejemplo trabajado

El brief lo pide y su aritmética está verificada:

> Clan de 4 miembros con protección de tier 1–3: vida `1.1 + 0.5×4 = 3.1`.
> Dos muertes en PvP en el Nether: `1.0 × 1.5 = 1.5` cada una, `−3.0` en
> total. Queda **0.1**.
>
> El mismo clan con Protección T5 partiría de `3.0 + 2.0 = 5.0` y aguantaría
> esas dos muertes con 2.0 de sobra.

**El ejemplo dice de qué tier habla.** Sin eso, un jugador con T5 haría la
cuenta con la base equivocada y le saldría casi el doble de vida perdida.

Va en «Cómo se pierde», que es donde el jugador llega con la duda.

## Alcance

### Fase 1 — trece páginas

| Sección | Página | Slug ES | Slug EN |
|---|---|---|---|
| — | Índice | `/wiki/` | `/en/wiki/` |
| empezar | Primeros pasos | `primeros-pasos` | `getting-started` |
| base | Qué es el Nexo | `nexo` | `nexus` |
| base | Cómo se pierde el Nexo | `como-se-pierde-el-nexo` | `losing-your-nexus` |
| base | Raid y regeneración | `raid-y-regeneracion` | `raid-and-regen` |
| combate | Matar y morir | `matar-y-morir` | `killing-and-dying` |
| progresion | Rangos y Dracma | `rangos-y-dracma` | `ranks-and-dracma` |
| progresion | Clasificaciones | `clasificaciones` | `leaderboards` |
| economia | Casa de subastas | `casa-de-subastas` | `auction-house` |
| objetos | Bóveda del Ender | `boveda-del-ender` | `ender-vault` |
| objetos | Cosméticos | `cosmeticos` | `cosmetics` |
| objetos | Kits y misiones | `kits-y-misiones` | `kits-and-missions` |
| referencia | Comandos | `comandos` | `commands` |

Veintiséis archivos generados. Siete secciones: `empezar`, `base`, `combate`,
`progresion`, `economia`, `objetos` y `referencia`.

Contenido de cada una:

- **Índice** — navegación, buscador y las rutas de entrada más comunes.
- **Primeros pasos** — los seis pasos del tutorial, cada uno con su comando:
  `/kits` y `/daily`; `/jobs` y `/missions`; `/shop`, `/sell` y `/worth`; `/p`
  antes de construir nada serio; `/sethome` y `/home`; `/clan`.
- **Nexo** (3 páginas) — según el apartado anterior.
- **Matar y morir** — penalización, cooldown del mismo asesino, bounty y el clon
  por desconectar en combate.
- **Rangos y Dracma** — cómo funcionan y qué cambia al subir; enlaza a `/rangos/`
  y a `/tienda/`.
- **Clasificaciones** — `/leaderboards`, y que una muerte solo cuenta al K/D si
  te mató otro jugador.
- **Casa de subastas** — `/ah sell`, la comisión al publicar y no al vender, las
  48 horas, `/ah expired` y que no se pierde nada.
- **Bóveda del Ender** — las 3 páginas, precios, cómo cambiar y qué no es.
- **Cosméticos** — qué dan y que se apagan al entrar en combate.
- **Kits y misiones** — fusionadas: el material da dos frases de cada una.
- **Comandos** — los 20 confirmados, con qué hace cada uno y quién puede usarlo.

### Qué pasa con «Ganar dinero»

Es una sección de la estructura propuesta en el encargo y **no tiene página
propia en la fase 1**. Su contenido está repartido, no perdido: `/jobs` y
`/missions` en «Primeros pasos» y en «Kits y misiones», `/shop`, `/sell` y
`/worth` en «Primeros pasos», y las subastas en su propia página.

Se agrupará cuando haya material que hoy no existe —tablas de precios de `/shop`,
niveles de `/jobs`— y no antes: una página que solo enlaza a otras tres no
resuelve ninguna duda.

### Fuera de la fase 1

- **La Fosa.** Solo quedaba un dato propio —los traidores van a Prisión— y la
  regla 6 prohíbe mencionar Prison en la wiki. Sin ese dato no queda página. El
  clon por desconectar, que el material coloca aquí, se traslada a «Matar y
  morir»: es una consecuencia del combate, no una regla de La Fosa.
- **Cajas.** «Mutaciones, alas y mascotas místicas» y nada sobre cómo se
  consiguen. Se menciona de pasada en «Rangos y Dracma» —una llave cada 30
  días— y se enlaza a la tienda; no tiene página propia hasta saber más.
- **Elevadores** y **Amigos.** Sin texto verificado, por indicación expresa del
  encargo.

### Fase 2

Cuando haya material: **Cajas**, **Elevadores** y **Amigos**, más protecciones de
base y clanes en detalle —hoy viven dentro de «Primeros pasos» con una línea cada
uno— y la agrupación de «Ganar dinero».

**La Fosa no vuelve en la fase 2** mientras rija la regla 7: su único dato propio
es que los traidores van a Prisión.

## Buscador

El generador emite `public/js/wiki-index.js`:

```js
window.HY_WIKI = [
  { l: 'es', s: 'boveda-del-ender', t: 'Bóveda del Ender',
    r: 'Hasta 3 páginas de 54 espacios…',
    c: ['/ec', '/ec 2', '/ec 3'], a: ['vault', 'bóveda'] }
];
```

Es un archivo `.js` normal, así que **la CSP actual no se toca**: `script-src
'self'` ya lo permite y no hace falta ninguna petición de red. Esto importa,
porque `connect-src` está limitado a la API de estado del servidor y un índice
descargado por `fetch` quedaría bloqueado.

`public/js/wiki-search.js` filtra sobre título, resumen, comandos y alias.
Buscar «vault», «bóveda» o `/ec` lleva al mismo sitio. Los resultados se pintan
con `createElement` y `textContent`, nunca con `innerHTML`.

## Corrección de `lang.js`

`public/js/lang.js` decide el idioma con un mapa de rutas escrito a mano y seis
entradas. Cualquier ruta que no esté en ese mapa cae al respaldo:

```js
return isEn ? (REV[path] || '/') : (MAP[path] || '/en/');
```

Como el script redirige antes del primer pintado, un visitante con preferencia
inglesa que abriera una página española de la wiki acabaría en `/en/` sin llegar
a ver lo que buscaba. Incumple un criterio explícito del encargo y es además un
fallo latente para cualquier página futura del sitio.

El mapa desaparece. Cada página ya declara su equivalente y esos `<link>` están
en el `<head>` **antes** del script, así que se pueden leer de forma síncrona:

```js
function counterpart() {
  const sel = isEn ? 'link[rel="alternate"][hreflang="es"]'
                   : 'link[rel="alternate"][hreflang="en"]';
  const el = document.querySelector(sel);
  if (el) {
    try { return new URL(el.href).pathname; } catch (e) { /* href malformado */ }
  }
  return isEn ? '/' : '/en/';
}
```

**Hace falta una guarda contra bucle.** El mapa codificado no podía devolver la
ruta actual; un `href` leído del documento sí, si una página se declara como su
propia alternativa o el generador cruza mal un `par`. Sin guarda, eso es una
recarga infinita:

```js
const destino = counterpart();
const actual = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
if (destino !== actual) location.replace(destino);
```

Y `build_wiki.py` valida que los dos miembros de cada `par` se enlazan
mutuamente, para que el caso no llegue a producirse.

El archivo lo comparten las 12 páginas actuales, así que el cambio de idioma se
verifica **una por una** antes de desplegar.

## Metadatos de cada página generada

El generador los compone; ninguno se escribe a mano. Sin esto, quien implemente
tendría que inventarlos para 26 archivos.

| Etiqueta | Contenido |
|---|---|
| `<html lang>` | `es` o `en` |
| `<title>` | `<titulo> — Wiki de Hyperions MC` / `— Hyperions MC Wiki` |
| `<meta name="description">` | El `resumen` de `paginas.json` |
| `<link rel="canonical">` | La URL absoluta de la propia página |
| `<link rel="alternate" hreflang="es">` | La URL absoluta de su pareja española |
| `<link rel="alternate" hreflang="en">` | La URL absoluta de su pareja inglesa |
| `<link rel="alternate" hreflang="x-default">` | Apunta a la inglesa, como el resto del sitio |
| `og:type` · `og:site_name` · `og:image` | Los mismos valores que el resto del sitio |
| `og:title` · `og:description` · `og:url` | Título, resumen y canónica de la página |
| `og:locale` | `es_ES` o `en_US` |

**Los `<link rel="alternate">` van antes de `<script src="/js/lang.js">`**, y el
generador lo garantiza. No es cosmético: `lang.js` los lee de forma síncrona
antes del primer pintado, y si el script se adelantara el fallo sería silencioso
y solo visible en producción.

## Estructura de direcciones

`/wiki/<slug-es>/` y `/en/wiki/<slug-en>/`, con slug traducido en cada idioma
para que cada versión posicione en su mercado. La correspondencia la mantiene
`par` en `paginas.json` y se materializa en los `<link rel="alternate">`.

## Sin duplicar lo que ya existe

La web ya tiene `/rangos/` con la comparativa completa y `/tienda/`. La página de
rangos de la wiki explica **cómo funciona** un rango y qué cambia al subir, y
enlaza a las existentes para la tabla y para comprar.

Una sola tabla de cifras en todo el sitio: la que ya existe y ya está vigilada.

## Presentación

`public/css/wiki.css`, nuevo. Barra lateral con las secciones, buscador,
tipografía de artículo y el plegado del menú en móvil, que el encargo pide de
forma explícita porque mucha gente consulta desde el teléfono mientras juega.

Sin estilos ni scripts inline: la CSP de producción los descarta y el fallo solo
se ve tras desplegar.

## Integración

El HTML generado **se commitea**. `deploy.ps1` regenera antes de comprobar nada,
y la Action regenera y falla si el resultado difiere de lo commiteado
(`git diff --exit-code`).

Esa comprobación es la que de verdad protege: detecta que alguien editó el HTML
generado a mano, o que tocó un cuerpo y olvidó regenerar. Comparar el HTML
generado contra el catálogo, en cambio, no puede fallar nunca —el generador acaba
de producirlo desde ese mismo catálogo— y sería una garantía aparente.

## Cambios fuera de la wiki

Seis. Los tres primeros son de contenido; los tres últimos son la infraestructura
sin la cual la wiki no se verifica ni se despliega.

1. **El lema se unifica** a «Tu leyenda comienza aquí» / «Your legend starts
   here». Vive en tres sitios por idioma: el `og:title`, el titular del hero y
   el pie (`footer-brand__desc`, en las 12 páginas). Los tres cambian.
2. **Entrada «Wiki»** en la cabecera y en el pie de las 12 páginas actuales.
   Ver «El punto de entrada en móvil», porque la cabecera no vale por sí sola.
3. **`lang.js`** deja de usar su mapa de rutas.
4. **`tools/check_catalogo.py`** — las listas de archivos pasan a construirse por
   patrón para incluir la wiki.
5. **`deploy.ps1`** — regenera la wiki antes de comprobar nada. Hoy no genera.
6. **`.github/workflows/check-catalogo.yml`** — regenera, comprueba con
   `git diff --exit-code` que lo generado coincide con lo commiteado, y corre los
   tests del generador. Hoy solo ejecuta `test_check_catalogo` por nombre, así
   que un `tools/test_build_wiki.py` nuevo **no se ejecutaría en CI** aunque sí
   en el deploy.

## Pruebas

`tools/test_build_wiki.py`, con la misma técnica que los tests existentes:
biblioteca estándar, sin red y sin tocar archivos reales.

Cubre lo que el generador promete rechazar —clave inexistente, cuerpo que falta,
slug duplicado, archivo huérfano, página sin pareja, `par` mal cruzado— más la
sustitución en sus tres formas y el formateo decimal por idioma.

`deploy.ps1` ya los ejecutaría, porque usa `unittest discover`. **La Action no**:
hoy invoca `test_check_catalogo` por nombre. Cambiar eso es parte del punto 6 de
«Cambios fuera de la wiki».

## Decisiones registradas

**Cuerpo en HTML y no en Markdown.** Se valoraron tres opciones: un parser propio
de un subconjunto de Markdown, la librería `markdown`, y HTML directo. El parser
propio se descartó por ser la pieza más frágil del sistema y de fallo sutil. La
librería se descartó porque sería la primera dependencia del repositorio, a
cambio solo de comodidad de sintaxis. HTML directo no necesita ninguna de las dos
cosas y da acceso a las clases de tabla que el sitio ya tiene.

Conviene dejar constancia de que la restricción de «sin dependencias» venía del
script de verificación, que corre en CI, y no es una regla del repositorio: el
README dice «sin build» refiriéndose al sitio desplegado, no a las herramientas.
La decisión se sostiene igualmente por el argumento de fragilidad.

**Metadatos centralizados.** Un `paginas.json` en lugar de cabeceras por archivo,
para ver la estructura completa y generar el menú sin recorrer todos los cuerpos.

**El generador falla en vez de improvisar.** Ante una clave desconocida o un
archivo huérfano no genera nada. Un aviso que se ignora acaba publicando una
página rota.

**El tope del Nexo se cuenta como tope, no como límite de miembros.** Ver «La
regla del tope, redactada con cuidado».

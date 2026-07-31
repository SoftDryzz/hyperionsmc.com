# Wiki de Hyperions MC — diseño

**Fecha:** 2026-07-29
**Estado:** aprobado, pendiente de plan de implementación
**Encargo original:** `wiki-brief.md` (raíz del repositorio)

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

## Fuente de verdad

Dos orígenes, con reparto claro:

| Para esto | Manda |
|---|---|
| Cifras de rango, precios de tienda, llaves | `data/catalogo.json` |
| Mecánicas del servidor (ender, muerte, bounty, cosméticos) | `wiki-brief.md`, transcrito de los carteles in-game |

Ninguna página de la wiki puede contradecir a `data/catalogo.json`. Cuando una
cifra ya vive ahí, la wiki **no la reescribe**: la inyecta (ver «Las cifras se
inyectan»).

## Arquitectura

### Por qué hay un generador

Cada página del sitio actual es un 52% de plantilla repetida —cabecera, pie y
metadatos idénticos— medido sobre `/soporte/`: 7,5 KB de contenido real frente a
8 KB de cascarón. Con 12 páginas se lleva; la wiki completa son ~29 páginas por
dos idiomas, y copiar 58 cascarones garantiza que se desincronicen.

El generador elimina esa copia sin renunciar a nada: la salida sigue siendo HTML
estático, indexable y funcional sin JavaScript.

### Estructura de archivos

```
wiki/
├─ paginas.json              metadatos de todas las páginas
├─ es/<slug>.html            solo el cuerpo, sin cabecera ni pie
└─ en/<slug>.html
```

`paginas.json` reúne los metadatos de todas las páginas en un único archivo, en
vez de repartirlos en cabeceras por documento. Así la estructura de la wiki se ve
de un vistazo y el menú se genera de ahí.

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

Sin Markdown y sin parser. La decisión y su motivo constan en «Decisiones
registradas»; en resumen: un parser propio es la pieza más frágil que se puede
meter en un generador, y añadir una dependencia por comodidad de sintaxis no
compensa cuando el autor puede usar directamente las clases de tabla que el sitio
ya tiene.

Cada archivo contiene solo lo que va dentro del artículo. Sin `<html>`, sin
cabecera, sin pie. Empieza directamente por el primer `<h2>`: el `<h1>` con el
título de la página lo pone el generador desde `paginas.json`, para que no pueda
desincronizarse del que aparece en el menú y en el buscador.

Un cuerpo no puede contener la secuencia `{{` salvo para invocar una clave del
catálogo. Si algún día hace falta escribirla literalmente, se escapa como
`{{{{`; el generador la convierte en `{{` y no intenta resolverla.

### Qué envuelve el generador

La plantilla produce, en este orden:

1. Cabecera del sitio, la misma que el resto de páginas.
2. **Barra lateral** con las secciones y sus páginas, marcando la actual.
3. **Buscador**, en todas las páginas y no solo en el índice: el jugador llega a
   la wiki desde Google, no siempre por la portada.
4. **Migas de pan**: Wiki › Sección › Página.
5. `<h1>` con el título y, debajo, el resumen de `paginas.json`. Es la respuesta
   inmediata que pide el brief: la página abre con el dato, no con una
   introducción.
6. El cuerpo del archivo.
7. Pie del sitio, el mismo que el resto.

### Dónde cuelga la wiki

Entrada nueva **Wiki** en la cabecera del sitio, junto a «Rangos», y en la
columna «Servidor» del pie. Ambas en los dos idiomas. Son los dos únicos sitios
del resto de la web que hay que tocar.

### El generador

`tools/build_wiki.py`, biblioteca estándar únicamente. Lee `wiki/paginas.json` y
`data/catalogo.json`, y escribe:

- `public/wiki/<slug>/index.html` y `public/en/wiki/<slug>/index.html`
- `public/js/wiki-index.js` con el índice del buscador

**Falla y no genera nada** si encuentra: una clave `{{...}}` que no existe en el
catálogo, un cuerpo que falta, un slug duplicado, un archivo de cuerpo que no
está declarado en `paginas.json`, o una página sin su pareja en el otro idioma.

### Las cifras se inyectan

En el cuerpo se escribe la clave, nunca el número:

```html
<td>{{rango.hero.homes}}</td>
```

El generador emite `<span data-catalog="rango.hero.homes">5</span>` con el valor
tomado del catálogo. **El autor no puede teclear mal una cifra porque no la
teclea.** El atributo `data-catalog` deja además la página cubierta por
`tools/check_catalogo.py`, igual que el resto del sitio.

### Cifras nuevas que entran al catálogo

Del brief salen datos que hoy no están vigilados en ningún sitio. Se añaden a
`data/catalogo.json` bajo `wiki`:

| Clave | Valor |
|---|---|
| `wiki.ec.paginas` | 3 |
| `wiki.ec.slots` | 54 |
| `wiki.ec.precio1` | 20 💎 |
| `wiki.ec.precio2` | 34 💎 |
| `wiki.ec.precio3` | 58 💎 |
| `wiki.muerte.penalizacion` | 5% |
| `wiki.muerte.cooldown` | 15 min |
| `wiki.bounty.minimo` | 100 |
| `wiki.bounty.comision` | 5% |
| `wiki.bounty.autocabeza` | 1% |
| `wiki.combatlog.clon` | 45 s |

Todas son idénticas en ambos idiomas —cifras, símbolos y unidades—, así que la
comprobación de cobertura las cubre sin tratamiento especial.

**Toda clave que se añada tiene que usarse en la fase 1.** La comprobación de
cobertura exige que cada clave del catálogo aparezca en alguna página española y
en alguna inglesa; una clave declarada y sin usar rompe el check desde el primer
build. Reparto en la fase 1:

| Claves | Página que las usa |
|---|---|
| `wiki.ec.*` (5) | Bóveda del Ender |
| `wiki.muerte.*` (2) · `wiki.bounty.*` (3) · `wiki.combatlog.clon` | Matar y morir |

`wiki.combatlog.clon` va en «Matar y morir» y no en «La Fosa», donde el brief lo
coloca. El clon punible por desconectarse es una consecuencia del combate, no una
regla de La Fosa, y encaja mejor junto a la penalización por muerte y al bounty.
Deja además a La Fosa con un único dato —los traidores van a Prisión—, lo que
confirma que no da para página propia todavía.

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

`public/js/wiki-search.js` filtra sobre título, resumen, comandos y alias. Buscar
«vault», «bóveda» o `/ec` lleva al mismo sitio. Los resultados se pintan con
`createElement` y `textContent`, nunca con `innerHTML`.

## Corrección de `lang.js`

`public/js/lang.js` decide el idioma con un mapa de rutas escrito a mano y seis
entradas. Cualquier ruta que no esté en ese mapa cae al respaldo:

```js
return isEn ? (REV[path] || '/') : (MAP[path] || '/en/');
```

Como el script redirige antes del primer pintado, un visitante con preferencia
inglesa que abra una página española de la wiki acabaría en `/en/` sin llegar a
ver lo que buscaba. Incumple un criterio explícito del brief —«el cambio de
idioma no te saca de la página»— y es además un fallo latente para cualquier
página futura del sitio.

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

El archivo lo comparten las 12 páginas actuales, así que el cambio de idioma se
verifica **una por una** antes de desplegar.

## Alcance

### Fase 1 — siete páginas

Solo lo que tiene material verificado suficiente:

| Sección | Página | Slug ES | Slug EN |
|---|---|---|---|
| — | Índice | `/wiki/` | `/en/wiki/` |
| empezar | Kits y misiones | `kits-y-misiones` | `kits-and-missions` |
| progresion | Rangos y Dracma | `rangos-y-dracma` | `ranks-and-dracma` |
| combate | Matar y morir | `matar-y-morir` | `killing-and-dying` |
| objetos | Bóveda del Ender | `boveda-del-ender` | `ender-vault` |
| objetos | Cosméticos | `cosmeticos` | `cosmetics` |
| referencia | Comandos | `comandos` | `commands` |

Contenido de cada una:

- **Índice** — navegación, buscador y los primeros pasos confirmados del brief
  (`/kits`, `/daily`, `/jobs`, `/missions`).
- **Kits y misiones** — qué son, que el rango decide cuáles puedes usar, que cada
  kit tiene su espera y que los premium están en `/shop`; diarias contra
  contratos.
- **Rangos y Dracma** — cómo funcionan y qué cambia al subir; enlaza a `/rangos/`
  y a `/tienda/`.
- **Matar y morir** — penalización, cooldown del mismo asesino, bounty y el clon
  por desconectar en combate.
- **Bóveda del Ender** — las 3 páginas, precios, cómo cambiar y qué no es.
- **Cosméticos** — qué dan y que se apagan al entrar en combate.
- **Comandos** — los 11 confirmados, con qué hace cada uno y quién puede usarlo.

Catorce archivos generados. **Kits y misiones van juntas a propósito**: el brief
da dos frases de cada una y dos frases no sostienen una página.

Las secciones de la fase 1 son cinco: `empezar`, `progresion`, `combate`,
`objetos` y `referencia`. La fase 2 añade `base` y `mundo`.

### Fuera de la fase 1

`La Fosa` tiene dos frases y `Cajas` una, sin documentar cómo se consiguen. Se
quedan fuera hasta tener material: publicar una página de una línea contradice el
tono que pide el brief.

### Fase 2

Cuando haya transcripción de los carteles que faltan: el Nexo y las raids,
subastas, clanes, protecciones de base, elevadores, amigos y clasificaciones.

## El Nexo

Es el sistema con más peso de los que faltan y el que peor tolera una página a
medias: de él dependen las raids, y una regla mal contada sobre cuándo se pierde
un Nexo es la clase de error que cuesta una comunidad.

Del brief solo se puede extraer que existe, que tiene vida, que se puede perder y
que hay raids. Nada más. **Con eso no se escribe una página**, así que aquí queda
fijada la estructura y la lista exacta de lo que falta por transcribir.

### Las tres páginas

Sección `base`, en este orden:

| Página | Slug ES | Slug EN | Responde a |
|---|---|---|---|
| Qué es el Nexo | `nexo` | `nexus` | Qué es, para qué sirve, cómo se consigue el primero |
| Vida del Nexo | `vida-del-nexo` | `nexus-health` | Cuánta vida tiene, cómo se regenera, cómo se pierde |
| Raids | `raids` | `raids` | Quién puede atacar, cuándo, qué se gana y qué se pierde |

### Qué hace falta transcribir

Cada línea es una pregunta que la wiki tiene que poder responder con una cifra o
una regla, no con una aproximación:

**Qué es el Nexo**
- Qué es exactamente: ¿un bloque, una estructura, un objeto que se coloca?
- ¿Cómo consigue un jugador su primer Nexo? ¿Se compra, se craftea, se da al
  entrar?
- ¿Es por jugador o por clan?
- ¿Cuántos puede tener uno?
- ¿Qué comando lo gestiona, si hay alguno?

**Vida del Nexo**
- ¿Cuánta vida tiene? Cifra exacta.
- ¿Se regenera? ¿A qué ritmo?
- ¿Qué le quita vida, y cuánta?
- ¿Qué pasa exactamente cuando llega a cero? ¿Se pierde la base, el terreno, los
  objetos?
- ¿Hay forma de repararlo o de recuperarlo?

**Raids**
- ¿Quién puede atacar un Nexo y bajo qué condiciones?
- ¿Hay horario o ventana de raid? ¿Hay protección para jugadores nuevos o
  desconectados?
- ¿Cuánto dura una raid?
- ¿Qué gana el atacante y qué pierde el defensor? Cifras.
- ¿Qué relación tiene con las protecciones de base y con los clanes?

Hasta que eso esté transcrito, las tres páginas no se crean. **No se publican con
el cuerpo vacío ni con un «próximamente»**: una página de wiki que no responde
nada es peor que no tenerla, porque el jugador ya ha gastado el clic.

## Estructura de direcciones

`/wiki/<slug-es>/` y `/en/wiki/<slug-en>/`, con slug traducido en cada idioma
para que cada versión posicione en su mercado. La correspondencia la mantiene
`par` en `paginas.json` y se materializa en los `<link rel="alternate">` de cada
página generada.

## Sin duplicar lo que ya existe

La web ya tiene `/rangos/` con la comparativa completa y `/tienda/`. La página de
rangos de la wiki explica **cómo funciona** un rango y qué cambia al subir, y
enlaza a las existentes para la tabla y para comprar.

Una sola tabla de cifras en todo el sitio: la que ya existe y ya está vigilada.

## Presentación

`public/css/wiki.css`, nuevo. Barra lateral con las secciones, buscador,
tipografía de artículo y el plegado del menú en móvil, que el brief pide de forma
explícita porque mucha gente consulta desde el teléfono mientras juega.

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

## Decisiones registradas

**Cuerpo en HTML y no en Markdown.** Se valoraron tres opciones: un parser propio
de un subconjunto de Markdown, la librería `markdown`, y HTML directo. El parser
propio se descartó por ser la pieza más frágil del sistema y de fallo sutil. La
librería se descartó porque sería la primera dependencia del repositorio, con su
`requirements.txt` y su `pip install` en la Action, a cambio solo de comodidad de
sintaxis. HTML directo no necesita ninguna de las dos cosas y además da acceso a
las clases de tabla que el sitio ya tiene.

Conviene dejar constancia de que la restricción de «sin dependencias» venía del
script de verificación, que corre en CI, y no es una regla del repositorio: el
README dice «sin build» refiriéndose al sitio desplegado, no a las herramientas.
La decisión se sostiene igualmente por el argumento de fragilidad.

**Metadatos centralizados.** Un `paginas.json` en lugar de cabeceras por archivo,
para poder ver la estructura completa de la wiki y generar el menú sin recorrer
todos los cuerpos.

**El generador falla en vez de improvisar.** Ante una clave desconocida o un
archivo huérfano no genera nada. Un aviso que se ignora acaba publicando una
página rota.

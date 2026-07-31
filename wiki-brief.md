# Brief para construir la wiki de HyperionsMC

> **Cómo usar este documento:** pégalo entero en el chat de la web como primer mensaje. Contiene el
> encargo, las reglas y **todos los datos verificados** del servidor. Está pensado para que quien lo
> reciba pueda construir la wiki sin preguntar nada y, sobre todo, **sin inventarse cifras**.

---

## 1. El encargo

Construir la wiki pública de **HyperionsMC**, un servidor de Minecraft Java + Bedrock (crossplay) con
modalidad **survival** en producción.

**Bilingüe: español e inglés.** Las dos versiones son igual de importantes — la comunidad hispana es
mayoritaria y la internacional está creciendo. Cada página existe en los dos idiomas con selector.
No traduzcas automáticamente y te quedes tan ancho: los textos de abajo ya vienen en ambos idiomas
tal y como los lee el jugador dentro del juego, y **ese es el vocabulario canónico**.

---

## 2. Reglas que no se pueden romper

1. **No inventes ningún número.** Precios, multiplicadores, cooldowns, límites: si no está en este
   documento, no existe. Escribe "consulta en el servidor" antes que poner una cifra plausible.
   Una wiki con datos inventados es peor que no tener wiki: el jugador se siente engañado.
2. **Los comandos van tal cual**, en minúscula y con su barra: `/ec`, `/jobs`, `/shop`. Los comandos
   son iguales en las dos versiones del idioma — **no traduzcas comandos**.
3. **Los nombres propios no se traducen**: Dracma, Nexo/Nexus, La Fosa/The Pit, los rangos
   (Mortal, Hero, Demigod, Titan, Olympian).
4. **Tono:** directo y útil, sin épica de relleno. El jugador viene a resolver una duda concreta.
   Frases cortas. Cada página responde "qué es, cómo se usa, qué me cuesta".
5. **Nada de promesas de obtención sin confirmar.** Si un sistema existe pero no está documentado
   cómo se consigue, dilo: "cómo se obtiene: pendiente de confirmar".

---

## 3. Estructura propuesta

```
Inicio
├─ Primeros pasos          (los 6 pasos del tutorial in-game)
├─ Ganar dinero            (trabajos, misiones, vender, subastas)
├─ Tu base                 (protecciones, homes, clanes)
├─ El Nexo y las raids     (3 páginas: qué es, cómo se pierde, raid)
├─ Combate                 (muertes, bounty, La Fosa, combat log)
├─ Progresión              (rangos, Dracmas, clasificaciones)
├─ Objetos y cosmética     (kits, cajas, cosméticos, bóveda del ender)
└─ Comandos                (tabla completa)
```

---

## 4. Contenido verificado

Lo que sigue está copiado literalmente de los carteles del tutorial in-game. **Es la fuente de la
verdad.** Amplía y desarrolla, pero **no contradigas** estas cifras.

### Primeros pasos

| Tema | Español | English |
|---|---|---|
| **Empezar** | Coge tu equipo gratis con `/kits`. Cada día tienes una recompensa: `/daily`. | Grab your free gear with `/kits`. There is a reward every day: `/daily`. |
| **Ganar dinero** | Elige tus trabajos con `/jobs` y cobra por picar, talar, cultivar o cazar. Completa objetivos con `/missions`. | Pick your jobs with `/jobs` and get paid for mining, chopping, farming or hunting. Complete goals with `/missions`. |
| **Vender** | (ver sección Ganar dinero) | |
| **Proteger tu base** | | |
| **No perderte** | Usa homes | Use homes |
| **No jugar solo** | Clanes | Clans |

> La wiki debe desarrollar estos seis con detalle. El cartel in-game es un resumen de 4 líneas; la
> página web es donde cabe la explicación completa.

### Bóveda del Ender (`/ec`)

- Hasta **3 páginas** de **54 espacios** cada una.
- **No es el cofre del ender normal**, y no se pierde al morir.
- **Titan incluye 1 página. Olympian incluye 2.**
- La tercera se compra en `/shop` por **58 💎**.
- Se cambia de página con `/ec 2` y `/ec 3`.
- Precios de tienda: página 1 = **20 💎**, página 2 = **34 💎**, página 3 = **58 💎**.

EN: *Ender Vault — up to 3 pages of 54 slots each. Not the vanilla ender chest, and you keep it when
you die. Titan includes 1 page; Olympian, 2. The third is sold in `/shop` (58 💎). Switch pages with
`/ec 2` and `/ec 3`.*

### Rangos y Dracma

- Los rangos **multiplican los ingresos de trabajos: de ×1.1 a ×2.0**.
- Suben homes (**de 5 a 40**), protecciones y espacios de subasta.
- Dan **una llave de caja cada 30 días**.
- **La Dracma (💎) es premium: NO se puede comprar con `$`.**
- Se consulta con `/dracma` y se gasta en `/shop`.
- Rangos, de menor a mayor: **Mortal → Hero → Demigod → Titan → Olympian**.

EN: *Ranks multiply your job income: ×1.1 → ×2.0. They also raise homes (5→40), claims and auction
slots, and hand you a crate key every 30 days. Dracma is premium: it cannot be bought with `$`.*

### Matar y morir

- Morir cuesta el **5% de tu dinero**.
- El **mismo asesino solo te cobra una vez cada 15 minutos**.
- Se pone precio a alguien con `/bounty`: **mínimo 100**, **comisión del 5%**.
- Al cobrar una recompensa, **el 1% de TU saldo pasa a tu propia cabeza**.

EN: *Dying costs you 5% of your money. The same killer only charges you once every 15 min. Put a
price on someone with `/bounty` (minimum 100, 5% fee). When you claim a bounty, 1% of YOUR balance
goes onto your own head.*

### La Fosa / The Pit

- **Los traidores van a Prisión.**
- **No huyas en combate** o dejarás un **clon castigable (45 s)**.

EN: *Traitors go to Prison. Do not combat log, or you leave a punishable clone (45 s).*

### Cosméticos

- `/cosmetics` para equipar lo que tengas.
- Algunas mascotas dan mejoras de comodidad (**Velocidad, Prisa, Saciedad**) mientras viajas y
  trabajas.
- **Esas mejoras se APAGAN en cuanto entras en combate.**
- **Ningún cosmético gana una pelea.**

EN: *Open `/cosmetics` to equip what you own. Some pets grant comfort buffs (Speed, Haste,
Saturation) while travelling and working. Those buffs switch OFF the moment you enter combat. No
cosmetic will ever win you a fight.*

### Cajas / Crates

- Se abren para conseguir **mutaciones, alas y mascotas místicas**.

EN: *Open crates to unlock mutations, wings, and mystic pets.*

### Kits

- `/kits`. **Tu rango decide cuáles puedes usar.**
- **Cada kit tiene su propia espera**; los premium están en `/shop`.

EN: *Open `/kits`. Your rank decides which ones you can use. Each kit has its own cooldown; premium
ones live in `/shop`.*

### Misiones

- `/missions`: hay **diarias** y **contratos**.
- Las diarias **se renuevan cada día**; los contratos son más largos.

EN: *Open `/missions`: there are dailies and contracts. Dailies reset every day; contracts run
longer.*

### Otros sistemas que existen y merecen página

Casa de subastas · Clasificaciones · El Nexo (vida, cómo se pierde, raid) · Protecciones de base ·
Clanes · Elevadores · Amigos.

> De estos hay carteles in-game pero **no** los tengo transcritos aquí. Escribe la estructura de la
> página y **deja el cuerpo marcado como pendiente** en vez de inventarlo.

---

## 5. Página de comandos

Tabla con: comando · qué hace · quién puede usarlo. Confirmados hasta ahora:

`/kits` · `/daily` · `/jobs` · `/missions` · `/shop` · `/dracma` · `/ec` · `/ec 2` · `/ec 3` ·
`/bounty` · `/cosmetics`

No añadas comandos que no estén en esta lista sin confirmarlos antes.

---

## 6. Qué hace buena a esta wiki

El jugador que la abre está a media partida, con una duda concreta y poca paciencia. La wiki gana si:

- **El buscador funciona** y encuentra por comando (`/ec`) y por concepto ("bóveda", "vault").
- **Cada página abre con la respuesta**, no con una introducción.
- **Las cifras están en tablas**, no enterradas en párrafos.
- **El cambio de idioma no te saca de la página** en la que estabas.
- **Se ve bien en móvil**: mucha gente la consulta desde el teléfono mientras juega.

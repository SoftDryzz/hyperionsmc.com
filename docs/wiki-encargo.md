# Encargo de la wiki de Hyperions MC — contenido verificado

> **Este es el documento fuente de la wiki.** Todo lo que aparece aquí está
> transcrito de los carteles del tutorial in-game. Sustituye a `wiki-brief.md`,
> que era una versión anterior e incompleta: le faltaban el Nexo, las subastas,
> las clasificaciones y cuatro de los seis primeros pasos.
>
> Ninguna página de la wiki puede contener una cifra que no esté aquí o en
> `data/catalogo.json`.

## Marca

- Nombre: **Hyperions MC**
- Lema: «Tu leyenda comienza aquí» / «Your legend starts here»
- Discord: el publicado en el sitio (`discord.gg/w4aDfwE68`)
- Tienda: `/tienda/` y `/en/store/`

## Reglas

1. **No inventar ningún número.** Si no está aquí, no existe. Antes «consulta en
   el servidor» que una cifra plausible.
2. **Los comandos van literales**, en minúscula y con su barra. No se traducen.
3. **Los nombres propios no se traducen**: Dracma, Nexo/Nexus, La Fosa/The Pit,
   y los rangos (Mortal, Hero, Demigod, Titan, Olympian).
4. **Tono directo.** Cada página responde qué es, cómo se usa y qué cuesta.
   Frases cortas, cifras en tablas.
5. **Nada de promesas sin confirmar.** Si no se sabe cómo se obtiene algo, se
   escribe «cómo se consigue: pendiente de confirmar».
6. **Se ve en móvil.** El buscador encuentra por comando (`/ec`) y por concepto
   («bóveda», «vault»).

---

## Primeros pasos

### ① Empezar / Start here
- **ES** — Coge tu equipo gratis con `/kits`. Y cada día tienes una recompensa: `/daily`.
- **EN** — Grab your free gear with `/kits`. And there is a reward every day: `/daily`.

### ② Ganar dinero / Earn money
- **ES** — Elige tus trabajos con `/jobs` y cobra por picar, talar, cultivar o cazar. Y completa objetivos con `/missions`.
- **EN** — Pick your jobs with `/jobs` and get paid for mining, chopping, farming or hunting. And complete goals with `/missions`.

### ③ Vender / Sell it
- **ES** — Abre la tienda con `/shop`. Vende lo que llevas en la mano con `/sell`. ¿Cuánto vale algo? `/worth`
- **EN** — Open the shop with `/shop`. Sell what you are holding with `/sell`. Want to know a price? `/worth`

### ④ Proteger tu base / Protect your base
- **ES** — Sin protección te la pueden romper. Abre tus protecciones con `/p`. **Hazlo ANTES de construir nada serio.**
- **EN** — Unprotected builds can be broken. Open your claims with `/p`. **Do this BEFORE you build anything serious.**

### ⑤ No te pierdas / Do not get lost
- **ES** — En tu base, escribe `/sethome`. Vuelve desde cualquier sitio con `/home`. Sin esto, encontrar tu casa es cosa de suerte.
- **EN** — At your base, type `/sethome`. Come back from anywhere with `/home`. Without it, finding your house is pure luck.

### ⑥ No juegues solo / Do not play alone
- **ES** — Crea o únete a un clan con `/clan`. Compartís banco, tierras y defensa.
- **EN** — Create or join a clan with `/clan`. Share a bank, land and defence.

---

## El Nexo / The Nexus

### ① Qué es / What it is
**ES**
- El Nexo es el bloque-mena de tu base.
- Vida base **1.1 + 0.5 por miembro**.
- Tú solo = **1.6**. Tope **10.0**.
- Un miembro solo cuenta si ha entrado al server.

**EN**
- The Nexus is your base's claim block.
- Base life **1.1 + 0.5 per member**.
- Alone = **1.6**. Cap **10.0**.
- A member only counts once they have joined.

**Vida base por tier de protección** (aclarado por el owner, 2026-07-29):

| Tier | Base |
|---|---|
| Tiers 1–3 | 1.1 |
| Tier 4 | 2.1 |
| Tier 5 (de pago) | 3.0 |

El Tier 5 solo cambia la vida inicial y el rango de protección en terreno.

**Sobre el tope** (aclarado por el owner, 2026-07-29): la regla real es el tope
de 10.0. Un clan puede seguir admitiendo miembros, pero no suman vida. El
material original decía «a partir de 20 miembros ya no suma», lo que se pisa con
el tope: este llega antes en los tres tiers.

### ② Cómo se pierde / How you lose it
**ES**
- Muerte en **PvP −1.0** · por un **mob −0.5**
- **Caída, lava, void, `/kill` o un compañero: 0**
- Y se multiplica: **Nether ×1.5 · End ×2**
- **Morirte TÚ baja tu propio Nexo.**
- No hay cooldown: cada muerte cuenta al instante.

**EN**
- **PvP death −1.0** · **mob −0.5**
- **Fall, lava, void, `/kill` or a teammate: 0**
- Multiplied: **Nether ×1.5 · End ×2**
- **Your OWN deaths damage your Nexus.**
- No cooldown: every death counts instantly.

### ③ Raid y regeneración / Raid & regen
**ES**
- **Vida 0 = RAIDEABLE 40 min**: sin protección y PvP forzado.
- Regenerar de 0 al máximo: **60 min** (seas 1 o 20).
- **Morir durante la regen reinicia el contador.**
- Ofrenda: clic derecho con diamantes. **8 = −1 min, tope −20 min.**
- Una mena nueva tiene **24 h de gracia**: no puede caer.

**EN**
- **Life 0 = RAIDABLE for 40 min**: no protection, forced PvP.
- Full regen from 0: **60 min** (1 member or 20).
- **Dying during regen restarts the timer.**
- Offering: right-click with diamonds. **8 = −1 min, cap −20 min.**
- A new claim has **24 h of grace**: it cannot fall.

---

## Combate

### Matar y morir / Kill & die
**ES**
- Morir te cuesta el **5% de tu dinero**.
- El **mismo asesino solo te cobra una vez cada 15 min**.
- Pon precio a alguien con `/bounty` (**mínimo 100**, **comisión 5%**).
- Al cobrar una recompensa, **el 1% de TU saldo pasa a tu propia cabeza**.

**EN**
- Dying costs you **5% of your money**.
- The **same killer only charges you once every 15 min**.
- Put a price on someone with `/bounty` (**minimum 100**, **5% fee**).
- When you claim a bounty, **1% of YOUR balance goes onto your own head**.

### La Fosa / The Pit
- **ES** — Los traidores van a **Prisión**. **No huyas en combate** o dejarás un **clon castigable (45 s)**.
- **EN** — Traitors go to **Prison**. **Do not combat log**, or you leave a **punishable clone (45 s)**.

---

## Progresión

### Rangos y Dracma / Ranks & Dracma
**ES**
- Los rangos **multiplican los ingresos de trabajos: ×1.1 → ×2.0**.
- Suben homes (**5 → 40**), protecciones y espacios de subasta.
- Dan **una llave de caja cada 30 días**.
- **La Dracma (💎) es premium: NO se puede comprar con `$`.**
- Míralo con `/dracma`, gástalo en `/shop`.
- Rangos de menor a mayor: **Mortal → Hero → Demigod → Titan → Olympian**.

**EN**
- Ranks **multiply your job income: ×1.1 → ×2.0**.
- They also raise homes (**5 → 40**), claims and auction slots.
- And hand you **a crate key every 30 days**.
- **Dracma (💎) is premium: it cannot be bought with `$`.**
- Check it with `/dracma`, spend it in `/shop`.

> Estos rangos de valores describen de Hero a Olympian. Para Mortal y para el
> reparto exacto por rango manda `data/catalogo.json`, que es más preciso:
> homes 1→40, multiplicador ×1.0→×2.0, y llaves que no siempre son una
> (Demigod recibe 2 Common; Olympian, 1 Epic + 1 Legendary).

### Clasificaciones / Leaderboards
**ES**
- Ábrelas con `/leaderboards`.
- Nivel de trabajos, dinero, kills y muertes.
- **Una muerte solo cuenta si te mató otro jugador**: mobs, lava y caídas no te tocan el K/D.
- Tu K/D lo ve todo el mundo en la lista del TAB.

**EN**
- Open them with `/leaderboards`.
- Job levels, balance, kills and deaths — all ranked.
- **A death only counts if another player killed you**: mobs, lava and falls do not touch your K/D.
- Your K/D is shown to everyone in the TAB list.

---

## Economía

### Casa de subastas / Auction House
**ES**
- Coge un objeto en la mano y escribe `/ah sell`.
- **La comisión del 5% se cobra al publicar, no al vender.**
- Los anuncios duran **48 horas**. Lo que no se venda te espera en `/ah expired`. **No se pierde nada.**
- Huecos: **3 siendo Mortal → 20 siendo Olympian**.

**EN**
- Hold an item and type `/ah sell`.
- **The 5% fee is charged when you list — not when it sells.**
- Listings last **48 hours**. Whatever does not sell waits in `/ah expired`. **Nothing is ever lost.**
- Listing slots: **3 as Mortal → 20 as Olympian**.

---

## Objetos y cosmética

### Bóveda del Ender / Ender Vault
**ES**
- Abre `/ec`: hasta **3 páginas** de **54 espacios** cada una.
- **No es el cofre del ender normal**, y no se pierde al morir.
- **Titan incluye 1 página; Olympian, 2.**
- La tercera se compra en `/shop` (**58 💎**).
- Cambia de página con `/ec 2` y `/ec 3`.
- Precios: página 1 = **20 💎** · página 2 = **34 💎** · página 3 = **58 💎**.

**EN**
- Open `/ec`: up to **3 pages** of **54 slots** each.
- **It is not the vanilla ender chest**, and you keep it when you die.
- **Titan includes 1 page; Olympian, 2.**
- The third one is sold in `/shop` (**58 💎**).
- Switch pages with `/ec 2` and `/ec 3`.

### Kits
- **ES** — Abre `/kits`. **Tu rango decide cuáles puedes usar.** Cada kit tiene su propia espera; los premium están en `/shop`.
- **EN** — Open `/kits`. **Your rank decides which ones you can use.** Each kit has its own cooldown; premium ones live in `/shop`.

### Misiones / Missions
- **ES** — Abre `/missions`: tienes **diarias** y **contratos**. Las diarias se renuevan cada día; los contratos son más largos.
- **EN** — Open `/missions`: there are **dailies** and **contracts**. Dailies reset every day; contracts run longer.

### Cajas / Crates
- **ES** — Abre las Cajas del cielo para conseguir poder antiguo: **mutaciones, alas y mascotas místicas**.
- **EN** — Open sky Crates to achieve ancient power: **mutations, wings, and mystic pets**.

### Cosméticos / Cosmetics
**ES**
- Abre `/cosmetics` para equipar lo que tengas.
- Algunas mascotas dan mejoras de comodidad (**Velocidad, Prisa, Saciedad**) mientras viajas y trabajas.
- **Esas mejoras se APAGAN en cuanto entras en combate.**
- **Ningún cosmético te va a ganar una pelea.**

**EN**
- Open `/cosmetics` to equip what you own.
- Some pets grant comfort buffs (**Speed, Haste, Saturation**) while travelling and working.
- **Those buffs switch OFF the moment you enter combat.**
- **No cosmetic will ever win you a fight.**

---

## Comandos confirmados

`/kits` · `/daily` · `/jobs` · `/missions` · `/shop` · `/sell` · `/worth` · `/p` ·
`/sethome` · `/home` · `/clan` · `/ah sell` · `/ah expired` · `/leaderboards` ·
`/dracma` · `/ec` · `/ec 2` · `/ec 3` · `/bounty` · `/cosmetics`

**Ningún comando fuera de esta lista.**

### Quién puede usar cada uno

Confirmado por el owner el 2026-07-29. **Todos los comandos están abiertos desde
Mortal**; lo que cambia con el rango es el alcance, no el acceso:

| Comando | Quién | Qué cambia con el rango |
|---|---|---|
| `/jobs` `/missions` `/daily` | Todos | — |
| `/shop` `/sell` `/worth` | Todos | — |
| `/clan` `/p` | Todos | — |
| `/bounty` `/leaderboards` `/dracma` | Todos | — |
| `/cosmetics` | Todos | Solo equipas lo que hayas conseguido |
| `/sethome` `/home` | Todos | 1 home (Mortal) → 40 (Olympian) |
| `/ah sell` `/ah expired` | Todos | 3 huecos (Mortal) → 20 (Olympian) |
| `/kits` | Todos | Qué kits puedes reclamar depende del rango |
| `/ec` | Todos | Titan: 1 página · Olympian: 2 · la 3ª se compra (58 💎) |

**`/back` y `/tpa` están abiertos desde Mortal.** `/back` lo era de Hero hasta el
2026-07-29, cuando el owner lo abrió a todos en el servidor; la comparativa y las
tarjetas de la tienda se actualizaron ese mismo día.

`public/como-entrar/index.html` menciona además `/delhome` y `/rules`, que no
están en esta lista. **Pendientes de confirmar** antes de aparecer en la wiki.

---

## Fuera del alcance

- **Elevadores** y **Amigos**: existen, pero sin texto verificado. Estructura sí,
  cuerpo marcado como pendiente. No deducir.
- **La modalidad Prison**: no está lanzada. **La wiki no la menciona**, por
  decisión del owner (2026-07-29). La sección de Prison OP de la portada se
  queda como está: la regla es solo para la wiki.

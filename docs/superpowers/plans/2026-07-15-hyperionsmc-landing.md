# Hyperions MC Landing — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `Hyperions MC Landing.dc.html` en una web estática profesional en `public/`, desplegable en Cloudflare Pages bajo hyperionsmc.com, con stats en vivo y cabeceras de seguridad.

**Architecture:** Sitio 100% estático sin build: `index.html` semántico + `css/styles.css` + `js/main.js` vanilla + fuentes autoalojadas. Cabeceras de seguridad vía `_headers` de Cloudflare Pages. Stats consultadas desde el navegador a `api.mcsrvstat.us`.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, clamp), JavaScript vanilla (ES2020), Cloudflare Pages.

## Global Constraints

- **CSP estricta sin `unsafe-inline`:** prohibido cualquier atributo `style=""`, `<style>`, `onclick=""` o `<script>` inline en `index.html`. Todo en `styles.css` / `main.js` (listeners con `addEventListener`; anchos dinámicos vía CSSOM `el.style.width`, que la CSP sí permite).
- **Prevención de inyecciones:** datos de la API solo con `textContent`, nunca `innerHTML`; números validados con `Number()` y acotados.
- **IP del servidor:** literal `hyperionsmc.com` (no `play.hyperionsmc.com`).
- **Textos en español**, idénticos a la plantilla salvo la IP.
- **Sin dependencias externas** en runtime salvo `https://api.mcsrvstat.us`.
- **Commits:** convencionales, en español, **sin trailer de coautoría**.
- La plantilla `Hyperions MC Landing.dc.html` es la **fuente de verdad visual**: colores, tipografías, espaciados y animaciones se transcriben 1:1.

---

### Task 1: Fuentes autoalojadas

**Files:**
- Create: `public/fonts/*.woff2` (Montserrat 800/900, Manrope 400/600/700/800, subset latin)
- Create: `public/fonts/LICENSIA.txt` (licencia OFL de ambas familias)

**Interfaces:**
- Produces: nombres de archivo `montserrat-800.woff2`, `montserrat-900.woff2`, `manrope-400.woff2`, `manrope-600.woff2`, `manrope-700.woff2`, `manrope-800.woff2` que Task 2 referencia en `@font-face`.

- [ ] **Step 1: Descargar el CSS de Google Fonts con User-Agent moderno** (así devuelve woff2):

```bash
cd "c:/Users/PcVIP/source/repos/hyperionsmc.com"
mkdir -p public/fonts
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
curl -sS -A "$UA" "https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Manrope:wght@400;600;700;800&display=swap" -o /tmp/gf.css
```

- [ ] **Step 2: Extraer las URLs woff2 del bloque latin de cada peso y descargarlas** con los nombres de `Produces`. Verificar: `ls -la public/fonts` → 6 archivos > 10 KB.
- [ ] **Step 3: Añadir LICENSIA.txt** indicando que Montserrat y Manrope se distribuyen bajo SIL Open Font License 1.1 con enlaces a sus repositorios.
- [ ] **Step 4: Commit**

```bash
git add public/fonts && git commit -m "feat: añadir fuentes Montserrat y Manrope autoalojadas (OFL)"
```

**Fallback documentado en la spec:** si la descarga falla, usar Google Fonts remoto y ampliar CSP con `fonts.googleapis.com`/`fonts.gstatic.com`.

---

### Task 2: Maquetación estática (index.html + styles.css + favicon)

**Files:**
- Create: `public/index.html`
- Create: `public/css/styles.css`
- Create: `public/img/favicon.svg`

**Interfaces:**
- Consumes: archivos de fuentes de Task 1.
- Produces: IDs que Task 3 usa desde JS: `sticky-bar`, `sticky-copy-btn`, `sticky-copy-label`, `hero-copy-btn`, `hero-copy-label`, `join-btn`, `join-label`, `stat-count`, `stat-max`, `stat-bar`, `status-pill`, `status-text`, `version-label`.

- [ ] **Step 1: `favicon.svg`** — logo del rayo en hexágono de la plantilla (gradiente #FFD97A→#A855F7, `gradientUnits="userSpaceOnUse"`).
- [ ] **Step 2: `index.html`** semántico, `lang="es"`. Head: title «Hyperions MC — Servidor de Minecraft Survival», meta description, OG (title/description/url/type/locale), `<link rel="icon">`, `<link rel="stylesheet">`, `<script src="/js/main.js" defer>`. Body en este orden: barra sticky (`#sticky-bar`, oculta por defecto), `<header>` (logo + Discord + Tienda), `<main>` con `#top` hero (badge, h1 doble línea, lead, caja IP con `hyperionsmc.com`, CTAs `#join-btn` y Tienda, tags de modos, hint de scroll), `#por-que` (3 tarjetas), `#stats` (widget con `#status-pill` inicial `is-unknown` y texto «CONSULTANDO…», contador `#stat-count` en 0, `#stat-max` 500, barra `#stat-bar`, substats 99.9%/20.0/12k+), y `<footer>` (marca + redes, columnas Servidor/Ayuda/Conéctate con chip de IP, legal). Enlaces sin URL real → `href="#"` con comentario `<!-- TODO: enlace real -->`. Botones de icono con `aria-label`; contador con `aria-live="polite"`.
- [ ] **Step 3: `styles.css`** — transcripción 1:1 de los estilos inline de la plantilla a clases BEM-lite: custom properties de la plantilla en `:root` (`--bg2:#050409`, `--gold:#F4C56A`, `--violet:#A855F7`, `--green:#34D399`, `--muted:#A9A4B8`, etc.), `@font-face` (6 pesos, `font-display:swap`), reset y base (body Manrope, selection dorada, scroll-behavior), keyframes `hy-pulse|hy-ring|hy-float|hy-aurora|hy-rise|hy-sheen|hy-glow`, y por sección: `.sticky-bar` (+`.is-visible`), `.site-header`, `.hero` (overlays, aurora, rejilla con mask, partículas, título con gradientes y sheen, `.ip-box`, botones dorado/violeta con hover), `.card` (+hover translateY -8px y glow violeta/dorado), `.stats-widget` (`.status-pill.is-online|is-offline|is-unknown` verde/rojo/gris, `.progress__fill`, substats), `.site-footer`. Todos los `style-hover="..."` de la plantilla → reglas `:hover`. Estado `.is-copied` para los botones de copiar (gradiente verde `#7CF0B5→#34D399`, texto `#08130d`).
- [ ] **Step 4: Verificar en local:** `npx --yes serve public -l 8123` (o `python -m http.server 8123 -d public`) y abrir con Playwright `http://localhost:8123`. Esperado: página visualmente fiel a la plantilla en 1280px y 390px, sin errores de consola (salvo el fetch de stats aún ausente), favicon visible.
- [ ] **Step 5: Commit**

```bash
git add public/index.html public/css public/img && git commit -m "feat: maquetar landing estática fiel a la plantilla de diseño"
```

---

### Task 3: Interactividad y stats en vivo (js/main.js)

**Files:**
- Create: `public/js/main.js`

**Interfaces:**
- Consumes: IDs de Task 2.
- Produces: comportamiento final de la página; sin API pública para otras tasks.

- [ ] **Step 1: Escribir `main.js`** (IIFE, `'use strict'`), con exactamente esta lógica:

```js
(() => {
  'use strict';

  const SERVER_IP = 'hyperionsmc.com';
  const API_URL = 'https://api.mcsrvstat.us/3/' + SERVER_IP;
  const REFRESH_MS = 60000;
  const MAX_PLAYERS_CAP = 100000;

  const $ = (id) => document.getElementById(id);
  const els = {
    stickyBar: $('sticky-bar'),
    statCount: $('stat-count'),
    statMax: $('stat-max'),
    statBar: $('stat-bar'),
    statusPill: $('status-pill'),
    statusText: $('status-text'),
    versionLabel: $('version-label'),
  };

  /* --- Copiar IP (con feedback y fallback sin Clipboard API) --- */
  const copyButtons = [
    { btn: $('hero-copy-btn'), label: $('hero-copy-label'), original: 'Copiar IP' },
    { btn: $('sticky-copy-btn'), label: $('sticky-copy-label'), original: 'Copiar' },
    { btn: $('join-btn'), label: $('join-label'), original: '¡Únete ya!' },
  ];
  let copyTimer = 0;

  function showCopied() {
    copyButtons.forEach(({ btn, label }) => {
      if (!btn || !label) return;
      btn.classList.add('is-copied');
      label.textContent = '¡Copiada!';
    });
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyButtons.forEach(({ btn, label, original }) => {
        if (!btn || !label) return;
        btn.classList.remove('is-copied');
        label.textContent = original;
      });
    }, 1800);
  }

  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'visually-hidden';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* sin soporte: el usuario copia a mano */ }
    ta.remove();
  }

  function copyIp() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SERVER_IP).then(showCopied, () => { legacyCopy(SERVER_IP); showCopied(); });
    } else {
      legacyCopy(SERVER_IP);
      showCopied();
    }
  }
  copyButtons.forEach(({ btn }) => { if (btn) btn.addEventListener('click', copyIp); });

  /* --- Barra sticky al hacer scroll --- */
  function onScroll() {
    if (els.stickyBar) els.stickyBar.classList.toggle('is-visible', window.scrollY > 560);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Contador animado + barra de progreso --- */
  let rafId = 0;
  function renderCount(value, max) {
    if (els.statCount) els.statCount.textContent = String(value);
    if (els.statBar) {
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      els.statBar.style.width = pct.toFixed(1) + '%';
    }
  }
  function animateCount(target, max) {
    cancelAnimationFrame(rafId);
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      renderCount(Math.round(eased * target), max);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  /* --- Estados del badge --- */
  function setStatus(stateClass, text) {
    if (els.statusPill) {
      els.statusPill.classList.remove('is-online', 'is-offline', 'is-unknown');
      els.statusPill.classList.add(stateClass);
    }
    if (els.statusText) els.statusText.textContent = text;
  }

  /* --- Stats en vivo con validación estricta (anti-inyección) --- */
  function toBoundedInt(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  async function fetchStats() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(API_URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data && data.online === true) {
        const max = toBoundedInt(data.players && data.players.max, 1, MAX_PLAYERS_CAP) || 500;
        const online = toBoundedInt(data.players && data.players.online, 0, max) || 0;
        if (els.statMax) els.statMax.textContent = String(max);
        setStatus('is-online', 'SERVIDOR EN LÍNEA');
        animateCount(online, max);
        const version = typeof data.version === 'string' ? data.version.slice(0, 40) : '';
        if (version && els.versionLabel) els.versionLabel.textContent = 'Java ' + version + ' · Bedrock';
      } else {
        setStatus('is-offline', 'SERVIDOR OFFLINE');
        renderCount(0, 1);
      }
    } catch (err) {
      setStatus('is-unknown', 'ESTADO DESCONOCIDO');
      if (els.statCount) els.statCount.textContent = '—';
      if (els.statBar) els.statBar.style.width = '0%';
    } finally {
      clearTimeout(timeout);
    }
  }

  fetchStats();
  setInterval(fetchStats, REFRESH_MS);
})();
```

(Nota: `toBoundedInt(...) || 0` para `online` es correcto porque 0 es el mínimo válido; para `max` el mínimo es 1, así que `|| 500` solo actúa sobre `null`.)

- [ ] **Step 2: Añadir a `styles.css`** la clase `.visually-hidden { position:fixed; opacity:0; pointer-events:none; }` usada por el fallback de copia.
- [ ] **Step 3: Verificar con Playwright** contra el servidor local: (a) clic en «Copiar IP» → los tres botones muestran «¡Copiada!» y vuelven a su texto en ~1,8 s; (b) `window.scrollTo(0, 800)` → `#sticky-bar` visible, volver arriba → oculta; (c) el widget muestra estado real (el dominio aún no tiene SRV, así que lo esperado hoy es «SERVIDOR OFFLINE» o «ESTADO DESCONOCIDO» — ambos correctos); (d) consola sin errores.
- [ ] **Step 4: Commit**

```bash
git add public/js public/css/styles.css && git commit -m "feat: añadir copia de IP, barra sticky y stats en vivo del servidor"
```

---

### Task 4: Seguridad y extras de despliegue

**Files:**
- Create: `public/_headers`
- Create: `public/robots.txt`

- [ ] **Step 1: `_headers`** exactamente:

```
/*
  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src https://api.mcsrvstat.us; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
```

- [ ] **Step 2: `robots.txt`**:

```
User-agent: *
Allow: /
```

- [ ] **Step 3: Comprobación anti-inline** (debe devolver 0 coincidencias las tres):

```bash
grep -c 'style="' public/index.html; grep -c 'onclick' public/index.html; grep -c '<style' public/index.html
```

- [ ] **Step 4: Commit**

```bash
git add public/_headers public/robots.txt && git commit -m "feat: añadir cabeceras de seguridad (CSP estricta) y robots.txt"
```

---

### Task 5: README con guía de despliegue

**Files:**
- Create: `README.md`

- [ ] **Step 1: Escribir README.md en español** con: descripción del proyecto y estructura; cómo probar en local; despliegue en Cloudflare Pages (Upload assets con `public/`, custom domains `hyperionsmc.com` + `www`); DNS completo con tabla — apex proxied → Pages, `mc` A DNS-only → IP del VPS, SRV `_minecraft._tcp` (prio 0, peso 5, puerto 25565, destino `mc.hyperionsmc.com`); nota Bedrock sin SRV (`mc.hyperionsmc.com:19132`); TLS Full (strict) + HSTS de zona; lista de TODOs pendientes (enlaces Discord/Tienda/YouTube/X/Reglas/Soporte, imagen del hero, og-image).
- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: añadir guía de despliegue en Cloudflare Pages y configuración DNS"
```

---

### Task 6: Verificación final

- [ ] **Step 1:** Servir `public/` y pasar Playwright completo: capturas escritorio (1280×800) y móvil (390×844), copiar IP, sticky, widget, consola limpia.
- [ ] **Step 2:** Revisión del diff completo (`git log --oneline`, `git status` limpio) y checklist de la spec sección a sección.
- [ ] **Step 3:** Enseñar capturas y resumen al usuario con los pasos de despliegue.

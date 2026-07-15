# Diseño: Web oficial hyperionsmc.com (landing del servidor de Minecraft)

**Fecha:** 2026-07-15
**Estado:** Aprobado pendiente de revisión final del usuario

## Objetivo

Convertir la plantilla `Hyperions MC Landing.dc.html` (formato de editor visual, no publicable tal cual) en una web estática profesional, con archivos separados y buenas prácticas de seguridad, desplegada en Cloudflare Pages bajo el dominio `hyperionsmc.com`.

## Decisiones confirmadas con el usuario

- Hosting: **Cloudflare Pages** (el dominio ya está en Cloudflare).
- IP del servidor de Minecraft mostrada en la web: **`hyperionsmc.com`** (no `play.hyperionsmc.com` como trae la plantilla).
- Stats del widget: **datos reales** vía la API pública `api.mcsrvstat.us`.
- Enlaces de Discord, Tienda, YouTube, X, Reglas y Soporte: la plantilla no trae URLs reales (`#`); quedan marcados como `TODO` visibles en el código para rellenar después.
- Sin imagen para el fondo del hero por ahora: se usa el fondo degradado/aurora del propio diseño, con el hueco preparado y documentado para añadir una imagen más adelante.
- Estilo de trabajo: **profesional** — archivos separados, cabeceras de seguridad, prevención de inyecciones, guía de despliegue.

## Estructura de archivos

```
hyperionsmc.com/
├── public/                  ← carpeta que se despliega en Cloudflare Pages
│   ├── index.html           ← estructura semántica, sin estilos inline
│   ├── css/styles.css       ← todos los estilos (hover, animaciones, responsive)
│   ├── js/main.js           ← copiar IP, barra sticky, contador, stats en vivo
│   ├── fonts/               ← Montserrat + Manrope autoalojadas (woff2, subset latin)
│   ├── img/favicon.svg      ← logo del rayo del diseño
│   ├── _headers             ← cabeceras de seguridad (Cloudflare Pages)
│   └── robots.txt
├── docs/superpowers/specs/  ← este documento
└── README.md                ← guía de despliegue y mantenimiento en español
```

La plantilla original `Hyperions MC Landing.dc.html` se conserva en la raíz como referencia de diseño (no se despliega).

## Conversión de la plantilla

- Fidelidad visual 100%: hero con aurora animada, partículas flotantes, barra sticky con la IP al hacer scroll, tarjetas "Por qué Hyperions", widget de stats, footer.
- Los estilos inline pasan a clases en `styles.css`; los atributos `style-hover` (sintaxis del editor, no HTML válido) se convierten en reglas `:hover` reales.
- La lógica React-like del `.dc.html` (`DCLogic`, refs `{{ }}`) se reescribe como JavaScript vanilla (~100 líneas), sin frameworks ni dependencias.
- `lang="es"`, `<title>`, meta description y etiquetas Open Graph (título, descripción, URL) para que el enlace se vea bien al compartirlo en Discord/redes.
- HTML semántico: `<header>`, `<main>`, `<section>`, `<footer>`, `aria-label` en botones de iconos, `aria-live="polite"` en el contador de jugadores.

## Stats en vivo

- Al cargar, `js/main.js` consulta `https://api.mcsrvstat.us/3/hyperionsmc.com` (API pública gratuita, llamada desde el navegador — sin backend propio).
- Se refresca cada 60 segundos.
- **Validación estricta de la respuesta** (prevención de inyecciones): los valores se convierten con `Number()`, se acotan (`0 ≤ online ≤ max ≤ 100000`), y solo se escriben en el DOM con `textContent` — nunca `innerHTML`. Un atacante que comprometiera la API no podría inyectar HTML/JS en la web.
- Estados del badge:
  - **En línea** (verde): jugadores online/máximo reales + contador animado + barra de progreso.
  - **Offline** (rojo): badge "SERVIDOR OFFLINE", contador a 0.
  - **API no disponible / error de red** (gris): badge "ESTADO DESCONOCIDO", se muestran «—» en vez de números inventados.
- El texto "Java 1.21.x · Bedrock" se actualiza con la versión real que devuelva la API si está disponible; si no, se mantiene el literal.

## Seguridad

Archivo `_headers` de Cloudflare Pages con:

```
/*
  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src https://api.mcsrvstat.us; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
```

- CSP **sin `unsafe-inline`**: por eso todos los estilos y scripts van en archivos propios, ninguno inline.
- Fuentes autoalojadas → no hay terceros en la CSP (solo la API de stats en `connect-src`) y se evita el problema RGPD de Google Fonts en la UE.
- Sin cookies, sin formularios, sin almacenamiento local: superficie de ataque mínima.
- HSTS se recomienda activarlo a nivel de zona en Cloudflare (SSL/TLS → Edge Certificates); se documenta en el README en lugar de fijarlo en `_headers` para no arriesgar bloqueos si algún subdominio aún no tiene TLS.
- Fallback de fuentes: si la descarga de los woff2 fallara durante la implementación, se usará Google Fonts con `preconnect` y la CSP se ampliará solo con `fonts.googleapis.com` / `fonts.gstatic.com` (se anotará en README).

## Despliegue y DNS (guía en README.md)

1. **Cloudflare Pages:** Workers & Pages → Create → Pages → *Upload assets* → arrastrar la carpeta `public/` → nombre del proyecto (p. ej. `hyperionsmc`).
2. **Dominio:** en el proyecto de Pages → Custom domains → añadir `hyperionsmc.com` y `www.hyperionsmc.com` (Cloudflare crea los registros automáticamente al estar el dominio en la misma cuenta).
3. **Minecraft + web en el mismo dominio** (punto crítico):
   - La web: apex `hyperionsmc.com` → Pages (registro proxied, nube naranja).
   - El servidor: registro `A` llamado `mc` → IP real del VPS del servidor, **DNS only (nube gris)** — el proxy de Cloudflare no soporta el protocolo de Minecraft.
   - Registro `SRV` `_minecraft._tcp.hyperionsmc.com` → prioridad 0, peso 5, puerto 25565, destino `mc.hyperionsmc.com`. Así los jugadores de **Java** escriben `hyperionsmc.com` y entran.
   - **Bedrock no soporta SRV**: los jugadores de Bedrock deberán usar `mc.hyperionsmc.com` + puerto (19132 por defecto). Documentado en README.
4. TLS: modo Full (strict) recomendado + HSTS a nivel de zona.

## Verificación antes de dar por terminado

- Servir `public/` con un servidor HTTP local y abrirla con Playwright: captura en escritorio y móvil, prueba del botón «Copiar IP», de la barra sticky al hacer scroll y del widget de stats contra la API real.
- Nota: `_headers` solo tiene efecto en Cloudflare Pages; en local se verifica el resto.

## Fuera de alcance (futuro)

- Páginas adicionales (reglas, staff, sanciones).
- Imagen/render para el hero y og-image para redes.
- Tienda (Tebex/CraftingStore) y widget de Discord.

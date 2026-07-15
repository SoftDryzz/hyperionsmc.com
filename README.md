# Hyperions MC — Web oficial (hyperionsmc.com)

Landing estática del servidor de Minecraft **Hyperions MC**. Sin frameworks, sin build:
HTML + CSS + JavaScript vanilla, con fuentes autoalojadas y cabeceras de seguridad estrictas.

## Estructura

```
public/                  ← carpeta que se despliega (raíz del sitio)
├── index.html           Página principal
├── css/styles.css       Estilos (sin estilos inline: CSP estricta)
├── js/main.js           Copiar IP, barra sticky y stats en vivo
├── fonts/               Montserrat y Manrope autoalojadas (woff2, licencia OFL)
├── img/logo.svg         Logo «Rayo del Olimpo» · img/favicon.svg
├── _headers             Cabeceras de seguridad para Cloudflare Pages
└── robots.txt
docs/superpowers/        Spec y plan de diseño
Hyperions MC Landing.dc.html   Plantilla de diseño original (no se despliega)
```

## Probar en local

```bash
python -m http.server 8123 -d public
# o: npx serve public -l 8123
```

Abrir <http://localhost:8123>. Nota: el archivo `_headers` solo tiene efecto en Cloudflare Pages.

## Stats en vivo

`js/main.js` consulta cada 60 s la API pública [mcsrvstat.us](https://api.mcsrvstat.us)
(`https://api.mcsrvstat.us/3/hyperionsmc.com`) y actualiza jugadores online/máximo,
la barra de ocupación, la versión de Java y el badge de estado (en línea / offline / desconocido).
Los valores se validan (`Number()` + acotado) y se insertan solo con `textContent`.

## Desplegar en Cloudflare Pages

1. En el panel de Cloudflare: **Workers & Pages → Create → Pages → Upload assets**.
2. Nombre del proyecto: `hyperionsmc` (dará `hyperionsmc.pages.dev`).
3. Arrastrar **el contenido de la carpeta `public/`** (o la carpeta entera) y desplegar.
4. Comprobar que `https://hyperionsmc.pages.dev` funciona.
5. Para actualizar la web más adelante: mismo proyecto → **Create new deployment** → subir `public/` otra vez.

## DNS: web y servidor de Minecraft en el mismo dominio

⚠️ **Orden importante.** Ahora mismo `hyperionsmc.com` (apex) apunta a la IP del VPS de Minecraft.
Si conectas el apex a Pages sin preparar antes el SRV, los jugadores de Java perderán la conexión.
Sigue este orden:

### Paso 1 — Crear el subdominio del servidor (antes de tocar nada)

En **DNS → Records** de Cloudflare:

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| A | `mc` | IP del VPS de Minecraft | **DNS only (nube gris)** — el proxy de Cloudflare no soporta el protocolo de Minecraft |

### Paso 2 — Crear el registro SRV para Java

| Campo | Valor |
|-------|-------|
| Tipo | SRV |
| Nombre | `_minecraft._tcp` |
| Prioridad | `0` |
| Peso | `5` |
| Puerto | `25565` (o el puerto real del servidor) |
| Destino | `mc.hyperionsmc.com` |

Verifica que puedes entrar al servidor en Minecraft Java tanto con `mc.hyperionsmc.com`
como con `hyperionsmc.com` (esta última ya resuelve vía SRV).

### Paso 3 — Conectar el dominio a la web

En el proyecto de Pages: **Custom domains → Set up a domain** → `hyperionsmc.com` y también `www.hyperionsmc.com`.
Cloudflare sustituirá el registro A del apex por la ruta hacia Pages (proxied, nube naranja).
Los jugadores de Java no se ven afectados: el SRV del Paso 2 sigue resolviendo al VPS.

### Bedrock (importante)

Bedrock **no soporta registros SRV**. Los jugadores de Bedrock deben conectarse con:
**Dirección:** `mc.hyperionsmc.com` · **Puerto:** `19132` (o el que tengas configurado con Geyser).

### TLS

En **SSL/TLS**: modo **Full (strict)**. Opcional pero recomendado: activar **HSTS**
en Edge Certificates una vez comprobado que todo carga por HTTPS.

## Seguridad

- CSP estricta sin `unsafe-inline` (ver `public/_headers`): solo scripts/estilos/fuentes propios
  y `connect-src` limitado a la API de stats. Sin cookies, formularios ni almacenamiento.
- `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
- Datos externos al DOM únicamente con `textContent` (anti-XSS).

## Pendientes (TODO)

Buscar `TODO` en `public/index.html`:

- Enlace de invitación de **Discord** (aparece en cabecera, footer y ayuda).
- URL de la **tienda** (botones «Tienda» y «Tienda Oficial»).
- Enlaces de **YouTube** y **X**.
- Páginas de **Reglas** y **Soporte**.
- Imagen/render del servidor para el fondo del hero (`.hero__bg` en `css/styles.css`)
  y una imagen **og-image** para compartir en redes.

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
├── _headers             (solo tendría efecto en Cloudflare Pages; en el VPS puede borrarse)
└── robots.txt
deploy/Caddyfile-hyperionsmc    Bloque de Caddy para el VPS (web + HTTPS automático)
docs/superpowers/        Spec y plan de diseño
Hyperions MC Landing.dc.html    Plantilla de diseño original (no se despliega)
```

## Probar en local

```bash
python -m http.server 8123 -d public
# o: npx serve public -l 8123
```

Abrir <http://localhost:8123>.

## Idiomas (ES/EN)

- Español en la raíz (`/`, `/rangos/`, ...) e inglés bajo `/en/` (`/en/ranks/`, `/en/store/`, ...),
  con `hreflang` cruzados para SEO.
- `js/lang.js` detecta el idioma del navegador en la primera visita: español → ES;
  **cualquier otro idioma o desconocido → EN** (inglés como idioma por defecto inclusivo).
- El botón ES/EN de la cabecera guarda la preferencia manual (localStorage `hy-lang`),
  que manda sobre la detección automática.
- `js/main.js` y `js/tienda.js` son bilingües: leen el atributo `lang` del `<html>`.

## Stats en vivo

`js/main.js` consulta cada 60 s la API pública [mcsrvstat.us](https://api.mcsrvstat.us)
(`https://api.mcsrvstat.us/3/hyperionsmc.com`) y actualiza jugadores online/máximo,
la barra de ocupación, la versión de Java y el badge de estado (en línea / offline / desconocido).
Los valores se validan (`Number()` + acotado) y se insertan solo con `textContent`.

## DNS (estado final — ya configurado)

Todo cuelga del dominio raíz; los jugadores de **Java y Bedrock** y el navegador usan
`hyperionsmc.com` a secas:

| Tipo | Name | Valor | Proxy |
|------|------|-------|-------|
| A | `@` (hyperionsmc.com) | `82.208.23.8` (VPS) | **DNS only (nube gris)** — nunca activar el proxy naranja: rompería Minecraft |
| SRV | `_minecraft._tcp` | target `hyperionsmc.com`, puerto `25565` | DNS only |

- El SRV es redundante con el A del apex (no hace daño; puede quedarse o borrarse).
- Bedrock: `hyperionsmc.com`, puerto `19132` (o el configurado en Geyser).
- Opcional: registro A `www` → misma IP (DNS only) si se quiere que `www.hyperionsmc.com` funcione.

## Despliegue: en el VPS con Caddy

La web se sirve desde el mismo VPS del servidor de Minecraft (`82.208.23.8`, alias SSH `contabo`,
usuario `hyperion`, puerto 2222). El VPS ya usa **Caddy** como servidor web (sirve también
`api.softdryzz.com`); Caddy gestiona el certificado HTTPS y su renovación automáticamente,
así que no hacen falta nginx ni certbot.

Requisitos ya cumplidos: UFW con `Nginx Full` (80/443) permitido y DNS `@` → VPS (DNS only).

### 1. Subir la web (desde este PC, en la carpeta del proyecto)

```powershell
scp -r public contabo:~
```

### 2. Colocarla y configurar Caddy (dentro de `ssh contabo`)

```bash
sudo mkdir -p /var/www/hyperionsmc
sudo cp -r ~/public/. /var/www/hyperionsmc/
sudo rm -f /var/www/hyperionsmc/_headers   # archivo solo útil en Cloudflare Pages
# Añadir el bloque de deploy/Caddyfile-hyperionsmc al final de /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy pide el certificado a Let's Encrypt en el primer arranque del sitio (~30 s)
y lo renueva solo. Comprobar: <https://hyperionsmc.com>.

### Actualizar la web más adelante

```powershell
scp -r public contabo:~
ssh -t contabo "sudo cp -r ~/public/. /var/www/hyperionsmc/ && sudo rm -f /var/www/hyperionsmc/_headers && sudo chmod -R a+rX /var/www/hyperionsmc"
```

Notas: el `-t` de ssh es imprescindible para que sudo pueda pedir la contraseña en una sola línea;
el `chmod -R a+rX` también, porque el umask endurecido del VPS crea los archivos copiados por
root como privados y Caddy devolvería 403/404.

## Seguridad

- CSP estricta sin `unsafe-inline` (en `deploy/Caddyfile-hyperionsmc`): solo scripts/estilos/fuentes
  propios y `connect-src` limitado a la API de stats. Sin cookies, formularios ni almacenamiento.
- `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
- Datos externos al DOM únicamente con `textContent` (anti-XSS).
- HSTS: cuando HTTPS lleve unos días estable, añadir al bloque `header` del Caddyfile:
  `Strict-Transport-Security "max-age=31536000"`.

## Alternativa descartada: Cloudflare Pages

Se descartó por decisión de diseño del DNS: alojar la web en Pages exige que el apex `@`
apunte a Cloudflare, lo que obliga a crear un nombre auxiliar (p. ej. `mc.`) como target del SRV
para que Java siga llegando al VPS. Se prefirió mantener todo el DNS en `@`.

## Pendientes (TODO)

Buscar `TODO` en `public/index.html`:

- Enlace de invitación de **Discord** (aparece en cabecera, footer y ayuda).
- URL de la **tienda** (botones «Tienda» y «Tienda Oficial»).
- Enlaces de **YouTube** y **X**.
- Páginas de **Reglas** y **Soporte**.
- Imagen/render del servidor para el fondo del hero (`.hero__bg` en `css/styles.css`)
  y una imagen **og-image** para compartir en redes.

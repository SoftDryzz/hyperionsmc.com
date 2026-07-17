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

## Despliegue: VPS Raiola con Caddy

Desde julio de 2026 el dominio apunta al **VPS de Raiola Madrid** (`201.46.112.30`, alias SSH
`raiola`, usuario `hyperion`, puerto 2222) — el «escudo» público de Hyperions MC. Caddy sirve la
web desde `/var/www/hyperionsmc` con HTTPS automático (bloque en `deploy/Caddyfile-hyperionsmc`).
El Contabo (`82.208.23.8`, alias `contabo`) queda como máquina interna; tiene el mismo montaje.

Ambos VPS tienen instalado el script **`/usr/local/bin/hyperion-deploy`** (copia
`~/public` → `/var/www/hyperionsmc`, quita `_headers` y arregla permisos) con permiso sudo
sin contraseña **solo para ese script** (`/etc/sudoers.d/hyperion-deploy`).

### Desplegar (3 comandos, sin contraseñas si la clave está en el ssh-agent)

```powershell
ssh raiola "rm -rf ~/public"
scp -r public raiola:~
ssh raiola "sudo /usr/local/bin/hyperion-deploy"
```

Notas: el `rm -rf ~/public` previo evita que scp anide `public/public`; la clave se añade al
agente una vez con `ssh-add C:\Users\PcVIP\.ssh\raiola_vps`. Ejecutar los comandos de uno en
uno (pegar varios `ssh`/`scp` a la vez hace que el primero se trague los siguientes).

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

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
deploy/nginx-hyperionsmc.conf   Configuración de nginx para el VPS
docs/superpowers/        Spec y plan de diseño
Hyperions MC Landing.dc.html    Plantilla de diseño original (no se despliega)
```

## Probar en local

```bash
python -m http.server 8123 -d public
# o: npx serve public -l 8123
```

Abrir <http://localhost:8123>.

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

## Despliegue: en el VPS con nginx

La web se sirve desde el mismo VPS del servidor de Minecraft (`82.208.23.8`).
Pasos (Ubuntu/Debian; ajustar `root@` si se usa otro usuario):

### 1. Instalar nginx y certbot (una sola vez, en el VPS)

```bash
ssh root@82.208.23.8
apt update && apt install -y nginx certbot python3-certbot-nginx
mkdir -p /var/www/hyperionsmc
exit
```

### 2. Subir la web y la configuración (desde este PC, en la carpeta del proyecto)

```powershell
scp -r public/* root@82.208.23.8:/var/www/hyperionsmc/
scp deploy/nginx-hyperionsmc.conf root@82.208.23.8:/etc/nginx/sites-available/hyperionsmc.conf
```

### 3. Activar el sitio (en el VPS)

```bash
ssh root@82.208.23.8
ln -s /etc/nginx/sites-available/hyperionsmc.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Si hay firewall UFW activo: `ufw allow 'Nginx Full'`.
Probar: <http://hyperionsmc.com> debe mostrar la web.

### 4. HTTPS con Let's Encrypt (en el VPS)

```bash
certbot --nginx -d hyperionsmc.com
# (añadir -d www.hyperionsmc.com solo si se creó el registro A www)
certbot renew --dry-run   # comprobar la renovación automática
```

Certbot configura el certificado, la redirección HTTP→HTTPS y la renovación sola cada ~60 días.

### Actualizar la web más adelante

Repetir solo el `scp` del paso 2 (primera línea). Nada más.

## Seguridad

- CSP estricta sin `unsafe-inline` (en `deploy/nginx-hyperionsmc.conf`): solo scripts/estilos/fuentes
  propios y `connect-src` limitado a la API de stats. Sin cookies, formularios ni almacenamiento.
- `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
- Datos externos al DOM únicamente con `textContent` (anti-XSS).
- HSTS: activarlo en la config de nginx (línea comentada) cuando HTTPS lleve unos días estable.

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

# Corrección de datos de rangos y ampliación de la tienda — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir todos los datos de rangos de la web contra la base de datos de permisos, añadir las secciones de llaves y Dracmas, y dejar un check automático que impida que vuelvan a divergir.

**Architecture:** Sitio estático sin build. `data/catalogo.json` es la fuente de verdad legible por máquina; el HTML declara lo que afirma con atributos `data-catalog`; un script de Python en stdlib compara ambos y corre en GitHub Actions y antes de cada deploy. El HTML sigue siendo la fuente del contenido para SEO y funcionamiento sin JS.

**Tech Stack:** HTML + CSS + JavaScript vanilla, sin frameworks ni dependencias. Python 3.12 (solo stdlib: `json`, `html.parser`, `re`, `unittest`, `urllib`) para el check. PowerShell para el wrapper de deploy. GitHub Actions para CI.

**Spec:** `docs/superpowers/specs/2026-07-26-datos-rangos-y-tienda-design.md`

## Global Constraints

- **Sin `innerHTML`.** Solo `textContent` y `createElement`. Regla del repositorio, anti-XSS.
- **Sin `style` inline y sin `<script>` inline.** El Caddyfile declara `default-src 'none'; script-src 'self'; style-src 'self'` sin `unsafe-inline`: cualquier estilo inline se descarta en producción y no se ve en local.
- **Sin dependencias nuevas.** No se añade `package.json`. Python solo con biblioteca estándar.
- **Texto de jugador en español en `/` y en inglés en `/en/`.** Los nombres de comandos (`/fly`, `/ec`) y de rango (Hero, Demigod, Titan, Olympian) se quedan en inglés en ambos idiomas, igual que los tiers de llave (Common, Rare, Epic, Legendary, Mythic).
- **`data-catalog` solo sobre cifras**, nunca sobre prosa. Números, multiplicadores, importes y cadenas idénticas en ambos idiomas (`1 Common`, `—`). Nada que se traduzca.
- **Precios sin IVA.** Tebex lo aplica en el pago según el país del comprador. Todo bloque de precios lleva el aviso al lado.
- **Llaves, Dracmas y Protección no enlazan a Tebex.** Sus paquetes no existen todavía: botón deshabilitado, nunca un `href`.
- **Commits convencionales y sin línea `Co-Authored-By`.**

---

### Task 1: Fuente de verdad y verificador

**Files:**
- Create: `data/catalogo.json`
- Create: `tools/check_catalogo.py`
- Test: `tools/test_check_catalogo.py`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `normalize(raw: str) -> str` — canoniza un valor mostrado.
  - `flatten(catalog: dict) -> dict[str, str]` — aplana a claves con punto, valores ya normalizados.
  - `extract_claims(html_text: str) -> dict[str, str]` — mapea `data-catalog` a su texto normalizado.
  - `check_match(claims, flat, label) -> list[str]` — errores de valor o clave desconocida.
  - `check_coverage(flat, claims_es, claims_en) -> list[str]` — claves ausentes en algún idioma.
  - `ES_FILES` / `EN_FILES` — listas de rutas relativas al repositorio.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tools/test_check_catalogo.py`:

```python
import unittest
from check_catalogo import normalize, flatten, extract_claims, check_match, check_coverage


class TestNormalize(unittest.TestCase):
    def test_precio_es_y_en_coinciden(self):
        self.assertEqual(normalize('4,99 €'), normalize('€4.99'))
        self.assertEqual(normalize('4,99 €'), '4.99')

    def test_entero_sin_moneda_no_gana_decimales(self):
        self.assertEqual(normalize('5'), '5')

    def test_multiplicador_y_guion_intactos(self):
        self.assertEqual(normalize('×1.1'), '×1.1')
        self.assertEqual(normalize('—'), '—')

    def test_espacios_colapsan(self):
        self.assertEqual(normalize('  1   Common \n'), '1 Common')


class TestFlatten(unittest.TestCase):
    def test_claves_con_punto_y_valores_normalizados(self):
        plano = flatten({'rango': {'hero': {'homes': 5}},
                         'precio': {'hero': {'mensual': '4,99 €'}}})
        self.assertEqual(plano['rango.hero.homes'], '5')
        self.assertEqual(plano['precio.hero.mensual'], '4.99')


class TestExtractClaims(unittest.TestCase):
    def test_lee_atributo_y_texto(self):
        html = '<td class="x" data-catalog="rango.hero.homes">5</td>'
        self.assertEqual(extract_claims(html), {'rango.hero.homes': '5'})

    def test_ignora_svg_y_etiquetas_anidadas(self):
        html = ('<span data-catalog="precio.hero.mensual">'
                '<svg><path d="M20 6 9 17l-5-5"></path></svg>'
                '4,99&nbsp;€</span>')
        self.assertEqual(extract_claims(html),
                         {'precio.hero.mensual': '4.99'})

    def test_etiqueta_repetida_dentro_no_cierra_antes(self):
        html = ('<div data-catalog="rango.titan.homes">'
                '<div>20</div></div>')
        self.assertEqual(extract_claims(html), {'rango.titan.homes': '20'})


class TestCheckMatch(unittest.TestCase):
    def test_valor_divergente_falla(self):
        errs = check_match({'rango.hero.homes': '3'},
                           {'rango.hero.homes': '5'}, 'p.html')
        self.assertEqual(len(errs), 1)
        self.assertIn('rango.hero.homes', errs[0])
        self.assertIn('p.html', errs[0])

    def test_clave_inexistente_en_json_falla(self):
        errs = check_match({'rango.hero.inventado': '1'}, {}, 'p.html')
        self.assertEqual(len(errs), 1)
        self.assertIn('inventado', errs[0])

    def test_coincidencia_no_da_error(self):
        self.assertEqual(
            check_match({'rango.hero.homes': '5'},
                        {'rango.hero.homes': '5'}, 'p.html'), [])


class TestCheckCoverage(unittest.TestCase):
    def test_clave_ausente_en_ingles_falla(self):
        errs = check_coverage({'rango.hero.homes': '5'},
                              {'rango.hero.homes'}, set())
        self.assertEqual(len(errs), 1)
        self.assertIn('EN', errs[0])

    def test_presente_en_ambos_no_da_error(self):
        self.assertEqual(
            check_coverage({'rango.hero.homes': '5'},
                           {'rango.hero.homes'}, {'rango.hero.homes'}), [])


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Ejecutar los tests y comprobar que fallan**

Run: `cd tools && python -m unittest test_check_catalogo -v`
Expected: FAIL con `ModuleNotFoundError: No module named 'check_catalogo'`

- [ ] **Step 3: Escribir `data/catalogo.json`**

```json
{
  "_fuente": "docs/superpowers/specs/2026-07-26-datos-rangos-y-tienda-design.md",
  "_aviso": "Fuente de verdad del catalogo. Cambiar aqui primero; el HTML se compara contra este archivo.",
  "rango": {
    "mortal":   { "homes": 1,  "multiplicador": "×1.0",  "protecciones": 3,  "llaves": "—",        "subastas": 3,  "kits": "—" },
    "hero":     { "homes": 5,  "multiplicador": "×1.1",  "protecciones": 6,  "llaves": "1 Common", "subastas": 5,  "kits": 2 },
    "demigod":  { "homes": 10, "multiplicador": "×1.25", "protecciones": 10, "llaves": "2 Common", "subastas": 8,  "kits": 3 },
    "titan":    { "homes": 20, "multiplicador": "×1.5",  "protecciones": 15, "llaves": "1 Rare",   "subastas": 12, "kits": 6 },
    "olympian": { "homes": 40, "multiplicador": "×2.0",  "protecciones": 20, "llaves": "1 Epic",   "subastas": 20, "kits": 8 }
  },
  "precio": {
    "hero":     { "mensual": "4,99 €",  "permanente": "18,46 €" },
    "demigod":  { "mensual": "9,99 €",  "permanente": "36,96 €" },
    "titan":    { "mensual": "19,99 €", "permanente": "73,96 €" },
    "olympian": { "mensual": "34,99 €", "permanente": "129,46 €" }
  },
  "llave": {
    "common":    { "x1": "1,40 €",  "x5": "6,30 €",   "x10": "11,20 €" },
    "rare":      { "x1": "3,50 €",  "x5": "15,75 €",  "x10": "28,00 €",  "ingame": 5 },
    "epic":      { "x1": "7,00 €",  "x5": "31,50 €",  "x10": "56,00 €",  "ingame": 10 },
    "legendary": { "x1": "14,00 €", "x5": "63,00 €",  "x10": "112,00 €", "ingame": 15 },
    "mythic":    { "x1": "28,00 €", "x5": "126,00 €", "x10": "224,00 €", "ingame": 30 }
  },
  "dracma": {
    "p10":  { "cantidad": 10,  "precio": "7,00 €" },
    "p25":  { "cantidad": 25,  "precio": "15,75 €" },
    "p50":  { "cantidad": 50,  "precio": "28,00 €" },
    "p100": { "cantidad": 100, "precio": "49,00 €" }
  },
  "proteccion": { "precio": "22,00 €", "ingame": 31 },
  "_tebex": {
    "_nota": "Sin enlaces directos a paquete: la tienda es una sola pagina sin rutas. Rellenar con .../package/<id> cuando se saquen los IDs del panel.",
    "raiz": "https://hyperionsmc.tebex.store"
  }
}
```

`_tebex` empieza por guion bajo **a proposito**: `flatten` salta esas claves, asi
que la URL no entra en la comprobacion de cobertura. Es configuracion, no un
valor que se muestre en la pagina — si entrara, el check exigiria encontrarla
como texto visible en ES y en EN, y fallaria siempre.

- [ ] **Step 4: Escribir `tools/check_catalogo.py`**

```python
#!/usr/bin/env python3
"""Comprueba que el HTML publicado dice lo mismo que data/catalogo.json.

Verifica dos cosas:
  1. Coincidencia — todo data-catalog del HTML cuadra con el JSON.
  2. Cobertura   — toda clave del JSON aparece en espanol y en ingles.

Solo biblioteca estandar. Salida 0 si todo cuadra, 1 si no.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CATALOGO = RAIZ / 'data' / 'catalogo.json'

ES_FILES = ['public/index.html', 'public/rangos/index.html', 'public/tienda/index.html']
EN_FILES = ['public/en/index.html', 'public/en/ranks/index.html', 'public/en/store/index.html']

# Etiquetas que nunca cierran: no deben mover la profundidad del capturador.
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
        'meta', 'param', 'source', 'track', 'wbr',
        'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'use'}

_DECIMAL = re.compile(r'-?\d+[.,]\d{1,2}')


def normalize(raw):
    """Canoniza un valor mostrado para poder comparar ES contra EN.

    '4,99 €' y '€4.99' dan ambos '4.99'. Un entero sin moneda se queda
    como esta: homes vale '5', no '5.00'.
    """
    s = raw.replace(' ', ' ')  # nbsp -> espacio normal
    s = ' '.join(s.split()).strip()
    con_moneda = '€' in s
    s = s.replace('€', '').strip()
    if con_moneda or _DECIMAL.fullmatch(s):
        try:
            return f'{float(s.replace(",", ".")):.2f}'
        except ValueError:
            pass
    return s


def flatten(catalog, prefijo=''):
    """Aplana el catalogo a claves con punto. Ignora las que empiezan por _."""
    plano = {}
    for clave, valor in catalog.items():
        if clave.startswith('_'):
            continue
        ruta = f'{prefijo}{clave}'
        if isinstance(valor, dict):
            plano.update(flatten(valor, ruta + '.'))
        else:
            plano[ruta] = normalize(str(valor))
    return plano


class _ClaimParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.claims = {}
        self._cap = None  # [clave, etiqueta, profundidad, trozos]

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        if self._cap is not None:
            if tag == self._cap[1]:
                self._cap[2] += 1
            return
        atributos = dict(attrs)
        if 'data-catalog' in atributos:
            self._cap = [atributos['data-catalog'], tag, 1, []]

    def handle_startendtag(self, tag, attrs):
        return  # <foo /> nunca abre nivel

    def handle_endtag(self, tag):
        if self._cap is None or tag in VOID or tag != self._cap[1]:
            return
        self._cap[2] -= 1
        if self._cap[2] == 0:
            clave, _, _, trozos = self._cap
            self.claims[clave] = normalize(''.join(trozos))
            self._cap = None

    def handle_data(self, data):
        if self._cap is not None:
            self._cap[3].append(data)


def extract_claims(html_text):
    p = _ClaimParser()
    p.feed(html_text)
    return p.claims


def check_match(claims, flat, label):
    errores = []
    for clave, valor in sorted(claims.items()):
        if clave not in flat:
            errores.append(f'{label}: clave desconocida "{clave}" (no esta en catalogo.json)')
        elif flat[clave] != valor:
            errores.append(f'{label}: "{clave}" dice {valor!r}, el catalogo dice {flat[clave]!r}')
    return errores


def check_coverage(flat, claims_es, claims_en):
    errores = []
    for clave in sorted(flat):
        if clave not in claims_es:
            errores.append(f'cobertura: "{clave}" no aparece en ninguna pagina ES')
        if clave not in claims_en:
            errores.append(f'cobertura: "{clave}" no aparece en ninguna pagina EN')
    return errores


def main():
    flat = flatten(json.loads(CATALOGO.read_text(encoding='utf-8')))
    errores, vistas_es, vistas_en = [], set(), set()

    for grupo, acumulador in ((ES_FILES, vistas_es), (EN_FILES, vistas_en)):
        for rel in grupo:
            ruta = RAIZ / rel
            if not ruta.exists():
                errores.append(f'falta el archivo {rel}')
                continue
            claims = extract_claims(ruta.read_text(encoding='utf-8'))
            errores += check_match(claims, flat, rel)
            acumulador.update(claims)

    errores += check_coverage(flat, vistas_es, vistas_en)

    if errores:
        print(f'FALLO: {len(errores)} problema(s) de catalogo\n')
        for e in errores:
            print('  -', e)
        return 1
    print(f'OK: {len(flat)} claves cuadran en ES y EN')
    return 0


if __name__ == '__main__':
    sys.exit(main())
```

- [ ] **Step 5: Ejecutar los tests y comprobar que pasan**

Run: `cd tools && python -m unittest test_check_catalogo -v`
Expected: PASS, 12 tests

- [ ] **Step 6: Ejecutar el check completo y ver que falla por cobertura**

Run: `python tools/check_catalogo.py`
Expected: `FALLO`, con una línea `cobertura: "rango.mortal.homes" no aparece en ninguna pagina ES` por cada clave. Es lo correcto: todavía ningún HTML lleva `data-catalog`. Este fallo es el test de las tareas 2 a 7.

- [ ] **Step 7: Commit**

```bash
git add data/catalogo.json tools/check_catalogo.py tools/test_check_catalogo.py
git commit -m "feat: fuente de verdad del catalogo y verificador contra el HTML"
```

---

### Task 2: Tabla de rangos en español

**Files:**
- Modify: `public/rangos/index.html` — reescribir `<tbody>` y la leyenda
- Modify: `public/css/rangos.css` — añadir `.rg-tr--star`

**Interfaces:**
- Consumes: claves `rango.*` de `data/catalogo.json` (Task 1).
- Produces: el patrón de marcado `data-catalog` que copian las tareas 3, 4, 6 y 7.

- [ ] **Step 1: Ejecutar el check y anotar el fallo de partida**

Run: `python tools/check_catalogo.py`
Expected: FALLO. Anotar cuántas claves `rango.*` faltan en ES: deben ser 30 (5 rangos × 6 campos).

- [ ] **Step 2: Reescribir el `<tbody>` de la comparativa**

Sustituir el `<tbody>` entero. Estructura de la fila numérica, repetida para `homes`, `multiplicador`, `protecciones`, `llaves`, `subastas` y `kits`:

```html
<tr><td colspan="6" class="rg-td-section">Base</td></tr>
<tr>
  <td class="rg-td-feature"><div class="rg-perk">Homes</div><div class="rg-perk-desc">/sethome · /home · /delhome</div></td>
  <td class="rg-td rg-val-mortal"  data-catalog="rango.mortal.homes">1</td>
  <td class="rg-td rg-val-hero"    data-catalog="rango.hero.homes">5</td>
  <td class="rg-td rg-val-demigod" data-catalog="rango.demigod.homes">10</td>
  <td class="rg-td rg-val-titan"   data-catalog="rango.titan.homes">20</td>
  <td class="rg-td rg-td--oly rg-val-oly" data-catalog="rango.olympian.homes">40</td>
</tr>
<tr>
  <td class="rg-td-feature"><div class="rg-perk">Multiplicador $ y XP</div><div class="rg-perk-desc">dinero y experiencia que ganas</div></td>
  <td class="rg-td rg-val-mortal"  data-catalog="rango.mortal.multiplicador">×1.0</td>
  <td class="rg-td rg-val-hero"    data-catalog="rango.hero.multiplicador">×1.1</td>
  <td class="rg-td rg-val-demigod" data-catalog="rango.demigod.multiplicador">×1.25</td>
  <td class="rg-td rg-val-titan"   data-catalog="rango.titan.multiplicador">×1.5</td>
  <td class="rg-td rg-td--oly rg-val-oly" data-catalog="rango.olympian.multiplicador">×2.0</td>
</tr>
<tr>
  <td class="rg-td-feature"><div class="rg-perk">Protecciones</div><div class="rg-perk-desc">terrenos que puedes proteger</div></td>
  <td class="rg-td rg-val-mortal"  data-catalog="rango.mortal.protecciones">3</td>
  <td class="rg-td rg-val-hero"    data-catalog="rango.hero.protecciones">6</td>
  <td class="rg-td rg-val-demigod" data-catalog="rango.demigod.protecciones">10</td>
  <td class="rg-td rg-val-titan"   data-catalog="rango.titan.protecciones">15</td>
  <td class="rg-td rg-td--oly rg-val-oly" data-catalog="rango.olympian.protecciones">20</td>
</tr>
<tr>
  <td class="rg-td-feature"><div class="rg-perk">Llaves cada 30 días</div><div class="rg-perk-desc">gratis por tener el rango</div></td>
  <td class="rg-td rg-val-mortal"  data-catalog="rango.mortal.llaves">—</td>
  <td class="rg-td rg-val-hero"    data-catalog="rango.hero.llaves">1 Common</td>
  <td class="rg-td rg-val-demigod" data-catalog="rango.demigod.llaves">2 Common</td>
  <td class="rg-td rg-val-titan"   data-catalog="rango.titan.llaves">1 Rare</td>
  <td class="rg-td rg-td--oly rg-val-oly" data-catalog="rango.olympian.llaves">1 Epic</td>
</tr>
<tr>
  <td class="rg-td-feature"><div class="rg-perk">Anuncios en subasta</div><div class="rg-perk-desc">publicaciones simultáneas</div></td>
  <td class="rg-td rg-val-mortal"  data-catalog="rango.mortal.subastas">3</td>
  <td class="rg-td rg-val-hero"    data-catalog="rango.hero.subastas">5</td>
  <td class="rg-td rg-val-demigod" data-catalog="rango.demigod.subastas">8</td>
  <td class="rg-td rg-val-titan"   data-catalog="rango.titan.subastas">12</td>
  <td class="rg-td rg-td--oly rg-val-oly" data-catalog="rango.olympian.subastas">20</td>
</tr>
<tr>
  <td class="rg-td-feature"><div class="rg-perk">Kits exclusivos</div><div class="rg-perk-desc">lotes de objetos reclamables</div></td>
  <td class="rg-td rg-val-mortal"  data-catalog="rango.mortal.kits">—</td>
  <td class="rg-td rg-val-hero"    data-catalog="rango.hero.kits">2</td>
  <td class="rg-td rg-val-demigod" data-catalog="rango.demigod.kits">3</td>
  <td class="rg-td rg-val-titan"   data-catalog="rango.titan.kits">6</td>
  <td class="rg-td rg-td--oly rg-val-oly" data-catalog="rango.olympian.kits">8</td>
</tr>
```

Después, la fila de EnderChest **sin `data-catalog`** (es prosa y se traduce):

```html
<tr>
  <td class="rg-td-feature"><div class="rg-perk">EnderChest premium</div><div class="rg-perk-desc">EnderChestCE · 54 slots por página</div></td>
  <td class="rg-td"><span class="rg-dash">—</span></td>
  <td class="rg-td"><span class="rg-dash">—</span></td>
  <td class="rg-td"><span class="rg-dash">—</span></td>
  <td class="rg-td rg-val-titan">1 pág</td>
  <td class="rg-td rg-td--oly rg-val-oly">2 págs</td>
</tr>
```

Y la fila de gratuitos, con marca en las cinco columnas. El SVG de marca es el mismo que ya usa el archivo, cambiando solo el atributo `stroke` por columna: Mortal `#A9A4B8`, Hero `#34D399`, Demigod `#7DD3FC`, Titan `#C7A0F5`, Olympian `#FFD97A`.

```html
<tr>
  <td class="rg-td-feature"><div class="rg-perk">Esenciales (15 comandos) + /back</div><div class="rg-perk-desc">/spawn /tpa /msg /pay /warp /balance…</div></td>
  <!-- 5 celdas con la marca de su color -->
</tr>
<tr>
  <td class="rg-td-feature"><div class="rg-perk">Recompensa diaria</div><div class="rg-perk-desc">premio por conectarte cada día</div></td>
  <!-- 5 celdas con la marca de su color -->
</tr>
```

- [ ] **Step 3: Reescribir las secciones de comandos**

Cuatro secciones, con `/back` en Hero y `/fly` destacado en Titan. La fila de `/fly` lleva la clase `rg-tr--star` en el `<tr>`:

```html
<tr><td colspan="6" class="rg-td-section">Hero añade</td></tr>
<!-- /hat · /back · /afk · TP aleatorio sin espera ni cooldown -->

<tr><td colspan="6" class="rg-td-section">Demigod añade</td></tr>
<!-- /feed · /near · /nick (con colores) · /tpahere · TP instantáneo 🔒 -->

<tr><td colspan="6" class="rg-td-section">Titan añade</td></tr>
<tr class="rg-tr--star">
  <td class="rg-td-feature">
    <div class="rg-perk"><span class="rg-star">★</span> /fly
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F4C56A" stroke-width="2.2" class="rg-lock" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>
    </div>
    <div class="rg-perk-desc">vuela por el mundo · el perk estrella de Titan</div>
  </td>
  <td class="rg-td"><span class="rg-dash">—</span></td>
  <td class="rg-td"><span class="rg-dash">—</span></td>
  <td class="rg-td"><span class="rg-dash">—</span></td>
  <td class="rg-td"><!-- marca #C7A0F5 --></td>
  <td class="rg-td rg-td--oly"><!-- marca #FFD97A --></td>
</tr>
<!-- luego: /heal 🔒 · /repair 🔒 · /workbench · /tptoggle · /ec ampliado (54 slots) · inmune a AFK-kick -->

<tr><td colspan="6" class="rg-td-section">Olympian añade</td></tr>
<!-- /anvil · /skull · /condense · /ping · 2ª página del EnderChest -->

<tr><td colspan="6" class="rg-td-section">Próximamente</td></tr>
<!-- Cola prioritaria, marca en Demigod, Titan y Olympian, con el badge rg-soon -->
```

Eliminar por completo: cosméticos, `/friends`, prefijo personalizado, vaults privados y chest shops.

- [ ] **Step 4: Actualizar la leyenda**

```html
<div class="rg-legend">
  <span class="rg-legend__item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F4C56A" stroke-width="2.2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg> Se bloquea en combate (ProCombat): fuera de combate funciona normal. Incluido <span class="rg-cmd-inline">/fly</span> — se vende comodidad, no ventaja en PvP.</span>
  <span class="rg-legend__item"><span class="rg-soon rg-soon--lg">PRÓXIMAMENTE</span> Perk incluido en el rango; se activa cuando se lance el sistema.</span>
</div>
```

- [ ] **Step 5: Añadir el estilo de la fila destacada**

Al final de `public/css/rangos.css`:

```css
/* --- Fila destacada: /fly, el perk estrella de Titan --- */
.rg-tr--star {
  background: linear-gradient(90deg, rgba(244, 197, 106, .10), rgba(199, 160, 245, .06) 60%, transparent);
  box-shadow: inset 3px 0 0 var(--gold, #F4C56A);
}
.rg-tr--star .rg-perk { color: var(--gold-bright, #FFD97A); font-weight: 800; }
.rg-star { color: var(--gold-bright, #FFD97A); margin-right: 2px; }
.rg-cmd-inline {
  font-family: ui-monospace, monospace;
  color: var(--gold-bright, #FFD97A);
  font-weight: 700;
}
```

- [ ] **Step 6: Ejecutar el check**

Run: `python tools/check_catalogo.py`
Expected: sigue en FALLO, pero **ya no aparece ningún `cobertura: "rango.*" no aparece en ninguna pagina ES`**. Los que quedan son de `precio.*`, `llave.*`, `dracma.*`, `proteccion.*` y todos los de EN. Si aparece un error de coincidencia en `rango.*`, hay una cifra mal tecleada: corregir el HTML, nunca el JSON.

- [ ] **Step 7: Verificar en el navegador**

Run: `python -m http.server 8123 -d public` y abrir `http://localhost:8123/rangos/`
Comprobar: la fila de `/fly` se ve destacada, no queda ninguna mención a cosméticos ni a vaults, y la única marca PRÓXIMAMENTE es la cola prioritaria.

- [ ] **Step 8: Commit**

```bash
git add public/rangos/index.html public/css/rangos.css
git commit -m "fix: datos reales de rangos y /fly destacado en la comparativa ES"
```

---

### Task 3: Tarjetas de rango y avisos en la tienda española

**Files:**
- Modify: `public/tienda/index.html` — tarjetas de rango, estilos inline, avisos
- Modify: `public/css/tienda.css` — clases que sustituyen a los `style` inline

**Interfaces:**
- Consumes: claves `precio.*` de `data/catalogo.json`; el patrón `data-catalog` de Task 2.
- Produces: las clases `.td-seccion`, `.td-seccion__titulo`, `.td-seccion__lead` y `.td-aviso` que reutiliza Task 4.

- [ ] **Step 1: Eliminar los estilos inline (bug de CSP en producción)**

En `public/tienda/index.html`, sustituir el bloque con `style="margin-top: 60px…"` por:

```html
<div class="td-seccion">
  <h2 class="td-seccion__titulo">Moneda &amp; <span class="grad-gold">Protección</span></h2>
  <p class="td-seccion__lead">Mejora tu experiencia in-game con la moneda premium o asegura tu base máxima.</p>
</div>
```

Y añadir a `public/css/tienda.css`:

```css
/* --- Cabecera de sección (sustituye a los estilos inline: CSP estricta) --- */
.td-seccion { margin: 60px 0 24px; }
.td-seccion__titulo {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 2rem;
  line-height: 1.15;
  margin-bottom: 8px;
}
.td-seccion__lead {
  font-size: 1rem;
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
}
```

- [ ] **Step 2: Marcar los precios de rango con `data-catalog`**

Los cuatro `<span class="td-precio" id="td-price-*">` llevan el precio **permanente** en el HTML estático, que es lo que `js/tienda.js` renderiza por defecto:

```html
<span id="td-price-hero" class="td-precio" data-catalog="precio.hero.permanente">18,46&nbsp;€</span>
```

Igual para `demigod` (36,96 €), `titan` (73,96 €) y `olympian` (129,46 €).

`js/tienda.js` sobrescribe estos valores con `textContent` al cargar. El check lee el HTML del archivo, no el DOM renderizado, así que no hay conflicto.

Añadir además una fila oculta a lectores pero presente para el check y para quien navega sin JS, dentro de cada tarjeta, con el precio mensual:

```html
<div class="td-precio-mensual">o <span data-catalog="precio.hero.mensual">4,99&nbsp;€</span> al mes</div>
```

```css
.td-precio-mensual { font-size: .82rem; color: var(--faint); margin-top: 2px; }
```

- [ ] **Step 3: Corregir los perks de las cuatro tarjetas**

- **HERO** — quitar nada; mantiene `/back`. Añadir: `×1.1` al dinero y la XP, 6 protecciones, 1 llave Common cada 30 días, 2 kits.
- **DEMIGOD** — **quitar `/enderchest`**. Añadir: `×1.25`, 10 protecciones, 2 llaves Common, 3 kits.
- **TITAN** — añadir **`/fly` en primera posición** con estrella y candado, y `/ec` ampliado a 54 slots justo debajo. Añadir `×1.5`, 15 protecciones, 1 llave Rare, 6 kits.
- **OLYMPIAN** — añadir 2ª página del EnderChest, `×2.0`, 20 protecciones, 1 llave Epic, 8 kits. **Quitar prefijo personalizado.**

Primer perk de Titan:

```html
<div class="td-perk td-perk--star">
  <svg class="td-perk__check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFD97A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
  <span class="td-perk__text"><strong class="td-strong">★ <span class="td-cmd">/fly</span> · vuela por el mundo</strong>
    <svg class="td-lock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F4C56A" stroke-width="2.2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>
  </span>
</div>
```

```css
.td-perk--star {
  background: linear-gradient(90deg, rgba(244, 197, 106, .12), transparent 70%);
  border-radius: 8px;
  padding: 4px 6px;
  margin: 0 -6px;
}
```

- [ ] **Step 4: Añadir los avisos de IVA y de entrega**

Junto al selector mensual/permanente:

```html
<p class="td-aviso">Precios sin IVA. El impuesto se calcula en el pago según tu país.</p>
```

Y en el bloque `.td-notas`, sustituyendo nada y añadiendo dos notas nuevas:

```html
<div class="td-nota">
  <svg class="td-nota__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4C56A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
  <span class="td-nota__text"><strong class="td-strong">Para recibir tu rango:</strong> entra al servidor una vez después de comprar y se aplica solo.</span>
</div>
<div class="td-nota td-nota--aviso">
  <svg class="td-nota__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4C56A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
  <span class="td-nota__text"><strong class="td-strong">Objetos in-game (llaves, Dracmas y la mena de Protección):</strong> tienes que estar conectado al servidor en el momento de la entrega. Si no lo estás no los recibes, y es responsabilidad tuya estarlo.</span>
</div>
```

```css
.td-aviso {
  font-size: .82rem;
  color: var(--muted);
  margin: 6px 0 0;
}
.td-nota--aviso {
  border-color: rgba(244, 197, 106, .45);
  background: rgba(244, 197, 106, .07);
}
```

- [ ] **Step 5: Ejecutar el check**

Run: `python tools/check_catalogo.py`
Expected: FALLO, pero sin errores de `precio.*` en ES. Quedan `llave.*`, `dracma.*`, `proteccion.*` y todo EN.

- [ ] **Step 6: Verificar que no queda ni un estilo inline**

Run: `grep -n 'style="' public/tienda/index.html`
Expected: sin resultados. Si aparece alguno, moverlo a `tienda.css`: en producción se descarta.

- [ ] **Step 7: Commit**

```bash
git add public/tienda/index.html public/css/tienda.css
git commit -m "fix: perks reales en las tarjetas de rango, avisos de IVA y entrega, y estilos inline fuera"
```

---

### Task 4: Secciones de llaves y Dracmas en la tienda española

**Files:**
- Modify: `public/tienda/index.html` — dos secciones nuevas antes de «Moneda & Protección»
- Modify: `public/css/tienda.css` — rejilla de llaves, color por tier, botón deshabilitado

**Interfaces:**
- Consumes: claves `llave.*`, `dracma.*` y `proteccion.*`; las clases `.td-seccion` de Task 3.
- Produces: `.td-llave`, `.td-llave__packs`, `.td-buy--off`, que replica Task 7 en inglés.

- [ ] **Step 1: Añadir la sección de llaves**

Va después de la rejilla de rangos y antes de «Moneda & Protección». Se muestra una tarjeta por tier; se repite el mismo bloque cambiando tier, precios e imagen.

```html
<div class="td-seccion">
  <h2 class="td-seccion__titulo">Llaves de <span class="grad-gold">cajas</span></h2>
  <p class="td-seccion__lead">Cada caja da recompensas de su nivel. Los rangos ya incluyen llaves gratis cada 30 días — <a href="/rangos/" class="td-link">míralo en la comparativa</a>.</p>
</div>

<img class="td-llaves-banner" src="/img/keys-category.webp" width="800" height="800" alt="" aria-hidden="true" loading="lazy">

<div class="td-llaves-grid">

  <div class="td-llave td-llave--common">
    <img class="td-llave__art" src="/img/key-common.webp" width="640" height="640" alt="" aria-hidden="true" loading="lazy">
    <div class="td-llave__chip">COMMON</div>
    <div class="td-llave__packs">
      <div class="td-llave__pack"><span class="td-llave__cant">1 llave</span><span class="td-llave__precio" data-catalog="llave.common.x1">1,40&nbsp;€</span></div>
      <div class="td-llave__pack"><span class="td-llave__cant">5 llaves</span><span class="td-llave__precio" data-catalog="llave.common.x5">6,30&nbsp;€</span><span class="td-llave__off">−10%</span></div>
      <div class="td-llave__pack"><span class="td-llave__cant">10 llaves</span><span class="td-llave__precio" data-catalog="llave.common.x10">11,20&nbsp;€</span><span class="td-llave__off">−20%</span></div>
    </div>
    <div class="td-llave__ingame">No se vende in-game. La consigues con tu rango.</div>
    <span class="td-buy td-buy--off" aria-disabled="true">Disponible en breve</span>
  </div>

  <!-- Rare, Epic, Legendary y Mythic: mismo bloque, valores de la tabla de abajo -->

</div>
```

Los otros cuatro tiers repiten ese bloque exacto cambiando la clase modificadora, la imagen, el chip, las tres claves `data-catalog` con su importe y la línea de in-game. Todos los literales:

| Tier | Clase | Imagen | `x1` | `x5` | `x10` | in-game |
|---|---|---|---|---|---|---|
| Common | `td-llave--common` | `key-common.webp` | `1,40 €` | `6,30 €` | `11,20 €` | no se vende |
| Rare | `td-llave--rare` | `key-rare.webp` | `3,50 €` | `15,75 €` | `28,00 €` | `5` |
| Epic | `td-llave--epic` | `key-epic.webp` | `7,00 €` | `31,50 €` | `56,00 €` | `10` |
| Legendary | `td-llave--legendary` | `key-legendary.webp` | `14,00 €` | `63,00 €` | `112,00 €` | `15` |
| Mythic | `td-llave--mythic` | `key-mythic.webp` | `28,00 €` | `126,00 €` | `224,00 €` | `30` |

Las claves siguen el patrón `llave.<tier>.x1`, `.x5`, `.x10` e `.ingame` — por ejemplo `llave.mythic.x10`. Los importes llevan `&nbsp;` antes del `€`, igual que el resto del archivo.

Para los cuatro tiers que sí se venden in-game, la línea `td-llave__ingame` lleva su clave (aquí Rare; cambiar tier y cifra para los demás):

```html
<div class="td-llave__ingame">o <span data-catalog="llave.rare.ingame">5</span> 💎 in-game</div>
```

La Common **no lleva** `data-catalog` en esa línea, porque no se vende in-game y no existe la clave `llave.common.ingame`. Su texto es el literal de la plantilla de arriba.

El botón es un `<span>`, **no un `<a>`**: sin `href` no puede navegar a un producto inexistente.

- [ ] **Step 2: Sustituir la tarjeta de Dracmas por los cuatro packs**

```html
<div class="td-seccion">
  <h2 class="td-seccion__titulo">Dracmas <span class="grad-gold">💎</span></h2>
  <p class="td-seccion__lead">La moneda premium del servidor. Se compran <strong class="td-strong">solo con dinero real</strong>: no se pueden conseguir con el dinero del juego, y es deliberado — así la economía in-game no se compra. Sirven para cosméticos, mejoras y extras de la tienda del juego.</p>
</div>

<div class="td-dracmas-grid">
  <div class="td-dracma-pack">
    <div class="td-dracma-pack__cant"><span data-catalog="dracma.p10.cantidad">10</span> 💎</div>
    <div class="td-dracma-pack__precio" data-catalog="dracma.p10.precio">7,00&nbsp;€</div>
    <span class="td-buy td-buy--off" aria-disabled="true">Disponible en breve</span>
  </div>
  <!-- p25, p50 y p100: mismo bloque, valores de la tabla de abajo -->
</div>
```

Los otros tres packs repiten el bloque cambiando las dos claves y añadiendo el badge de bonus:

| Pack | `cantidad` | `precio` | Bonus | Extra |
|---|---|---|---|---|
| `dracma.p10` | `10` | `7,00 €` | — | — |
| `dracma.p25` | `25` | `15,75 €` | `+10%` | — |
| `dracma.p50` | `50` | `28,00 €` | `+20%` | precio anterior `35,00 €` tachado |
| `dracma.p100` | `100` | `49,00 €` | `+30%` | mejor valor |

El badge va justo después del precio:

```html
<div class="td-dracma-pack__bonus">+10%</div>
```

Y el pack de 50 lleva delante del precio el importe anterior, que baja de 35,00 € a 28,00 €:

```html
<span class="td-precio-original">35,00&nbsp;€</span>
```

- [ ] **Step 3: Marcar la tarjeta de Protección y desactivar su botón**

```html
<span class="td-precio" data-catalog="proteccion.precio">22,00&nbsp;€</span>
...
<span class="td-perk__text">También comprable in-game por <strong class="td-strong"><span data-catalog="proteccion.ingame">31</span> 💎</strong></span>
```

Y cambiar su `<a href="https://hyperionsmc.tebex.store" …>` por `<span class="td-buy td-buy--off" aria-disabled="true">Disponible en breve</span>`.

- [ ] **Step 4: Añadir los estilos**

```css
/* --- Llaves de cajas --- */
.td-link {
  color: var(--teal-bright);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.td-link:hover { color: var(--gold-bright); }
.td-llaves-banner {
  display: block;
  width: min(280px, 60vw);
  height: auto;
  margin: 0 auto 18px;
  border-radius: 18px;
}
.td-llaves-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
}
.td-llave {
  display: flex;
  flex-direction: column;
  padding: 0 0 18px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface);
  overflow: hidden;
  border-top: 3px solid var(--tier, var(--border));
}
.td-llave__art { display: block; width: 100%; height: auto; }
.td-llave__chip {
  align-self: center;
  margin: 12px 0 10px;
  padding: 4px 12px;
  border-radius: 999px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: .78rem;
  letter-spacing: .08em;
  color: var(--tier, var(--text));
  border: 1px solid var(--tier, var(--border));
}
.td-llave__packs { display: grid; gap: 6px; padding: 0 16px; }
.td-llave__pack {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: .86rem;
}
.td-llave__cant { color: var(--muted); flex: 1; }
.td-llave__precio { font-weight: 800; color: var(--text); }
.td-llave__off { font-size: .72rem; color: var(--teal-bright); font-weight: 700; }
.td-llave__ingame {
  padding: 10px 16px 0;
  font-size: .78rem;
  color: var(--faint);
}

/* Color propio por tier: la ilustracion no debe leerse como rango */
.td-llave--common    { --tier: #A9A4B8; }
.td-llave--rare      { --tier: #60A5FA; }
.td-llave--epic      { --tier: #E879F9; }
.td-llave--legendary { --tier: #FBBF24; }
.td-llave--mythic    { --tier: #FB7185; }

/* --- Packs de Dracmas --- */
.td-dracmas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}
.td-dracma-pack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 16px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--surface);
  text-align: center;
}
.td-dracma-pack__cant {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 1.4rem;
  color: var(--teal-bright);
}
.td-dracma-pack__precio { font-weight: 800; font-size: 1.1rem; }
.td-dracma-pack__bonus {
  font-size: .74rem;
  font-weight: 800;
  color: #062015;
  background: linear-gradient(135deg, #6EE7B7, #34D399);
  border-radius: 999px;
  padding: 2px 10px;
}

/* --- Boton sin destino: el paquete aun no existe en Tebex --- */
.td-buy--off {
  margin-top: auto;
  cursor: not-allowed;
  opacity: .55;
  background: var(--surface-2, rgba(255,255,255,.06));
  color: var(--muted);
  border: 1px dashed var(--border);
}
.td-buy--off:hover { transform: none; filter: none; color: var(--muted); }
```

- [ ] **Step 5: Ejecutar el check**

Run: `python tools/check_catalogo.py`
Expected: FALLO **solo** por cobertura de EN. Ninguna clave debe faltar ya en ES y ningún valor debe divergir.

- [ ] **Step 6: Comprobar que ningún botón inexistente enlaza**

Run: `grep -c 'tebex.store' public/tienda/index.html`
Expected: `4` — solo los cuatro rangos. Si sale más, alguna llave, Dracma o Protección enlaza a un producto que no existe.

- [ ] **Step 7: Verificar en el navegador**

Run: `python -m http.server 8123 -d public` y abrir `http://localhost:8123/tienda/`
Comprobar: las cinco tarjetas de llave se ven con su color de tier en el borde y el chip, los cuatro packs de Dracmas cuadran, y los botones deshabilitados no son pulsables.

- [ ] **Step 8: Commit**

```bash
git add public/tienda/index.html public/css/tienda.css
git commit -m "feat: secciones de llaves de cajas y packs de Dracmas en la tienda ES"
```

---

### Task 5: Credibilidad y Java/Bedrock en la portada española

**Files:**
- Modify: `public/index.html:95` — lead del hero
- Modify: `public/index.html:153` — tarjeta «Comunidad Épica»
- Modify: `public/index.html:162` — tarjeta «Economía Dinámica»
- Modify: `public/index.html:181` — título de la sección de stats

**Interfaces:**
- Consumes: nada del catálogo. Esta tarea no toca cifras.
- Produces: los textos que Task 6 traduce al inglés.

- [ ] **Step 1: Sustituir el lead del hero**

El texto actual dice «Miles de supervivientes ya escriben su leyenda» mientras el contador de la misma página marca 0/500.

```html
<p class="hero__lead">
  Levanta tu imperio, forja alianzas y conquista un mundo recién nacido. Somos una comunidad nueva y pequeña: entrar ahora significa elegir tu terreno antes que nadie y que tu nombre suene desde el primer día. <strong class="hero__lead-strong">Tu trono te espera.</strong>
</p>
```

- [ ] **Step 2: Reescribir la tarjeta «Comunidad Épica»**

```html
<h3 class="card__title">Comunidad Cercana</h3>
<p class="card__text">Servidor recién abierto, con staff que te conoce por el nick y no por un ticket. Aquí no eres uno más entre miles: entras, te presentas y ya formas parte.</p>
```

- [ ] **Step 3: Reformular el «sin pay-to-win»**

```html
<h3 class="card__title">Economía Dinámica</h3>
<p class="card__text">Un mercado real impulsado por jugadores. Comercia, invierte y construye tu fortuna en oro. <strong class="card__strong">Sin ventajas de combate:</strong> lo que se vende es comodidad y progresión, nunca poder en PvP — hasta <span class="card__cmd">/fly</span> se bloquea peleando.</p>
```

Si `.card__strong` y `.card__cmd` no existen en `public/css/styles.css`, añadirlas:

```css
.card__strong { color: var(--gold-bright); font-weight: 800; }
.card__cmd { font-family: ui-monospace, monospace; color: var(--teal-bright); }
```

- [ ] **Step 4: Ajustar el título de la sección de stats**

«Un Olimpo que nunca duerme» sobre un contador a 0 se lee como una promesa incumplida.

```html
<h2 class="section-title section-title--center">El Olimpo, <span class="grad-teal">en directo</span></h2>
```

- [ ] **Step 5: Hacer visible Java + Bedrock**

En el badge del hero, dejar la versión explícita:

```html
<span class="hero__badge-text">Java 1.21.x + Bedrock · Temporada I abierta</span>
```

- [ ] **Step 6: Verificar que no queda ninguna cifra inflada**

Run: `grep -niE 'miles|thousands|nunca duerme|pay-to-win' public/index.html`
Expected: sin resultados.

- [ ] **Step 7: Verificar en el navegador**

Run: `python -m http.server 8123 -d public` y abrir `http://localhost:8123/`
Comprobar: el hero y la tarjeta de comunidad ya no contradicen al contador en vivo.

- [ ] **Step 8: Commit**

```bash
git add public/index.html public/css/styles.css
git commit -m "fix: mensaje honesto de comunidad nueva y sin ventajas de combate en la portada ES"
```

---

### Task 6: Paridad inglesa de portada y rangos

**Files:**
- Modify: `public/en/index.html` — espejo de Task 5
- Modify: `public/en/ranks/index.html` — espejo de Task 2

**Interfaces:**
- Consumes: la estructura de Task 2 y los textos de Task 5.
- Produces: la mitad EN de la cobertura para `rango.*`.

- [ ] **Step 1: Reescribir la tabla de `/en/ranks/`**

Copiar el `<tbody>` de `public/rangos/index.html` **con los mismos `data-catalog` y las mismas cifras**, traduciendo solo las etiquetas:

| Español | Inglés |
|---|---|
| Homes | Homes |
| Multiplicador $ y XP | Money & XP multiplier |
| Protecciones | Land claims |
| Llaves cada 30 días | Keys every 30 days |
| Anuncios en subasta | Auction listings |
| Kits exclusivos | Exclusive kits |
| EnderChest premium | Premium EnderChest |
| Esenciales (15 comandos) + /back | Essentials (15 commands) + /back |
| Recompensa diaria | Daily reward |
| Base / Hero añade / … | Base / Hero adds / … |
| Próximamente | Coming soon |
| 1 pág · 2 págs | 1 page · 2 pages |

Los valores con `data-catalog` **no se traducen**: `1 Common`, `×1.1`, `—` y los números van idénticos. Es lo que permite compararlos entre idiomas.

- [ ] **Step 2: Traducir la fila destacada y la leyenda**

```html
<div class="rg-perk"><span class="rg-star">★</span> /fly
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F4C56A" stroke-width="2.2" class="rg-lock" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>
</div>
<div class="rg-perk-desc">fly across the world · Titan's flagship perk</div>
```

```html
<span class="rg-legend__item">… Locked in combat (ProCombat): works normally out of combat. <span class="rg-cmd-inline">/fly</span> included — we sell convenience, not a PvP edge.</span>
```

- [ ] **Step 3: Espejar la portada inglesa**

```html
<p class="hero__lead">
  Build your empire, forge alliances and conquer a world that's just been born. We're a new, small community: joining now means claiming your land before anyone else and having your name known from day one. <strong class="hero__lead-strong">Your throne awaits.</strong>
</p>
```

```html
<h3 class="card__title">A Close-Knit Community</h3>
<p class="card__text">A freshly opened server, with staff who know you by your username and not by a ticket number. You're not one among thousands here: you join, you say hi, and you're already part of it.</p>
```

```html
<h3 class="card__title">Dynamic Economy</h3>
<p class="card__text">A real player-driven market. Trade, invest and build your fortune in gold. <strong class="card__strong">No combat advantages:</strong> what we sell is convenience and progression, never PvP power — even <span class="card__cmd">/fly</span> is locked while fighting.</p>
```

```html
<h2 class="section-title section-title--center">Olympus, <span class="grad-teal">live</span></h2>
<span class="hero__badge-text">Java 1.21.x + Bedrock · Season I now open</span>
```

- [ ] **Step 4: Ejecutar el check**

Run: `python tools/check_catalogo.py`
Expected: FALLO solo por cobertura EN de `precio.*`, `llave.*`, `dracma.*` y `proteccion.*`. Ningún error en `rango.*`, ni de coincidencia ni de cobertura.

- [ ] **Step 5: Verificar que no queda copy inflado en inglés**

Run: `grep -niE 'thousands|never sleeps|pay-to-win' public/en/index.html`
Expected: sin resultados.

- [ ] **Step 6: Commit**

```bash
git add public/en/index.html public/en/ranks/index.html
git commit -m "fix: paridad EN de la comparativa de rangos y del copy de portada"
```

---

### Task 7: Paridad inglesa de la tienda

**Files:**
- Modify: `public/en/store/index.html` — espejo completo de las tareas 3 y 4

**Interfaces:**
- Consumes: la estructura de `public/tienda/index.html` tras las tareas 3 y 4.
- Produces: la cobertura EN que deja el check en verde por primera vez.

- [ ] **Step 1: Poner la tienda inglesa al día**

Parte con 48 líneas menos que la española: le faltan las tarjetas de Dracmas y de Protección, además de todo lo nuevo. Lo más fiable es copiar el `<main>` de `public/tienda/index.html` y traducir el texto, manteniendo intactos los `data-catalog`, las clases y las rutas de imagen.

- [ ] **Step 2: Traducir las cadenas de la tienda**

| Español | Inglés |
|---|---|
| Llaves de cajas | Crate keys |
| 1 llave / 5 llaves / 10 llaves | 1 key / 5 keys / 10 keys |
| o 5 💎 in-game | or 5 💎 in-game |
| No se vende in-game. La consigues con tu rango. | Not sold in-game. You earn it with your rank. |
| Disponible en breve | Coming soon |
| Precios sin IVA. El impuesto se calcula en el pago según tu país. | Prices exclude VAT. Tax is calculated at checkout based on your country. |
| Para recibir tu rango: entra al servidor una vez… | To receive your rank: log into the server once after buying and it applies automatically. |
| Objetos in-game (llaves, Dracmas y la mena de Protección): tienes que estar conectado… | In-game items (keys, Dracmas and the Protection ore): you must be online when they're delivered. If you're not, you won't receive them, and it's your responsibility to be online. |
| pago único · para siempre | one-time · yours forever |
| al mes | per month |
| Moneda & Protección | Currency & Protection |

Los importes en inglés van en formato inglés (`€4.99`, `€18.46`). El normalizador del check los equipara con los españoles.

- [ ] **Step 3: Actualizar la meta descripción**

```html
<meta name="description" content="Official Hyperions MC store: Hero, Demigod, Titan and Olympian ranks with cumulative perks, crate keys and Dracmas. Monthly or permanent — convenience and progression, never PvP power.">
```

- [ ] **Step 4: Ejecutar el check — debe pasar por primera vez**

Run: `python tools/check_catalogo.py`
Expected: `OK: N claves cuadran en ES y EN`

Si falla por coincidencia, la cifra mal está en el HTML. **Nunca se corrige el JSON para que pase el check** — eso invierte la fuente de verdad y reintroduce el problema que este trabajo arregla.

- [ ] **Step 5: Comprobar los enlaces de Tebex en inglés**

Run: `grep -c 'tebex.store' public/en/store/index.html`
Expected: `4`

- [ ] **Step 6: Verificar en el navegador**

Run: `python -m http.server 8123 -d public` y abrir `http://localhost:8123/en/store/`
Comprobar que se ve igual que la española y que el botón ES/EN alterna correctamente.

- [ ] **Step 7: Commit**

```bash
git add public/en/store/index.html
git commit -m "feat: paridad EN de la tienda con llaves, Dracmas y avisos"
```

---

### Task 8: Automatizar el check en CI y en el deploy

**Files:**
- Create: `.github/workflows/check-catalogo.yml`
- Create: `deploy.ps1`
- Modify: `README.md`

**Interfaces:**
- Consumes: `tools/check_catalogo.py` y `tools/test_check_catalogo.py` de Task 1.
- Produces: nada que consuman otras tareas. Es la última.

- [ ] **Step 1: Añadir el workflow**

```yaml
name: Check catálogo

on:
  push:
    branches: [main]
  pull_request:

jobs:
  catalogo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Tests del verificador
        working-directory: tools
        run: python -m unittest test_check_catalogo -v
      - name: HTML contra catalogo.json
        run: python tools/check_catalogo.py
```

Sin `pip install`: el script solo usa biblioteca estándar.

- [ ] **Step 2: Escribir el wrapper de deploy**

El README documenta hoy tres comandos sueltos. Este script los envuelve y se niega a subir nada si el catálogo no cuadra.

```powershell
#!/usr/bin/env pwsh
# Despliegue de hyperionsmc.com al VPS de Raiola.
# Aborta si el catalogo no cuadra: nunca se sube una web que se contradice.
$ErrorActionPreference = 'Stop'

Write-Host '==> Tests del verificador' -ForegroundColor Cyan
python -m unittest discover -s tools -p 'test_*.py'
if ($LASTEXITCODE -ne 0) { throw 'Los tests del verificador fallan. Deploy abortado.' }

Write-Host '==> HTML contra catalogo.json' -ForegroundColor Cyan
python tools/check_catalogo.py
if ($LASTEXITCODE -ne 0) { throw 'El catalogo no cuadra. Deploy abortado.' }

Write-Host '==> Estilos inline (los descarta la CSP)' -ForegroundColor Cyan
$inline = Select-String -Path 'public/**/*.html' -Pattern 'style="' -AllMatches
if ($inline) {
    $inline | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Red }
    throw 'Hay estilos inline. La CSP los descarta en produccion. Deploy abortado.'
}

Write-Host '==> Subiendo a raiola' -ForegroundColor Cyan
ssh raiola 'rm -rf ~/public'
scp -r public raiola:~
ssh raiola 'sudo /usr/local/bin/hyperion-deploy'

Write-Host '==> Desplegado: https://hyperionsmc.com' -ForegroundColor Green
```

- [ ] **Step 3: Comprobar que el wrapper detecta un catálogo roto**

Cambiar a mano `rango.hero.homes` de `5` a `99` en `data/catalogo.json`, y ejecutar:

Run: `python tools/check_catalogo.py`
Expected: `FALLO`, con dos líneas señalando `public/rangos/index.html` y `public/en/ranks/index.html`.

Deshacer el cambio (`git checkout data/catalogo.json`) y volver a ejecutar.
Expected: `OK`

- [ ] **Step 4: Documentar en el README**

Sustituir la sección «Desplegar» por:

````markdown
### Desplegar

```powershell
./deploy.ps1
```

Ejecuta los tests del verificador, comprueba que el HTML coincide con
`data/catalogo.json`, verifica que no hay estilos inline —la CSP los descarta en
producción— y solo entonces sube `public/` al VPS.

Si algo falla, no se sube nada. Para desplegar a mano saltándose las
comprobaciones están los tres comandos de siempre, pero conviene no hacerlo.

## Catálogo

`data/catalogo.json` es la fuente de verdad de las cifras de rango y de todos
los precios. El HTML declara lo que afirma con atributos `data-catalog`:

```html
<td data-catalog="rango.hero.homes">5</td>
```

`tools/check_catalogo.py` comprueba dos cosas: que todo `data-catalog` coincide
con el JSON, y que toda clave del JSON aparece en la web española y en la
inglesa. Corre en GitHub Actions en cada push y antes de cada deploy.

**Para cambiar un precio o una cifra: primero el JSON, después el HTML.**
Si el check falla, el error está en el HTML.
````

- [ ] **Step 5: Ejecutar todo una última vez**

Run: `python -m unittest discover -s tools -p 'test_*.py' && python tools/check_catalogo.py`
Expected: los tests pasan y el check dice `OK`

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/check-catalogo.yml deploy.ps1 README.md
git commit -m "ci: check de catalogo en Actions y gate antes del deploy"
```

---

## Fuera de alcance: la comprobación de Tebex

El spec describe una quinta comprobación, contra la Headless API de Tebex. **No
se implementa en este plan**, y conviene dejar escrito por qué en vez de que
parezca un olvido.

**Bloqueo 1: el desfase es intencionado.** Tebex tiene cargados los precios sin
IVA y lo aplica en el pago según el país del comprador. Una comparación directa
contra `precio.*` daría `4,99 ≠ 6,04` siempre. Habría que codificar el factor,
pero el factor depende del país: no hay un número único contra el que comparar.

**Bloqueo 2: no hay token.** La Headless API necesita el identificador de la
tienda, y no es deducible desde el escaparate público. Verificado el 26/07: sin
IDs de paquete en el DOM, sin payload embebido y sin llamadas a API en el
tráfico de la página. Hay que sacarlo del panel de Tebex.

**Bloqueo 3: la mitad del catálogo no existe allí.** Solo están los 8 paquetes
de rango. Comprobar llaves, Dracmas y Protección no tiene contra qué.

**Cuándo retomarlo:** cuando estén creados los paquetes que faltan y se tenga el
token. La comprobación útil entonces no es el importe con IVA sino el importe
**base** de Tebex contra `precio.*`, que sí debe coincidir al céntimo. Ese es el
contrato real, y es comprobable.

Mientras tanto, las cuatro copias del repositorio quedan cubiertas, que son las
que se editan a mano y las que causaron el error de `/enderchest`.

## Verificación final

- [ ] `python -m unittest discover -s tools -p 'test_*.py'` pasa
- [ ] `python tools/check_catalogo.py` dice `OK`
- [ ] `grep -rn 'style="' public/` no devuelve nada
- [ ] `grep -rn 'innerHTML' public/js/` no devuelve nada
- [ ] `grep -rc 'tebex.store' public/tienda/index.html public/en/store/index.html` devuelve 4 en cada uno
- [ ] `grep -rniE 'vaults|chest shop|cosmétic|cosmetic|prefijo personalizado|custom prefix|/friends' public/` no devuelve nada
- [ ] `grep -rniE 'miles de jugadores|thousands of players' public/` no devuelve nada
- [ ] Las 12 páginas cargan en `http://localhost:8123` sin errores en consola
- [ ] El botón ES/EN alterna entre páginas equivalentes en rangos y tienda

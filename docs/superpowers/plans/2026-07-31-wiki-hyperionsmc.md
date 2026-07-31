# Wiki de Hyperions MC — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar una wiki bilingüe de 13 páginas generada desde archivos de contenido, con buscador, sin que ninguna cifra pueda contradecir a `data/catalogo.json`.

**Architecture:** Los cuerpos se escriben en HTML plano bajo `wiki/`, los metadatos viven en un único `wiki/paginas.json`, y `tools/build_wiki.py` los envuelve con una plantilla por idioma para producir HTML estático en `public/wiki/` y `public/en/wiki/`. Las cifras no se teclean: se invocan con `{{clave}}` y el generador las inyecta desde el catálogo. El buscador es un `.js` generado, sin peticiones de red, para no tocar la CSP.

**Tech Stack:** HTML + CSS + JavaScript vanilla, sin frameworks. Python 3.12 solo con biblioteca estándar (`json`, `re`, `html`, `pathlib`, `unittest`). PowerShell para el deploy. GitHub Actions para CI.

**Spec:** `docs/superpowers/specs/2026-07-29-wiki-hyperionsmc-design.md`
**Contenido fuente:** `docs/wiki-encargo.md`

## Global Constraints

- **Ninguna cifra inventada.** Si no está en `docs/wiki-encargo.md` o en `data/catalogo.json`, no existe. Antes «pendiente de confirmar» que un número plausible.
- **Los comandos van literales**, en minúscula y con su barra: `/ec`, `/jobs`. **No se traducen** en la versión inglesa.
- **Los nombres propios no se traducen**: Dracma, Nexo/Nexus, La Fosa/The Pit, y los rangos (Mortal, Hero, Demigod, Titan, Olympian).
- **La wiki no menciona la modalidad Prison.** La sección de Prison OP de la portada se queda como está: la regla es solo para la wiki.
- **Sin `style` inline, sin `<script>` inline, sin `<style>`, sin `on*=`.** La CSP de producción es `default-src 'none'; script-src 'self'; style-src 'self'` sin `unsafe-inline` y los descarta. **El fallo solo se ve tras desplegar**, porque el servidor local no manda cabeceras CSP.
- **Sin `innerHTML`.** Solo `textContent`, `createElement`, `hidden` y `href`.
- **Sin dependencias nuevas.** No se añade `package.json` ni `requirements.txt`.
- **Cuando el encargo y el catálogo difieren, manda el catálogo.** En concreto: homes son 1·5·10·20·40 (no «5→40»), multiplicador ×1.0·×1.1·×1.25·×1.5·×2.0 (no «×1.1→×2.0»), y las llaves no siempre son una (Demigod recibe 2 Common; Olympian, 1 Epic + 1 Legendary). **La wiki nunca escribe «una llave cada 30 días».**
- **Commits convencionales en español.** **Nunca una línea `Co-Authored-By`.**

## Mapa de archivos

**Contenido y herramientas**
- `wiki/paginas.json` — metadatos de las 13 páginas y las 7 secciones
- `wiki/plantilla.es.html` · `wiki/plantilla.en.html` — el cascarón por idioma
- `wiki/es/<slug>.html` · `wiki/en/<slug>.html` — 26 cuerpos
- `tools/build_wiki.py` — el generador
- `tools/test_build_wiki.py` — sus pruebas

**Salida generada (se commitea)**
- `public/wiki/index.html` · `public/wiki/<slug>/index.html`
- `public/en/wiki/index.html` · `public/en/wiki/<slug>/index.html`
- `public/js/wiki-index.js` — índice del buscador

**Presentación y comportamiento**
- `public/css/wiki.css` — lateral, artículo, buscador
- `public/js/wiki-search.js` — el buscador
- `public/css/styles.css` — menú de cabecera en móvil
- `public/js/menu.js` — su comportamiento
- `public/js/lang.js` — deja de usar el mapa de rutas

**Infraestructura**
- `data/catalogo.json` — 28 claves nuevas bajo `wiki`
- `tools/check_catalogo.py` — las listas de archivos pasan a construirse por patrón
- `deploy.ps1` · `.github/workflows/check-catalogo.yml` · `README.md`

---

### Task 1: El generador, la plantilla y la primera página

**Files:**
- Create: `tools/build_wiki.py`, `tools/test_build_wiki.py`
- Create: `wiki/paginas.json`, `wiki/plantilla.es.html`, `wiki/plantilla.en.html`
- Create: `wiki/es/boveda-del-ender.html`, `wiki/en/ender-vault.html`
- Modify: `data/catalogo.json` (5 claves `wiki.ec.*`)
- Modify: `tools/check_catalogo.py:23-24`

**Interfaces:**
- Produces:
  - `formatear(valor, lang) -> str` — decimales con coma en `es`, punto en `en`
  - `aplanar(d, prefijo='') -> dict[str, str]` — claves con punto, saltando las que empiezan por `_`
  - `nexo_vida(tier, miembros, plano) -> float` — `min(base_tier + 0.5·miembros, tope)`
  - `sustituir(cuerpo, lang, plano) -> str` — las tres formas de `{{ }}`
  - `construir() -> list[Path]` — genera todo y devuelve lo escrito

Esta tarea entrega el generador **y una página real de punta a punta**, para que el check quede en verde: añadir claves sin páginas que las usen lo rompe.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tools/test_build_wiki.py`:

```python
import unittest
from build_wiki import formatear, aplanar, nexo_vida, sustituir

PLANO = {
    'wiki.nexo.baseT13': '1.1', 'wiki.nexo.baseT4': '2.1', 'wiki.nexo.baseT5': '3.0',
    'wiki.nexo.porMiembro': '0.5', 'wiki.nexo.tope': '10.0',
    'wiki.ec.slots': '54', 'rango.hero.homes': '5',
}


class TestFormatear(unittest.TestCase):
    def test_decimal_con_coma_en_espanol(self):
        self.assertEqual(formatear('10.0', 'es'), '10,0')

    def test_decimal_con_punto_en_ingles(self):
        self.assertEqual(formatear('10.0', 'en'), '10.0')

    def test_entero_no_se_toca(self):
        self.assertEqual(formatear('54', 'es'), '54')

    def test_multiplicador_no_se_toca(self):
        self.assertEqual(formatear('×1.5', 'es'), '×1.5')


class TestAplanar(unittest.TestCase):
    def test_claves_con_punto(self):
        self.assertEqual(aplanar({'a': {'b': 1}}), {'a.b': '1'})

    def test_salta_las_de_guion_bajo(self):
        self.assertEqual(aplanar({'_x': 1, 'y': 2}), {'y': '2'})


class TestNexoVida(unittest.TestCase):
    def test_solo_en_tier_base(self):
        self.assertAlmostEqual(nexo_vida('T13', 1, PLANO), 1.6)

    def test_clan_de_cuatro_en_t5(self):
        self.assertAlmostEqual(nexo_vida('T5', 4, PLANO), 5.0)

    def test_respeta_el_tope(self):
        self.assertAlmostEqual(nexo_vida('T13', 20, PLANO), 10.0)


class TestSustituir(unittest.TestCase):
    def test_clave_emite_data_catalog(self):
        self.assertEqual(
            sustituir('<td>{{wiki.ec.slots}}</td>', 'es', PLANO),
            '<td><span data-catalog="wiki.ec.slots">54</span></td>')

    def test_clave_decimal_se_formatea_por_idioma(self):
        self.assertIn('>10,0<', sustituir('{{wiki.nexo.tope}}', 'es', PLANO))
        self.assertIn('>10.0<', sustituir('{{wiki.nexo.tope}}', 'en', PLANO))

    def test_calculada_no_lleva_data_catalog(self):
        r = sustituir('{{nexo.vida(T5, 4)}}', 'es', PLANO)
        self.assertEqual(r, '5,0')

    def test_llave_escapada_queda_literal(self):
        self.assertEqual(sustituir('{{{{wiki.ec.slots}}', 'es', PLANO),
                         '{{wiki.ec.slots}}')

    def test_clave_inexistente_falla(self):
        with self.assertRaises(KeyError):
            sustituir('{{no.existe}}', 'es', PLANO)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `cd tools && python -m unittest test_build_wiki -v`
Expected: FAIL con `ModuleNotFoundError: No module named 'build_wiki'`

- [ ] **Step 3: Escribir el generador**

Crear `tools/build_wiki.py`:

```python
#!/usr/bin/env python3
"""Genera la wiki estatica desde wiki/ y data/catalogo.json.

Los cuerpos se escriben en HTML plano; este script les pone el cascarón y
sustituye las invocaciones {{...}} por valores del catalogo. Falla y no escribe
nada ante cualquier inconsistencia: una wiki a medias es peor que ninguna.

Solo biblioteca estandar.
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WIKI = RAIZ / 'wiki'
CATALOGO = RAIZ / 'data' / 'catalogo.json'
SITIO = 'https://hyperionsmc.com'

SALIDA = {'es': RAIZ / 'public' / 'wiki', 'en': RAIZ / 'public' / 'en' / 'wiki'}
PREFIJO = {'es': '/wiki', 'en': '/en/wiki'}
LOCALE = {'es': 'es_ES', 'en': 'en_US'}

_DECIMAL = re.compile(r'-?\d+\.\d+')
_CALCULADA = re.compile(r'\{\{nexo\.vida\(\s*(T13|T4|T5)\s*,\s*(\d+)\s*\)\}\}')
_CLAVE = re.compile(r'\{\{([a-z][a-zA-Z0-9._]*)\}\}')
_ESCAPE = '\x00LLAVES\x00'


def formatear(valor, lang):
    """El espanol escribe 10,0 y el ingles 10.0, como el resto del sitio."""
    s = str(valor)
    if lang == 'es' and _DECIMAL.fullmatch(s):
        return s.replace('.', ',')
    return s


def aplanar(d, prefijo=''):
    plano = {}
    for clave, valor in d.items():
        if clave.startswith('_'):
            continue
        ruta = prefijo + clave
        if isinstance(valor, dict):
            plano.update(aplanar(valor, ruta + '.'))
        else:
            plano[ruta] = str(valor)
    return plano


def nexo_vida(tier, miembros, plano):
    base = float(plano[f'wiki.nexo.base{tier}'])
    por = float(plano['wiki.nexo.porMiembro'])
    tope = float(plano['wiki.nexo.tope'])
    return min(base + por * int(miembros), tope)


def sustituir(cuerpo, lang, plano):
    """Resuelve las tres formas de {{ }}.

    El desescapado va al final para que un literal escapado no pueda acabar
    convertido en invocacion.
    """
    texto = cuerpo.replace('{{{{', _ESCAPE)

    def calc(m):
        v = nexo_vida(m.group(1), m.group(2), plano)
        s = f'{v:.1f}'
        return formatear(s, lang)

    texto = _CALCULADA.sub(calc, texto)

    def clave(m):
        k = m.group(1)
        if k not in plano:
            raise KeyError(f'clave desconocida en el cuerpo: {k}')
        v = html.escape(formatear(plano[k], lang))
        return f'<span data-catalog="{k}">{v}</span>'

    texto = _CLAVE.sub(clave, texto)
    return texto.replace(_ESCAPE, '{{')


def _lateral(paginas, secciones, lang, actual):
    partes = ['<nav class="wk-lat" aria-label="Secciones">']
    for sec in secciones:
        hijas = [p for p in paginas if p.get('seccion') == sec['id']]
        if not hijas:
            continue
        partes.append(f'<div class="wk-lat__sec">{html.escape(sec[lang])}</div><ul>')
        for p in sorted(hijas, key=lambda x: x['orden']):
            slug = p[lang]['slug']
            titulo = html.escape(p[lang]['titulo'])
            aqui = ' aria-current="page"' if p['par'] == actual else ''
            partes.append(f'<li><a href="{PREFIJO[lang]}/{slug}/"{aqui}>{titulo}</a></li>')
        partes.append('</ul>')
    partes.append('</nav>')
    return '\n'.join(partes)


def _url(lang, slug):
    return f'{SITIO}{PREFIJO[lang]}/' + (f'{slug}/' if slug else '')


def construir():
    datos = json.loads((WIKI / 'paginas.json').read_text(encoding='utf-8'))
    plano = aplanar(json.loads(CATALOGO.read_text(encoding='utf-8')))
    paginas, secciones = datos['paginas'], datos['secciones']

    # --- validaciones: se hacen todas antes de escribir nada ---
    for lang in ('es', 'en'):
        slugs = [p[lang]['slug'] for p in paginas]
        dup = {s for s in slugs if slugs.count(s) > 1}
        if dup:
            raise ValueError(f'slugs duplicados en {lang}: {sorted(dup)}')
        for p in paginas:
            cuerpo = WIKI / lang / f"{p[lang]['slug'] or 'index'}.html"
            if not cuerpo.exists():
                raise FileNotFoundError(f'falta el cuerpo {cuerpo}')
        declarados = {WIKI / lang / f"{p[lang]['slug'] or 'index'}.html" for p in paginas}
        for f in (WIKI / lang).glob('*.html'):
            if f not in declarados:
                raise ValueError(f'{f} no esta declarado en paginas.json')

    ids = {s['id'] for s in secciones}
    for p in paginas:
        if p.get('seccion') is not None and p['seccion'] not in ids:
            raise ValueError(f"seccion desconocida: {p['seccion']}")

    plantillas = {l: (WIKI / f'plantilla.{l}.html').read_text(encoding='utf-8')
                  for l in ('es', 'en')}

    escritos = []
    for lang in ('es', 'en'):
        shutil.rmtree(SALIDA[lang], ignore_errors=True)
        for p in paginas:
            meta, otro = p[lang], p['en' if lang == 'es' else 'es']
            slug = meta['slug']
            cuerpo = (WIKI / lang / f"{slug or 'index'}.html").read_text(encoding='utf-8')

            migas = [f'<a href="{PREFIJO[lang]}/">Wiki</a>']
            if p.get('seccion'):
                sec = next(s for s in secciones if s['id'] == p['seccion'])
                migas.append(f'<span>{html.escape(sec[lang])}</span>')
            migas.append(f'<span>{html.escape(meta["titulo"])}</span>')

            pagina = plantillas[lang]
            for marca, valor in (
                ('TITULO', html.escape(meta['titulo'])),
                ('RESUMEN', html.escape(meta['resumen'])),
                ('CANONICA', _url(lang, slug)),
                ('ALT_ES', _url('es', p['es']['slug'])),
                ('ALT_EN', _url('en', p['en']['slug'])),
                ('LOCALE', LOCALE[lang]),
                ('MIGAS', ' › '.join(migas)),
                ('LATERAL', _lateral(paginas, secciones, lang, p['par'])),
                ('CUERPO', sustituir(cuerpo, lang, plano)),
            ):
                pagina = pagina.replace('{{' + marca + '}}', valor)

            destino = SALIDA[lang] / (f'{slug}/index.html' if slug else 'index.html')
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_text(pagina, encoding='utf-8')
            escritos.append(destino)

    # --- indice del buscador ---
    entradas = []
    for lang in ('es', 'en'):
        for p in paginas:
            m = p[lang]
            entradas.append({
                'l': lang, 's': m['slug'], 't': m['titulo'], 'r': m['resumen'],
                'c': p.get('comandos', []), 'a': m.get('alias', []),
            })
    indice = RAIZ / 'public' / 'js' / 'wiki-index.js'
    indice.write_text(
        '/* Generado por tools/build_wiki.py. No editar a mano. */\n'
        'window.HY_WIKI = ' + json.dumps(entradas, ensure_ascii=False) + ';\n',
        encoding='utf-8')
    escritos.append(indice)
    return escritos


if __name__ == '__main__':
    try:
        hechos = construir()
    except Exception as e:
        print(f'FALLO al generar la wiki: {e}')
        sys.exit(1)
    print(f'OK: {len(hechos)} archivos generados')
```

- [ ] **Step 4: Ejecutar las pruebas**

Run: `cd tools && python -m unittest test_build_wiki -v`
Expected: PASS, 14 tests

- [ ] **Step 5: Escribir las plantillas**

`wiki/plantilla.es.html` y `wiki/plantilla.en.html`. Copiar la cabecera y el pie de `public/soporte/index.html` (español) y `public/en/support/index.html` (inglés) **tal cual**, y sustituir el `<main>` por la estructura de la wiki.

La zona `<head>` de la versión española queda así. **El orden importa**: los `<link rel="alternate">` van antes de `lang.js`, que los lee de forma síncrona.

```html
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{TITULO}} — Wiki de Hyperions MC</title>
  <meta name="description" content="{{RESUMEN}}">
  <meta name="theme-color" content="#030B0D">
  <link rel="canonical" href="{{CANONICA}}">
  <link rel="alternate" hreflang="es" href="{{ALT_ES}}">
  <link rel="alternate" hreflang="en" href="{{ALT_EN}}">
  <link rel="alternate" hreflang="x-default" href="{{ALT_EN}}">
  <script src="/js/lang.js"></script>

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Hyperions MC">
  <meta property="og:title" content="{{TITULO}}">
  <meta property="og:description" content="{{RESUMEN}}">
  <meta property="og:url" content="{{CANONICA}}">
  <meta property="og:locale" content="{{LOCALE}}">
  <meta property="og:image" content="https://hyperionsmc.com/img/logo-emblem-og.jpg">

  <link rel="icon" type="image/png" href="/img/logo-emblem-64.png">
  <link rel="apple-touch-icon" href="/img/logo-emblem-256.png">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/wiki.css">
  <script src="/js/main.js" defer></script>
  <script src="/js/wiki-index.js" defer></script>
  <script src="/js/wiki-search.js" defer></script>
</head>
```

Y el cuerpo, entre la cabecera y el pie copiados:

```html
  <main class="wk">
    <div class="wk__container">
      {{LATERAL}}
      <article class="wk-art">
        <nav class="wk-migas" aria-label="Ruta">{{MIGAS}}</nav>
        <div class="wk-buscador">
          <label class="wk-buscador__label" for="wk-q">Buscar en la wiki</label>
          <input id="wk-q" class="wk-buscador__input" type="search"
            placeholder="Prueba con /ec o «bóveda»" autocomplete="off">
          <ul id="wk-res" class="wk-res" hidden></ul>
        </div>
        <h1 class="wk-art__titulo">{{TITULO}}</h1>
        <p class="wk-art__resumen">{{RESUMEN}}</p>
        {{CUERPO}}
      </article>
    </div>
  </main>
```

En la inglesa, `<title>{{TITULO}} — Hyperions MC Wiki</title>`, `aria-label="Sections"`, `aria-label="Breadcrumb"`, la etiqueta `Search the wiki` y el marcador `Try /ec or "vault"`.

- [ ] **Step 6: Escribir `wiki/paginas.json` con la primera página**

```json
{
  "secciones": [
    { "id": "empezar", "es": "Empezar", "en": "Getting started" },
    { "id": "base", "es": "Tu base", "en": "Your base" },
    { "id": "combate", "es": "Combate", "en": "Combat" },
    { "id": "progresion", "es": "Progresión", "en": "Progression" },
    { "id": "economia", "es": "Economía", "en": "Economy" },
    { "id": "objetos", "es": "Objetos y cosmética", "en": "Items & cosmetics" },
    { "id": "referencia", "es": "Referencia", "en": "Reference" }
  ],
  "paginas": [
    {
      "par": "ender-vault",
      "seccion": "objetos",
      "orden": 10,
      "comandos": ["/ec", "/ec 2", "/ec 3"],
      "es": {
        "slug": "boveda-del-ender",
        "titulo": "Bóveda del Ender",
        "resumen": "Hasta 3 páginas de 54 espacios que no pierdes al morir.",
        "alias": ["vault", "boveda", "bóveda", "cofre del ender", "enderchest"]
      },
      "en": {
        "slug": "ender-vault",
        "titulo": "Ender Vault",
        "resumen": "Up to 3 pages of 54 slots that you keep when you die.",
        "alias": ["vault", "enderchest", "ender chest"]
      }
    }
  ]
}
```

- [ ] **Step 7: Añadir las claves del EnderChest al catálogo**

En `data/catalogo.json`, junto a las demás claves de nivel superior:

```json
"wiki": {
  "ec": {
    "paginas": 3,
    "slots": 54,
    "precio1": "20 💎",
    "precio2": "34 💎",
    "precio3": "58 💎"
  }
}
```

- [ ] **Step 8: Escribir los dos cuerpos**

`wiki/es/boveda-del-ender.html`. El contenido sale del apartado «Bóveda del Ender / Ender Vault» de `docs/wiki-encargo.md`. Empieza por un `<h2>`: el `<h1>` lo pone el generador.

```html
<h2>Qué es</h2>
<p>Un almacén de <strong>{{wiki.ec.paginas}} páginas</strong> de
  <strong>{{wiki.ec.slots}} espacios</strong> cada una. <strong>No es el cofre del
  ender normal</strong>, y no lo pierdes al morir.</p>

<h2>Cómo se abre</h2>
<p>Escribe <code>/ec</code>. Para cambiar de página, <code>/ec 2</code> y
  <code>/ec 3</code>.</p>

<h2>Qué cuesta cada página</h2>
<table class="wk-tabla">
  <thead>
    <tr><th scope="col">Página</th><th scope="col">Precio</th><th scope="col">Incluida en</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>{{wiki.ec.precio1}}</td><td>Titan</td></tr>
    <tr><td>2</td><td>{{wiki.ec.precio2}}</td><td>Olympian</td></tr>
    <tr><td>3</td><td>{{wiki.ec.precio3}}</td><td>Nadie: se compra en <code>/shop</code></td></tr>
  </tbody>
</table>
<p>Titan incluye la primera página; Olympian, las dos primeras. La tercera se
  compra siempre en <code>/shop</code>.</p>
<p><a href="/rangos/">Compara los rangos</a> · <a href="/tienda/">Ver la tienda</a></p>
```

`wiki/en/ender-vault.html` es la misma estructura con el texto en inglés y **los mismos `{{...}}`**: «Included in», «Nobody: bought in `/shop`», y los enlaces a `/en/ranks/` y `/en/store/`.

- [ ] **Step 9: Hacer que el verificador vea la wiki**

En `tools/check_catalogo.py`, sustituir las dos listas fijas:

```python
def _paginas(base_wiki, *fijas):
    """Las paginas fijas mas todas las de la wiki de ese idioma, para que una
       pagina nueva entre sola en la comprobacion sin tocar este archivo."""
    rutas = list(fijas)
    d = RAIZ / base_wiki
    if d.exists():
        rutas += sorted(str(x.relative_to(RAIZ)).replace(chr(92), '/')
                        for x in d.rglob('index.html'))
    return rutas


ES_FILES = _paginas('public/wiki',
                    'public/index.html', 'public/rangos/index.html',
                    'public/tienda/index.html')
EN_FILES = _paginas('public/en/wiki',
                    'public/en/index.html', 'public/en/ranks/index.html',
                    'public/en/store/index.html')
```

`public/en/wiki` esta dentro de `public`, pero no de `public/wiki`: los dos
`rglob` no se solapan, asi que ninguna pagina entra en las dos listas.

- [ ] **Step 10: Generar y comprobar**

Run: `python tools/build_wiki.py`
Expected: `OK: 3 archivos generados` (1 página × 2 idiomas + el índice del buscador)

Run: `python tools/check_catalogo.py`
Expected: `OK: 92 claves cuadran en ES y EN` (87 + 5 nuevas)

- [ ] **Step 11: Verificar que el generador falla cuando debe**

Cambiar temporalmente `{{wiki.ec.slots}}` por `{{wiki.ec.inventado}}` en el cuerpo español y ejecutar:

Run: `python tools/build_wiki.py`
Expected: `FALLO al generar la wiki: 'clave desconocida en el cuerpo: wiki.ec.inventado'`, salida 1

Deshacerlo con `git checkout wiki/es/boveda-del-ender.html` y volver a generar.

- [ ] **Step 12: Commit**

```bash
git add tools/build_wiki.py tools/test_build_wiki.py tools/check_catalogo.py \
        wiki/ data/catalogo.json public/wiki public/en/wiki public/js/wiki-index.js
git commit -m "feat: generador de la wiki y la primera pagina"
```

---

### Task 2: `lang.js` sin mapa de rutas

**Files:**
- Modify: `public/js/lang.js:8-14` y la función `counterpart`

**Interfaces:**
- Consumes: los `<link rel="alternate" hreflang>` que la plantilla de Task 1 ya emite.
- Produces: nada nuevo. Las 12 páginas actuales siguen funcionando igual.

- [ ] **Step 1: Comprobar el estado de partida**

Run: `python -m http.server 8123 -d public`

Abrir `http://localhost:8123/wiki/boveda-del-ender/`, pulsar el botón EN y observar que **lleva a `/en/`**, la portada inglesa, en vez de a `/en/wiki/ender-vault/`. Ese es el fallo.

- [ ] **Step 2: Sustituir el mapa por la lectura del `hreflang`**

Borrar `MAP` y `REV` de `public/js/lang.js` y reescribir `counterpart`:

```js
  /* La pagina declara su equivalente en el <head>, antes de este script.
     Antes habia un mapa de rutas escrito a mano: cualquier ruta que no
     estuviera en el mandaba al visitante a la portada. */
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

- [ ] **Step 3: Añadir la guarda contra bucle**

Las tres redirecciones automáticas pasan a comprobar el destino. Sin esto, una
página que se declarase como su propia alternativa recargaría sin fin — algo que
el mapa codificado hacía imposible.

```js
  function irA(destino) {
    if (destino && destino !== path) location.replace(destino);
  }

  if (pref === 'es' && isEn) { irA(counterpart()); return; }
  if (pref === 'en' && !isEn) { irA(counterpart()); return; }
  if (!pref && !isEn) {
    const nav = (navigator.language || '').toLowerCase();
    if (!nav.startsWith('es')) { irA(counterpart()); return; }
  }
```

`path` ya está normalizado con barra final unas líneas más arriba.

- [ ] **Step 4: Validar los pares en el generador**

En `tools/build_wiki.py`, dentro de `construir()` y junto a las demás validaciones:

```python
    for p in paginas:
        if _url('es', p['es']['slug']) == _url('en', p['en']['slug']):
            raise ValueError(f"el par {p['par']} apunta a la misma URL en los dos idiomas")
```

- [ ] **Step 5: Verificar las 14 páginas una por una**

Run: `python -m http.server 8123 -d public`

Comprobar el botón ES/EN en las 12 actuales y en las 2 de la wiki. En cada una debe llevar a su equivalente, no a la portada:

| Desde | Debe ir a |
|---|---|
| `/` | `/en/` |
| `/rangos/` | `/en/ranks/` |
| `/tienda/` | `/en/store/` |
| `/como-entrar/` | `/en/how-to-join/` |
| `/reglas/` | `/en/rules/` |
| `/soporte/` | `/en/support/` |
| `/wiki/boveda-del-ender/` | `/en/wiki/ender-vault/` |

Y las seis inglesas en sentido contrario. Limpiar `localStorage` entre pruebas:
`lang.js` recuerda la preferencia y puede redirigir antes de que veas nada.

- [ ] **Step 6: Commit**

```bash
git add public/js/lang.js tools/build_wiki.py
git commit -m "fix: lang.js lee el hreflang de la pagina en vez de un mapa de rutas"
```

---

### Task 3: Presentación y menú móvil

**Files:**
- Create: `public/css/wiki.css`, `public/js/menu.js`
- Modify: `public/css/styles.css` (menú de cabecera)
- Modify: las 12 páginas actuales y las 2 plantillas (botón de menú)

**Interfaces:**
- Consumes: las clases que emite el generador de Task 1 — `wk`, `wk__container`, `wk-lat`, `wk-lat__sec`, `wk-art`, `wk-migas`, `wk-buscador`, `wk-res`, `wk-tabla`.
- Produces: `.wk-tabla`, la clase de tabla que usarán todos los cuerpos.

- [ ] **Step 1: Escribir `public/css/wiki.css`**

Rejilla de dos columnas que pasa a una sola en móvil, con la lateral plegable.
Usar las variables que ya existen en `styles.css`: `--bg`, `--surface`,
`--border`, `--text`, `--muted`, `--faint`, `--gold`, `--gold-bright`, `--teal`,
`--teal-bright`.

```css
/* ---------- Wiki ---------- */
.wk { padding: clamp(24px, 5vh, 48px) 0 clamp(48px, 8vh, 80px); }
.wk__container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 clamp(18px, 4vw, 40px);
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: clamp(24px, 4vw, 48px);
  align-items: start;
}

.wk-lat { position: sticky; top: 88px; }
.wk-lat__sec {
  margin-top: 18px;
  font-family: 'Montserrat', sans-serif;
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--faint);
}
.wk-lat ul { list-style: none; margin: 6px 0 0; padding: 0; }
.wk-lat a {
  display: block;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: .9rem;
  color: var(--muted);
}
.wk-lat a:hover { color: var(--text); background: var(--surface); }
.wk-lat a[aria-current="page"] {
  color: var(--gold-bright);
  background: rgba(244, 197, 106, .1);
  font-weight: 700;
}

.wk-migas { font-size: .8rem; color: var(--faint); margin-bottom: 14px; }
.wk-migas a { color: var(--teal-bright); }

.wk-art__titulo {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: clamp(1.8rem, 4.5vw, 2.5rem);
  line-height: 1.15;
  margin: 8px 0 0;
}
.wk-art__resumen {
  margin: 10px 0 26px;
  font-size: 1.05rem;
  color: var(--muted);
  line-height: 1.6;
}
.wk-art h2 {
  margin: 34px 0 10px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--gold-bright);
}
.wk-art p { margin: 0 0 12px; line-height: 1.7; color: var(--text); }
.wk-art code {
  font-family: ui-monospace, monospace;
  font-size: .92em;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--teal-bright);
}

.wk-tabla {
  width: 100%;
  border-collapse: collapse;
  margin: 6px 0 18px;
  font-size: .92rem;
}
.wk-tabla th, .wk-tabla td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}
.wk-tabla th {
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--faint);
}
.wk-tabla tbody tr:hover { background: var(--surface); }

/* Las tablas anchas hacen scroll solas, no la pagina */
.wk-art .wk-tabla-wrap { overflow-x: auto; }

@media (max-width: 860px) {
  .wk__container { grid-template-columns: minmax(0, 1fr); }
  .wk-lat {
    position: static;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px 14px;
    background: var(--surface);
  }
}
```

- [ ] **Step 2: Escribir el buscador visualmente**

Al final de `wiki.css`:

```css
/* ---------- Buscador ---------- */
.wk-buscador { position: relative; margin-bottom: 18px; }
.wk-buscador__label {
  display: block;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 6px;
}
.wk-buscador__input {
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: .95rem;
  font-family: inherit;
}
.wk-buscador__input:focus {
  outline: none;
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(53, 208, 183, .18);
}
.wk-res {
  position: absolute;
  z-index: 20;
  left: 0; right: 0;
  margin: 6px 0 0;
  padding: 6px;
  list-style: none;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg2, #030B0D);
  box-shadow: 0 24px 48px -16px rgba(0, 0, 0, .8);
  max-height: 60vh;
  overflow-y: auto;
}
.wk-res[hidden] { display: none; }
.wk-res a { display: block; padding: 9px 12px; border-radius: 8px; }
.wk-res a:hover, .wk-res a:focus { background: var(--surface); }
.wk-res__t { font-weight: 700; color: var(--text); }
.wk-res__r { display: block; font-size: .82rem; color: var(--muted); margin-top: 2px; }
.wk-res__vacio { padding: 12px; font-size: .88rem; color: var(--faint); }
```

- [ ] **Step 3: Añadir el botón de menú a `styles.css`**

Hoy `.nav-link` se oculta por debajo de 460 px, así que una entrada «Wiki» en la
cabecera sería invisible en cualquier teléfono.

```css
/* ---------- Menu de cabecera en movil ---------- */
/* Por debajo de 460px se ocultan los enlaces de texto y aparece este boton.
   Sin el, "Rangos" y "Wiki" no se alcanzan desde el telefono. */
.menu-btn { display: none; }
.menu-panel { display: none; }

@media (max-width: 460px) {
  .menu-btn {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
  }
  .menu-panel {
    display: none;
    position: absolute;
    top: 100%;
    right: clamp(14px, 4vw, 24px);
    z-index: 60;
    min-width: 180px;
    margin-top: 8px;
    padding: 8px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--bg2, #030B0D);
    box-shadow: 0 24px 48px -16px rgba(0, 0, 0, .8);
  }
  .menu-panel.is-open { display: block; }
  .menu-panel a {
    display: block;
    padding: 10px 12px;
    border-radius: 9px;
    font-size: .92rem;
    color: var(--muted);
  }
  .menu-panel a:hover { color: var(--gold-bright); background: var(--surface); }
  .site-header__inner { position: relative; }
}
```

- [ ] **Step 4: Escribir `public/js/menu.js`**

```js
/* Hyperions MC — menu de cabecera en movil.
   Seguridad: sin innerHTML; solo se conmutan clases y atributos. */
(() => {
  'use strict';
  const btn = document.getElementById('menu-btn');
  const panel = document.getElementById('menu-panel');
  if (!btn || !panel) return;

  function cerrar() {
    panel.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const abierto = panel.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(abierto));
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target)) cerrar();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { cerrar(); btn.focus(); }
  });
})();
```

- [ ] **Step 5: Añadir el botón y el panel a la cabecera**

En las 12 páginas actuales y en las 2 plantillas, dentro de
`.site-header__actions` y **antes** del selector de idioma:

```html
        <button id="menu-btn" class="menu-btn" type="button"
          aria-expanded="false" aria-controls="menu-panel" aria-label="Menú">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
            <path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path>
          </svg>
        </button>
        <div id="menu-panel" class="menu-panel">
          <a href="/rangos/">Rangos</a>
          <a href="/wiki/">Wiki</a>
          <a href="/tienda/">Tienda</a>
        </div>
```

Y añadir `<script src="/js/menu.js" defer></script>` junto a los demás scripts.
En inglés: `aria-label="Menu"`, y los enlaces a `/en/ranks/`, `/en/wiki/` y
`/en/store/`.

- [ ] **Step 6: Añadir la entrada «Wiki» fuera de móvil**

En las mismas 14 páginas, junto al enlace «Rangos» de la cabecera:

```html
        <a href="/wiki/" class="nav-link">Wiki</a>
```

Y en la columna «Servidor» del pie, después de «Rangos»:

```html
          <a href="/wiki/">Wiki</a>
```

- [ ] **Step 7: Verificar en el navegador**

Run: `python tools/build_wiki.py && python -m http.server 8123 -d public`

- A 1280 px: la lateral se ve a la izquierda y «Wiki» aparece en la cabecera.
- A 390 px: los enlaces de texto desaparecen, el botón de menú abre el panel, y
  se cierra al pulsar fuera y con `Escape`.
- `document.documentElement.scrollWidth === clientWidth` en las 14 páginas, a
  390 px: nada puede desbordar.
- Sin errores en consola.

- [ ] **Step 8: Commit**

```bash
git add public/css/wiki.css public/css/styles.css public/js/menu.js \
        wiki/plantilla.es.html wiki/plantilla.en.html public/*/index.html \
        public/en/*/index.html public/index.html public/wiki public/en/wiki
git commit -m "feat: estilos de la wiki y menu de cabecera en movil"
```

---

### Task 4: El buscador

**Files:**
- Create: `public/js/wiki-search.js`

**Interfaces:**
- Consumes: `window.HY_WIKI`, que emite el generador de Task 1, y los elementos
  `#wk-q` y `#wk-res` de la plantilla.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Escribir el buscador**

```js
/* Hyperions MC — buscador de la wiki.
   El indice viene de /js/wiki-index.js, que genera tools/build_wiki.py.
   Es un .js normal: no hace falta ninguna peticion, y la CSP no se toca.
   Seguridad: los resultados se pintan con createElement/textContent. */
(() => {
  'use strict';
  const input = document.getElementById('wk-q');
  const lista = document.getElementById('wk-res');
  if (!input || !lista || !Array.isArray(window.HY_WIKI)) return;

  const EN = document.documentElement.lang === 'en';
  const PREFIJO = EN ? '/en/wiki/' : '/wiki/';
  const SIN_RESULTADOS = EN ? 'Nothing found.' : 'No hay resultados.';

  /* "boveda" tiene que encontrar "Bóveda": el jugador no escribe tildes. */
  const plano = (s) => s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  const entradas = window.HY_WIKI
    .filter((e) => e.l === (EN ? 'en' : 'es'))
    .map((e) => Object.assign({}, e, {
      _b: plano([e.t, e.r, (e.c || []).join(' '), (e.a || []).join(' ')].join(' ')),
    }));

  function pintar(res) {
    while (lista.firstChild) lista.removeChild(lista.firstChild);
    if (!res.length) {
      const li = document.createElement('li');
      li.className = 'wk-res__vacio';
      li.textContent = SIN_RESULTADOS;
      lista.appendChild(li);
      lista.hidden = false;
      return;
    }
    res.slice(0, 8).forEach((e) => {
      const a = document.createElement('a');
      a.href = PREFIJO + (e.s ? e.s + '/' : '');
      const t = document.createElement('span');
      t.className = 'wk-res__t';
      t.textContent = e.t;
      const r = document.createElement('span');
      r.className = 'wk-res__r';
      r.textContent = e.r;
      a.append(t, r);
      const li = document.createElement('li');
      li.appendChild(a);
      lista.appendChild(li);
    });
    lista.hidden = false;
  }

  input.addEventListener('input', () => {
    const q = plano(input.value.trim());
    if (!q) { lista.hidden = true; return; }
    pintar(entradas.filter((e) => e._b.includes(q)));
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.value = ''; lista.hidden = true; }
  });

  document.addEventListener('click', (e) => {
    if (e.target !== input && !lista.contains(e.target)) lista.hidden = true;
  });
})();
```

- [ ] **Step 2: Verificar en el navegador**

Run: `python -m http.server 8123 -d public`, abrir `/wiki/boveda-del-ender/`.

| Escribes | Debe encontrar |
|---|---|
| `/ec` | Bóveda del Ender |
| `boveda` | Bóveda del Ender (sin tilde) |
| `bóveda` | Bóveda del Ender |
| `vault` | Bóveda del Ender (por alias) |
| `zzzz` | «No hay resultados.» |

En `/en/wiki/ender-vault/`, `vault` encuentra Ender Vault y el mensaje vacío
está en inglés. Comprobar además que solo salen resultados del idioma de la
página.

- [ ] **Step 3: Commit**

```bash
git add public/js/wiki-search.js
git commit -m "feat: buscador de la wiki por titulo, resumen, comandos y alias"
```

---

### Task 5: El Nexo — tres páginas

**Files:**
- Modify: `data/catalogo.json` (14 claves `wiki.nexo.*`)
- Modify: `wiki/paginas.json` (3 páginas)
- Create: `wiki/es/nexo.html`, `wiki/es/como-se-pierde-el-nexo.html`, `wiki/es/raid-y-regeneracion.html`
- Create: `wiki/en/nexus.html`, `wiki/en/losing-your-nexus.html`, `wiki/en/raid-and-regen.html`

**Interfaces:**
- Consumes: `sustituir()` y la forma `{{nexo.vida(tier, miembros)}}` de Task 1.
- Produces: nada que consuman otras tareas.

Es el sistema con más tráfico previsto. Todo el contenido sale del apartado
«El Nexo / The Nexus» de `docs/wiki-encargo.md`.

- [ ] **Step 1: Añadir las claves al catálogo**

Dentro de `"wiki"`, junto a `"ec"`:

```json
"nexo": {
  "baseT13": "1.1",
  "baseT4": "2.1",
  "baseT5": "3.0",
  "porMiembro": "0.5",
  "tope": "10.0",
  "pvp": "−1.0",
  "mob": "−0.5",
  "netherMult": "×1.5",
  "endMult": "×2",
  "raidMin": "40 min",
  "regenMin": "60 min",
  "ofrendaDiamantes": 8,
  "ofrendaResta": "1 min",
  "ofrendaTope": "20 min",
  "gracia": "24 h"
}
```

Son 15 claves. Las tres primeras y `porMiembro` y `tope` se guardan como cadena
para que `formatear()` las convierta a coma en español.

- [ ] **Step 2: Declarar las tres páginas**

Añadir a `wiki/paginas.json`:

```json
{
  "par": "nexus", "seccion": "base", "orden": 10, "comandos": [],
  "es": { "slug": "nexo", "titulo": "Qué es el Nexo",
          "resumen": "El bloque-mena de tu base. Su vida depende del tier de protección y de cuántos seáis.",
          "alias": ["nexo", "nexus", "mena", "bloque de base"] },
  "en": { "slug": "nexus", "titulo": "What the Nexus is",
          "resumen": "Your base's claim block. Its life depends on your protection tier and how many you are.",
          "alias": ["nexus", "claim block", "ore"] }
},
{
  "par": "nexus-loss", "seccion": "base", "orden": 20, "comandos": [],
  "es": { "slug": "como-se-pierde-el-nexo", "titulo": "Cómo se pierde el Nexo",
          "resumen": "Cada muerte le quita vida. Cuánta depende de cómo mueras y de en qué dimensión.",
          "alias": ["perder nexo", "dano nexo", "muertes"] },
  "en": { "slug": "losing-your-nexus", "titulo": "Losing your Nexus",
          "resumen": "Every death costs it life. How much depends on how you die and where.",
          "alias": ["nexus damage", "lose nexus", "deaths"] }
},
{
  "par": "raid", "seccion": "base", "orden": 30, "comandos": [],
  "es": { "slug": "raid-y-regeneracion", "titulo": "Raid y regeneración",
          "resumen": "Con la vida a 0 tu base es raideable 40 minutos. Regenerar del todo lleva 60.",
          "alias": ["raid", "raideo", "regeneracion", "ofrenda", "diamantes"] },
  "en": { "slug": "raid-and-regen", "titulo": "Raid & regen",
          "resumen": "At 0 life your base is raidable for 40 minutes. A full regen takes 60.",
          "alias": ["raid", "regen", "offering", "diamonds"] }
}
```

- [ ] **Step 3: Escribir «Qué es el Nexo»**

`wiki/es/nexo.html`. La tabla usa la forma calculada, que produce la misma cifra
en los dos idiomas por construcción:

```html
<h2>Qué es</h2>
<p>El Nexo es el bloque-mena de tu base. Mientras tenga vida, tu terreno está
  protegido. Un miembro solo cuenta si ha entrado alguna vez al servidor.</p>

<h2>Cuánta vida tiene</h2>
<p>La vida de partida depende del tier de tu protección, y sube
  <strong>{{wiki.nexo.porMiembro}}</strong> por cada miembro del clan, hasta un
  máximo de <strong>{{wiki.nexo.tope}}</strong>.</p>

<div class="wk-tabla-wrap">
  <table class="wk-tabla">
    <thead>
      <tr><th scope="col">Tier</th><th scope="col">Base</th><th scope="col">Tú solo</th>
        <th scope="col">4 miembros</th><th scope="col">10 miembros</th></tr>
    </thead>
    <tbody>
      <tr><td>Tiers 1–3</td><td>{{wiki.nexo.baseT13}}</td><td>{{nexo.vida(T13, 1)}}</td>
        <td>{{nexo.vida(T13, 4)}}</td><td>{{nexo.vida(T13, 10)}}</td></tr>
      <tr><td>Tier 4</td><td>{{wiki.nexo.baseT4}}</td><td>{{nexo.vida(T4, 1)}}</td>
        <td>{{nexo.vida(T4, 4)}}</td><td>{{nexo.vida(T4, 10)}}</td></tr>
      <tr><td>Tier 5 · de pago</td><td>{{wiki.nexo.baseT5}}</td><td>{{nexo.vida(T5, 1)}}</td>
        <td>{{nexo.vida(T5, 4)}}</td><td>{{nexo.vida(T5, 10)}}</td></tr>
    </tbody>
  </table>
</div>

<p>Al llegar a <strong>{{wiki.nexo.tope}}</strong> deja de subir. Podéis seguir
  admitiendo gente en el clan, pero no suma más vida.</p>
<p>El <strong>Tier 5</strong> se compra en la <a href="/tienda/">tienda</a>. Sube
  la vida de partida y el área protegida; su ventaja es máxima jugando solo y
  desaparece cuando los dos tiers llegan al tope.</p>
```

**No menciones «a partir de 20 miembros»**: el tope llega antes en los tres
tiers, y decirlo haría creer a un clan de 14 en T5 que aún le queda margen.

`wiki/en/nexus.html` es la misma estructura en inglés, con los mismos `{{...}}`
y enlace a `/en/store/`.

- [ ] **Step 4: Escribir «Cómo se pierde el Nexo»**

`wiki/es/como-se-pierde-el-nexo.html`:

```html
<h2>Qué le quita vida</h2>
<p><strong>Morirte tú baja tu propio Nexo.</strong> No hay cooldown: cada muerte
  cuenta al instante.</p>

<div class="wk-tabla-wrap">
  <table class="wk-tabla">
    <thead><tr><th scope="col">Cómo mueres</th><th scope="col">Vida que pierde</th></tr></thead>
    <tbody>
      <tr><td>Te mata otro jugador</td><td>{{wiki.nexo.pvp}}</td></tr>
      <tr><td>Te mata un mob</td><td>{{wiki.nexo.mob}}</td></tr>
      <tr><td>Caída, lava, void, <code>/kill</code> o un compañero</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<h2>Dónde mueres multiplica</h2>
<table class="wk-tabla">
  <thead><tr><th scope="col">Dimensión</th><th scope="col">Multiplicador</th></tr></thead>
  <tbody>
    <tr><td>Overworld</td><td>×1</td></tr>
    <tr><td>Nether</td><td>{{wiki.nexo.netherMult}}</td></tr>
    <tr><td>End</td><td>{{wiki.nexo.endMult}}</td></tr>
  </tbody>
</table>

<h2>Un ejemplo</h2>
<p>Un clan de 4 con protección de tier 1–3 tiene
  <strong>{{nexo.vida(T13, 4)}}</strong> de vida. Dos muertes en PvP en el Nether
  cuestan 1,5 cada una: <strong>−3,0</strong> en total. Le queda
  <strong>0,1</strong>.</p>
<p>Ese mismo clan con Protección T5 partiría de
  <strong>{{nexo.vida(T5, 4)}}</strong> y aguantaría esas dos muertes con 2,0 de
  sobra.</p>
```

El ejemplo **dice de qué tier habla**. Sin eso, alguien con T5 haría la cuenta
con la base equivocada.

En la versión inglesa los decimales del texto corrido van con punto: «1.5 each»,
«−3.0», «0.1», «2.0».

- [ ] **Step 5: Escribir «Raid y regeneración»**

`wiki/es/raid-y-regeneracion.html`:

```html
<h2>Con la vida a 0</h2>
<p>Tu base queda <strong>raideable durante {{wiki.nexo.raidMin}}</strong>: sin
  protección y con PvP forzado.</p>

<h2>Regenerar</h2>
<p>Volver de 0 al máximo lleva <strong>{{wiki.nexo.regenMin}}</strong>, seáis uno
  o veinte. <strong>Morir durante la regeneración reinicia el contador.</strong></p>

<h2>Acelerarlo con ofrendas</h2>
<p>Haz clic derecho en el Nexo con diamantes en la mano.
  <strong>{{wiki.nexo.ofrendaDiamantes}} diamantes restan
  {{wiki.nexo.ofrendaResta}}</strong>, hasta un máximo de
  <strong>{{wiki.nexo.ofrendaTope}}</strong>.</p>

<h2>Si acabas de empezar</h2>
<p>Una mena nueva tiene <strong>{{wiki.nexo.gracia}} de gracia</strong>: no puede
  caer durante ese tiempo.</p>
```

- [ ] **Step 6: Generar y comprobar**

Run: `python tools/build_wiki.py`
Expected: `OK: 9 archivos generados` (4 páginas × 2 idiomas + el índice)

Run: `python tools/check_catalogo.py`
Expected: `OK: 107 claves cuadran en ES y EN` (92 + 15)

- [ ] **Step 7: Verificar que las cifras calculadas coinciden entre idiomas**

```bash
python -c "
import re,io
es = io.open('public/wiki/nexo/index.html', encoding='utf-8').read()
en = io.open('public/en/wiki/nexus/index.html', encoding='utf-8').read()
n = lambda h: [c.replace(',', '.') for c in re.findall(r'<td>(\d+[.,]\d)</td>', h)]
print('ES:', n(es)); print('EN:', n(en))
assert n(es) == n(en), 'las cifras calculadas difieren entre idiomas'
print('coinciden')
"
```

Expected: las dos listas idénticas y `coinciden`.

- [ ] **Step 8: Commit**

```bash
git add data/catalogo.json wiki/ public/wiki public/en/wiki public/js/wiki-index.js
git commit -m "feat: las tres paginas del Nexo"
```

---

### Task 6: Combate, progresión y economía

**Files:**
- Modify: `data/catalogo.json` (8 claves: `wiki.muerte.*`, `wiki.bounty.*`, `wiki.combatlog.clon`, `wiki.subasta.*`)
- Modify: `wiki/paginas.json` (4 páginas)
- Create: 8 cuerpos bajo `wiki/es/` y `wiki/en/`

**Interfaces:**
- Consumes: el generador de Task 1.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Añadir las claves**

Dentro de `"wiki"`:

```json
"muerte": { "penalizacion": "5%", "cooldown": "15 min" },
"bounty": { "minimo": 100, "comision": "5%", "autocabeza": "1%" },
"combatlog": { "clon": "45 s" },
"subasta": { "comision": "5%", "duracion": "48 h" }
```

- [ ] **Step 2: Declarar las cuatro páginas**

Los pares, secciones y slugs:

| `par` | `seccion` | `orden` | Slug ES | Slug EN |
|---|---|---|---|---|
| `kill-die` | combate | 10 | `matar-y-morir` | `killing-and-dying` |
| `ranks` | progresion | 10 | `rangos-y-dracma` | `ranks-and-dracma` |
| `leaderboards` | progresion | 20 | `clasificaciones` | `leaderboards` |
| `auction` | economia | 10 | `casa-de-subastas` | `auction-house` |

Comandos por página: `["/bounty"]`, `["/dracma", "/shop"]`, `["/leaderboards"]`,
`["/ah sell", "/ah expired"]`.

- [ ] **Step 3: Escribir «Matar y morir»**

`wiki/es/matar-y-morir.html`, con el contenido del apartado «Matar y morir» de
`docs/wiki-encargo.md` más el clon por desconectar, que el encargo coloca en La
Fosa pero es una consecuencia del combate:

```html
<h2>Qué cuesta morir</h2>
<p>Morir te cuesta el <strong>{{wiki.muerte.penalizacion}} de tu dinero</strong>.
  El <strong>mismo asesino solo te cobra una vez cada
  {{wiki.muerte.cooldown}}</strong>.</p>

<h2>Poner precio a alguien</h2>
<p>Con <code>/bounty</code>. El mínimo es
  <strong>{{wiki.bounty.minimo}}</strong> y se cobra una comisión del
  <strong>{{wiki.bounty.comision}}</strong>.</p>
<p>Ojo: al cobrar una recompensa, el
  <strong>{{wiki.bounty.autocabeza}} de tu propio saldo</strong> pasa a tu
  cabeza. Cazar recompensas te convierte en objetivo.</p>

<h2>No te desconectes peleando</h2>
<p>Si huyes en combate dejas un <strong>clon castigable durante
  {{wiki.combatlog.clon}}</strong>.</p>
```

- [ ] **Step 4: Escribir «Rangos y Dracma»**

`wiki/es/rangos-y-dracma.html`. **No repite la tabla de rangos**: enlaza a la que
ya existe y está vigilada.

```html
<h2>Qué hace un rango</h2>
<p>Multiplica lo que ganas trabajando, y sube tus homes, tus protecciones y tus
  espacios de subasta. De menor a mayor: <strong>Mortal → Hero → Demigod → Titan
  → Olympian</strong>.</p>
<p>Cada rango entrega además <strong>llaves de caja cada 30 días</strong>. La
  cantidad y el tipo dependen del rango.</p>
<p><a href="/rangos/">Ver la comparativa completa</a> ·
  <a href="/tienda/">Ver la tienda</a></p>

<h2>La Dracma</h2>
<p>La Dracma (💎) es la moneda premium. <strong>No se puede comprar con
  <code>$</code></strong>: es deliberado, para que la economía del juego no se
  compre.</p>
<p>Consulta tu saldo con <code>/dracma</code> y gástalo en <code>/shop</code>.</p>
```

**No escribas «una llave cada 30 días»**: Demigod recibe 2 Common y Olympian
1 Epic + 1 Legendary.

- [ ] **Step 5: Escribir «Clasificaciones» y «Casa de subastas»**

`wiki/es/clasificaciones.html`:

```html
<h2>Cómo se abren</h2>
<p>Con <code>/leaderboards</code>. Hay clasificación de nivel de trabajos,
  dinero, kills y muertes.</p>

<h2>Qué cuenta como muerte</h2>
<p><strong>Solo cuenta si te mató otro jugador.</strong> Los mobs, la lava y las
  caídas no te tocan el K/D.</p>
<p>Tu K/D lo ve todo el mundo en la lista del TAB.</p>
```

`wiki/es/casa-de-subastas.html`:

```html
<h2>Cómo vender</h2>
<p>Coge el objeto en la mano y escribe <code>/ah sell</code>.</p>

<h2>Qué cuesta</h2>
<p>La comisión del <strong>{{wiki.subasta.comision}}</strong> se cobra
  <strong>al publicar, no al vender</strong>.</p>

<h2>Cuánto duran</h2>
<p>Los anuncios duran <strong>{{wiki.subasta.duracion}}</strong>. Lo que no se
  venda te espera en <code>/ah expired</code>: <strong>no se pierde
  nada</strong>.</p>

<h2>Cuántos anuncios a la vez</h2>
<p>Depende del rango, de <strong>{{rango.mortal.subastas}}</strong> siendo Mortal
  a <strong>{{rango.olympian.subastas}}</strong> siendo Olympian.
  <a href="/rangos/">Ver el reparto completo</a>.</p>
```

Las cuatro versiones inglesas, con el texto de `docs/wiki-encargo.md` y los
mismos `{{...}}`.

- [ ] **Step 6: Generar y comprobar**

Run: `python tools/build_wiki.py && python tools/check_catalogo.py`
Expected: `OK: 17 archivos generados` (8 páginas × 2 idiomas + el índice) y `OK: 115 claves cuadran en ES y EN`

- [ ] **Step 7: Comprobar que no se cuela «una llave»**

Run: `grep -rn "una llave cada\|one key every" public/wiki public/en/wiki`
Expected: sin resultados.

- [ ] **Step 8: Commit**

```bash
git add data/catalogo.json wiki/ public/wiki public/en/wiki public/js/wiki-index.js
git commit -m "feat: paginas de combate, progresion y economia"
```

---

### Task 7: Primeros pasos, objetos y comandos

**Files:**
- Modify: `wiki/paginas.json` (5 páginas, incluida la índice)
- Create: 10 cuerpos bajo `wiki/es/` y `wiki/en/`

**Interfaces:**
- Consumes: el generador de Task 1.
- Produces: la wiki completa de fase 1, 13 páginas.

- [ ] **Step 1: Declarar las cinco páginas**

| `par` | `seccion` | `orden` | Slug ES | Slug EN |
|---|---|---|---|---|
| `index` | `null` | 0 | `""` | `""` |
| `getting-started` | empezar | 10 | `primeros-pasos` | `getting-started` |
| `cosmetics` | objetos | 20 | `cosmeticos` | `cosmetics` |
| `kits-missions` | objetos | 30 | `kits-y-misiones` | `kits-and-missions` |
| `commands` | referencia | 10 | `comandos` | `commands` |

La índice lleva `"seccion": null` y slug vacío; el generador la escribe en
`public/wiki/index.html`, sin carpeta.

- [ ] **Step 2: Escribir «Primeros pasos»**

`wiki/es/primeros-pasos.html`, con los seis pasos del encargo. Cada uno con su
comando y en el orden en que los necesita alguien que acaba de entrar:

```html
<h2>1. Coge tu equipo</h2>
<p>Con <code>/kits</code> tienes equipo gratis. Y cada día hay una recompensa:
  <code>/daily</code>.</p>

<h2>2. Gana dinero</h2>
<p>Elige tus trabajos con <code>/jobs</code> y cobra por picar, talar, cultivar o
  cazar. Completa objetivos con <code>/missions</code>.</p>

<h2>3. Vende lo que te sobre</h2>
<p>Abre la tienda con <code>/shop</code>. Vende lo que llevas en la mano con
  <code>/sell</code>. ¿Quieres saber cuánto vale algo? <code>/worth</code>.</p>

<h2>4. Protege tu base</h2>
<p>Sin protección te la pueden romper. Abre tus protecciones con <code>/p</code>.
  <strong>Hazlo ANTES de construir nada serio.</strong></p>

<h2>5. No te pierdas</h2>
<p>En tu base, escribe <code>/sethome</code>. Vuelve desde cualquier sitio con
  <code>/home</code>. Sin esto, encontrar tu casa es cosa de suerte.</p>
<p>Tienes <strong>{{rango.mortal.homes}}</strong> home de partida y hasta
  <strong>{{rango.olympian.homes}}</strong> con el rango máximo.</p>

<h2>6. No juegues solo</h2>
<p>Crea o únete a un clan con <code>/clan</code>. Compartís banco, tierras y
  defensa — y el clan sube la vida de vuestro
  <a href="/wiki/nexo/">Nexo</a>.</p>
```

- [ ] **Step 3: Escribir «Cosméticos» y «Kits y misiones»**

`wiki/es/cosmeticos.html`:

```html
<h2>Cómo se equipan</h2>
<p>Abre <code>/cosmetics</code> para equipar lo que tengas.</p>

<h2>Las mascotas dan mejoras</h2>
<p>Algunas dan <strong>Velocidad, Prisa y Saciedad</strong> mientras viajas y
  trabajas.</p>
<p><strong>Esas mejoras se apagan en cuanto entras en combate.</strong> Ningún
  cosmético te va a ganar una pelea.</p>

<h2>De dónde salen</h2>
<p>De las Cajas, que dan mutaciones, alas y mascotas místicas. Cómo se consiguen
  las Cajas: <em>pendiente de confirmar</em>.</p>
```

`wiki/es/kits-y-misiones.html`:

```html
<h2>Kits</h2>
<p>Abre <code>/kits</code>. <strong>Tu rango decide cuáles puedes usar</strong>, y
  cada kit tiene su propia espera. Los premium están en <code>/shop</code>.</p>
<p>De <strong>{{rango.hero.kits}}</strong> kits siendo Hero a
  <strong>{{rango.olympian.kits}}</strong> siendo Olympian.
  <a href="/rangos/">Ver el reparto</a>.</p>

<h2>Misiones</h2>
<p>Abre <code>/missions</code>: hay <strong>diarias</strong> y
  <strong>contratos</strong>. Las diarias se renuevan cada día; los contratos son
  más largos.</p>
```

- [ ] **Step 4: Escribir «Comandos»**

`wiki/es/comandos.html`, con los 20 confirmados y la columna de quién puede
usarlos, que sale de `docs/wiki-encargo.md`:

```html
<h2>Todos los comandos</h2>
<p><strong>Están todos abiertos desde Mortal.</strong> Lo que cambia con el rango
  es el alcance, no el acceso.</p>

<div class="wk-tabla-wrap">
  <table class="wk-tabla">
    <thead>
      <tr><th scope="col">Comando</th><th scope="col">Qué hace</th>
        <th scope="col">Qué cambia con el rango</th></tr>
    </thead>
    <tbody>
      <tr><td><code>/kits</code></td><td>Equipo gratis</td><td>Qué kits puedes reclamar</td></tr>
      <tr><td><code>/daily</code></td><td>Recompensa diaria</td><td>—</td></tr>
      <tr><td><code>/jobs</code></td><td>Elegir trabajos</td><td>—</td></tr>
      <tr><td><code>/missions</code></td><td>Diarias y contratos</td><td>—</td></tr>
      <tr><td><code>/shop</code></td><td>Abrir la tienda</td><td>—</td></tr>
      <tr><td><code>/sell</code></td><td>Vender lo que llevas en la mano</td><td>—</td></tr>
      <tr><td><code>/worth</code></td><td>Consultar cuánto vale algo</td><td>—</td></tr>
      <tr><td><code>/p</code></td><td>Tus protecciones</td><td>—</td></tr>
      <tr><td><code>/sethome</code> · <code>/home</code></td><td>Guardar y volver a casa</td>
        <td>{{rango.mortal.homes}} home → {{rango.olympian.homes}}</td></tr>
      <tr><td><code>/back</code></td><td>Volver a tu última muerte</td><td>—</td></tr>
      <tr><td><code>/tpa</code></td><td>Pedir teletransporte</td><td>—</td></tr>
      <tr><td><code>/clan</code></td><td>Crear o unirte a un clan</td><td>—</td></tr>
      <tr><td><code>/ah sell</code> · <code>/ah expired</code></td><td>Casa de subastas</td>
        <td>{{rango.mortal.subastas}} huecos → {{rango.olympian.subastas}}</td></tr>
      <tr><td><code>/leaderboards</code></td><td>Clasificaciones</td><td>—</td></tr>
      <tr><td><code>/bounty</code></td><td>Poner precio a alguien</td><td>—</td></tr>
      <tr><td><code>/dracma</code></td><td>Ver tu saldo de Dracmas</td><td>—</td></tr>
      <tr><td><code>/ec</code> · <code>/ec 2</code> · <code>/ec 3</code></td>
        <td>Bóveda del Ender</td><td>Titan: 1 página · Olympian: 2</td></tr>
      <tr><td><code>/cosmetics</code></td><td>Equipar cosméticos</td>
        <td>Solo lo que hayas conseguido</td></tr>
    </tbody>
  </table>
</div>
```

**No añadas ningún comando que no esté en esa lista.** `/delhome` y `/rules`
aparecen en `/como-entrar/` pero no están confirmados.

- [ ] **Step 5: Escribir la índice**

`wiki/es/index.html`. Es una portada de wiki: rutas de entrada, no un listado —
el generador ya pone la lateral con todas las páginas.

```html
<h2>¿Por dónde empiezo?</h2>
<p>Si acabas de entrar, ve a <a href="/wiki/primeros-pasos/">Primeros pasos</a>:
  los seis comandos que necesitas la primera media hora.</p>

<h2>Las dudas más habituales</h2>
<ul>
  <li><a href="/wiki/nexo/">Qué es el Nexo</a> y cuánta vida tiene</li>
  <li><a href="/wiki/como-se-pierde-el-nexo/">Por qué he perdido vida del Nexo</a></li>
  <li><a href="/wiki/boveda-del-ender/">Cómo funciona <code>/ec</code></a></li>
  <li><a href="/wiki/matar-y-morir/">Cuánto cuesta morir</a></li>
  <li><a href="/wiki/casa-de-subastas/">Cómo vender en la subasta</a></li>
</ul>

<h2>¿No encuentras algo?</h2>
<p>Usa el buscador de arriba: entiende comandos (<code>/ec</code>) y conceptos
  («bóveda»). Y si sigue sin aparecer, pregunta en el
  <a href="https://discord.gg/w4aDfwE68" target="_blank" rel="noopener noreferrer">Discord</a>.</p>
```

- [ ] **Step 6: Generar y comprobar la wiki completa**

Run: `python tools/build_wiki.py`
Expected: `OK: 27 archivos generados` (13 páginas × 2 + el índice del buscador)

Run: `python tools/check_catalogo.py`
Expected: `OK: 115 claves cuadran en ES y EN`

- [ ] **Step 7: Verificar en el navegador**

Run: `python -m http.server 8123 -d public`

- Las 13 páginas cargan en los dos idiomas, sin errores en consola.
- La lateral marca la página actual.
- Las migas llevan a la índice.
- A 390 px no hay desbordamiento horizontal en ninguna.
- El botón ES/EN lleva a la equivalente, no a la portada.

- [ ] **Step 8: Commit**

```bash
git add wiki/ public/wiki public/en/wiki public/js/wiki-index.js
git commit -m "feat: primeros pasos, objetos y la tabla de comandos"
```

---

### Task 8: Integración, lema y despliegue

**Files:**
- Modify: `deploy.ps1`, `.github/workflows/check-catalogo.yml`, `README.md`
- Modify: `public/index.html`, `public/en/index.html` y el pie de las 12 páginas (lema)

**Interfaces:**
- Consumes: `tools/build_wiki.py` de Task 1.
- Produces: nada. Es la última.

- [ ] **Step 1: Regenerar antes de comprobar, en el deploy**

En `deploy.ps1`, **antes** del paso de los tests:

```powershell
Write-Host '==> Generando la wiki' -ForegroundColor Cyan
python tools/build_wiki.py
if ($LASTEXITCODE -ne 0) { throw 'Fallo al generar la wiki. Deploy abortado.' }
```

- [ ] **Step 2: Regenerar y comprobar frescura en la Action**

En `.github/workflows/check-catalogo.yml`, sustituir el paso de tests y añadir
uno nuevo:

```yaml
      - name: Tests de las herramientas
        working-directory: tools
        run: python -m unittest discover -p 'test_*.py' -v

      - name: La wiki generada esta al dia
        run: |
          python tools/build_wiki.py
          git diff --exit-code -- public/wiki public/en/wiki public/js/wiki-index.js

      - name: HTML contra catalogo.json
        run: python tools/check_catalogo.py
```

`discover` en lugar del nombre concreto: hoy la Action solo corría
`test_check_catalogo`, así que `test_build_wiki.py` no se habría ejecutado nunca
en CI.

- [ ] **Step 3: Unificar el lema**

«El Olimpo de los Supervivientes» pasa a «Tu leyenda comienza aquí». Vive en tres
sitios por idioma:

- `public/index.html` — el `og:title` y el `<span class="hero__title-sub">`
- `public/en/index.html` — sus equivalentes, con «Your legend starts here»
- El pie de las 12 páginas — `footer-brand__desc`, que hoy dice «El Olimpo de los
  supervivientes. Forja tu leyenda, nos vemos en la cima.» y pasa a «Tu leyenda
  comienza aquí. Nos vemos en la cima.» / «Your legend starts here. See you at
  the top.»

- [ ] **Step 4: Documentar en el README**

Añadir después del apartado «Catálogo»:

````markdown
## Wiki

El contenido vive en `wiki/`: los metadatos de todas las páginas en
`wiki/paginas.json` y el cuerpo de cada una en `wiki/es/` y `wiki/en/`, en HTML
plano y sin cabecera ni pie.

```bash
python tools/build_wiki.py
```

Genera `public/wiki/`, `public/en/wiki/` y el índice del buscador
`public/js/wiki-index.js`. **El resultado se commitea**: la Action lo regenera y
falla si difiere, que es lo que detecta que alguien editó el HTML generado a mano
o tocó un cuerpo sin regenerar.

Las cifras no se escriben: se invocan. `{{rango.hero.homes}}` se convierte en el
valor del catálogo, y `{{nexo.vida(T5, 4)}}` en el resultado del cálculo. El
generador falla si una clave no existe.

**Para cambiar contenido: edita `wiki/`, regenera, y commitea las dos cosas.**
````

Y corregir la línea que dice «sin build», que ya no es exacta.

- [ ] **Step 5: Comprobar que el gate detecta una wiki desactualizada**

Editar `wiki/es/comandos.html` sin regenerar y ejecutar:

```bash
python tools/build_wiki.py
git diff --exit-code -- public/wiki
```

Expected: `git diff` sale con código 1 y muestra el cambio. Es lo que hará
fallar la Action.

Deshacerlo con `git checkout wiki/ public/wiki` y regenerar.

- [ ] **Step 6: Ejecutar el deploy completo**

Run: `./deploy.ps1`
Expected: genera la wiki, 28+ tests en verde, `OK: 115 claves`, sin estilos
inline, y sube.

- [ ] **Step 7: Verificar en producción**

```bash
for u in /wiki/ /wiki/nexo/ /wiki/comandos/ /en/wiki/ /en/wiki/nexus/; do
  curl -s -o /dev/null -w "  $u -> %{http_code}\n" "https://hyperionsmc.com$u"
done
curl -s https://hyperionsmc.com/wiki/nexo/ | grep -c 'data-catalog'
```

Expected: todas 200, y la página del Nexo con sus `data-catalog`.

- [ ] **Step 8: Commit**

```bash
git add deploy.ps1 .github/workflows/check-catalogo.yml README.md \
        public/index.html public/en/index.html public/*/index.html public/en/*/index.html
git commit -m "ci: generar la wiki en el deploy y en la Action, y unificar el lema"
```

---

## Verificación final

- [ ] `python -m unittest discover -s tools -p 'test_*.py'` pasa
- [ ] `python tools/build_wiki.py` dice `OK: 27 archivos generados`
- [ ] `python tools/check_catalogo.py` dice `OK: 115 claves cuadran en ES y EN`
- [ ] `git diff --exit-code -- public/wiki public/en/wiki` está limpio tras regenerar
- [ ] `grep -rn 'style="' public/wiki public/en/wiki` no devuelve nada
- [ ] `grep -rn 'innerHTML' public/js/` no devuelve nada
- [ ] `grep -rniE 'prison|prisión' public/wiki public/en/wiki` no devuelve nada
- [ ] `grep -rn 'una llave cada\|one key every' public/wiki public/en/wiki` no devuelve nada
- [ ] Las 26 páginas cargan sin errores de consola en los dos idiomas
- [ ] El botón ES/EN lleva a la página equivalente desde las 26, y desde las 12 antiguas
- [ ] A 390 px ninguna página desborda y el menú de cabecera abre, cierra con `Escape` y al pulsar fuera
- [ ] El buscador encuentra por `/ec`, por «boveda» sin tilde y por «vault»

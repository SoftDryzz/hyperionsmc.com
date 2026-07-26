#!/usr/bin/env python3
"""Comprueba que el HTML publicado dice lo mismo que data/catalogo.json.

Verifica cuatro cosas:
  1. Coincidencia — todo data-catalog del HTML cuadra con el JSON.
  2. Cobertura   — toda clave del JSON aparece en espanol y en ingles.
  3. Tebex       — el precio base de cada paquete en Tebex cuadra con el JSON.
  4. Enlaces     — cada <a data-catalog-link="clave"> apunta al paquete de
                   Tebex que le corresponde (mismo ID, no solo mismo precio).

Solo biblioteca estandar. Salida 0 si todo cuadra, 1 si no.
"""
import json
import re
import sys
import urllib.request
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
    # El NBSP (\xa0) que separa numero y moneda ('28,00\xa0€') no hace falta
    # sustituirlo aparte: str.split() sin argumentos ya lo trata como
    # espacio en blanco igual que uno normal, y el join() de abajo lo colapsa.
    s = ' '.join(raw.split()).strip()
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


class _LinkParser(HTMLParser):
    """Recoge {clave: href} de cada <a data-catalog-link="clave" href="...">.

    Solo mira el atributo explicito, nunca "el <a> mas cercano": comparar por
    precio no sirve para desambiguar (varios paquetes pueden costar lo mismo),
    y una heuristica de proximidad en el DOM es fragil. El HTML marca el
    enlace de compra explicitamente con data-catalog-link.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = {}

    def handle_starttag(self, tag, attrs):
        if tag != 'a':
            return
        atributos = dict(attrs)
        clave = atributos.get('data-catalog-link')
        if clave:
            self.links[clave] = atributos.get('href', '')


def extract_links(html_text):
    p = _LinkParser()
    p.feed(html_text)
    return p.links


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


def check_links(catalog, links, label):
    """Verifica que cada <a data-catalog-link="clave"> compra el paquete correcto.

    El precio no basta para desambiguar botones: 28,00 € es a la vez
    llave.rare.x10, llave.mythic.x1 y dracma.p50.precio. Esto compara el ID
    de Tebex del href contra el que le corresponde a la clave en el catalogo.
    """
    errores = []
    tebex = catalog.get('_tebex', {})
    paquetes = tebex.get('paquetes', {})
    raiz = tebex.get('raiz', '').rstrip('/')
    for clave, href in sorted(links.items()):
        if clave not in paquetes:
            errores.append(
                f'{label}: data-catalog-link="{clave}" no tiene paquete '
                f'asociado en _tebex.paquetes')
            continue
        esperado = f'{raiz}/package/{paquetes[clave]}'
        if href != esperado:
            errores.append(
                f'{label}: el enlace de "{clave}" apunta a {href!r}, '
                f'deberia apuntar a {esperado!r}')
    return errores


TEBEX_API = 'https://headless.tebex.io/api/accounts/{key}/categories?includePackages=1'


def fetch_tebex(api_key):
    """Devuelve {id_paquete: base_price} desde la Headless API publica."""
    url = TEBEX_API.format(key=api_key)
    with urllib.request.urlopen(url, timeout=15) as r:
        datos = json.loads(r.read().decode('utf-8'))
    precios = {}
    for categoria in datos.get('data', []):
        for paquete in categoria.get('packages', []):
            precios[paquete['id']] = paquete['base_price']
    return precios


def check_tebex(catalog, flat, fetch=fetch_tebex):
    """Compara el precio base de cada paquete de Tebex con el catalogo.

    Se compara base_price, no total_price: Tebex anade el IVA segun el pais
    del comprador, asi que el total no es un valor unico contra el que medir.

    Si la API no responde se avisa y se devuelve [] — una caida de red no debe
    bloquear un deploy. Un precio que si responde y no cuadra falla en duro.
    """
    tebex = catalog.get('_tebex', {})
    paquetes = tebex.get('paquetes', {})
    if not paquetes:
        return []
    try:
        precios = fetch(tebex.get('apiKey', ''))
    except Exception as e:
        print(f'AVISO: no se pudo consultar Tebex ({e}). Se omite esa comprobacion.')
        return []

    errores = []
    for clave, pkg_id in sorted(paquetes.items()):
        if clave not in flat:
            errores.append(f'tebex: "{clave}" no existe en el catalogo')
        elif pkg_id not in precios:
            errores.append(f'tebex: el paquete {pkg_id} ("{clave}") no esta en la tienda')
        else:
            esperado = flat[clave]
            real = normalize(f'{float(precios[pkg_id]):.2f} €')
            if real != esperado:
                errores.append(
                    f'tebex: el paquete {pkg_id} ("{clave}") cuesta {real}, '
                    f'el catalogo dice {esperado}')
    return errores


def main():
    catalogo = json.loads(CATALOGO.read_text(encoding='utf-8'))
    flat = flatten(catalogo)
    errores, vistas_es, vistas_en = [], set(), set()

    for grupo, acumulador in ((ES_FILES, vistas_es), (EN_FILES, vistas_en)):
        for rel in grupo:
            ruta = RAIZ / rel
            if not ruta.exists():
                errores.append(f'falta el archivo {rel}')
                continue
            texto = ruta.read_text(encoding='utf-8')
            claims = extract_claims(texto)
            errores += check_match(claims, flat, rel)
            acumulador.update(claims)
            errores += check_links(catalogo, extract_links(texto), rel)

    errores += check_coverage(flat, vistas_es, vistas_en)
    errores += check_tebex(catalogo, flat)

    if errores:
        print(f'FALLO: {len(errores)} problema(s) de catalogo\n')
        for e in errores:
            print('  -', e)
        return 1
    print(f'OK: {len(flat)} claves cuadran en ES y EN')
    return 0


if __name__ == '__main__':
    sys.exit(main())

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
    s = raw.replace(' ', ' ')  # nbsp -> espacio normal
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

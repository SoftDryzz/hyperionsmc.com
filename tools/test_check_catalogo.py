import unittest
from check_catalogo import normalize, flatten, extract_claims, check_match, check_coverage


class TestNormalize(unittest.TestCase):
    def test_precio_es_y_en_coinciden(self):
        self.assertEqual(normalize('4,99 €'), normalize('€4.99'))
        self.assertEqual(normalize('4,99 €'), '4.99')

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

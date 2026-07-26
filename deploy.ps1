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

Write-Host '==> Contenido que la CSP descarta en produccion' -ForegroundColor Cyan
# La CSP de produccion es "script-src 'self'; style-src 'self'" sin unsafe-inline:
# descarta en silencio estilos y scripts inline, asi que hay que detectarlos aqui,
# antes del deploy, no despues de que un visitante vea la pagina rota.
# -Recurse es imprescindible: Select-String -Path 'public/**/*.html' NO es recursivo
# y se salta la mitad de los archivos (ya paso una vez en este script).
$patrones = @(
    @{ Nombre = 'style="..." o style=''...'' inline'; Regex = 'style\s*=\s*["'']' },
    @{ Nombre = 'bloque <style>';                      Regex = '<style[\s>]' },
    @{ Nombre = '<script> inline (sin src)';           Regex = '<script(?![^>]*\bsrc=)[^>]*>' },
    @{ Nombre = 'manejador on*="..." inline';          Regex = '\son\w+\s*=\s*["'']' }
)
$archivosHtml = Get-ChildItem -Path 'public' -Filter '*.html' -Recurse
$hallazgos = foreach ($patron in $patrones) {
    $archivosHtml | Select-String -Pattern $patron.Regex -AllMatches | ForEach-Object {
        [PSCustomObject]@{ Tipo = $patron.Nombre; Path = $_.Path; LineNumber = $_.LineNumber }
    }
}
if ($hallazgos) {
    $hallazgos | ForEach-Object { Write-Host "   [$($_.Tipo)] $($_.Path):$($_.LineNumber)" -ForegroundColor Red }
    throw 'Hay contenido inline que la CSP descarta en produccion. Deploy abortado.'
}

Write-Host '==> Subiendo a raiola' -ForegroundColor Cyan
ssh raiola 'rm -rf ~/public'
scp -r public raiola:~
ssh raiola 'sudo /usr/local/bin/hyperion-deploy'

Write-Host '==> Desplegado: https://hyperionsmc.com' -ForegroundColor Green

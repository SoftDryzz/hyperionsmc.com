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
$inline = Get-ChildItem -Path 'public' -Filter '*.html' -Recurse |
    Select-String -Pattern 'style="' -AllMatches
if ($inline) {
    $inline | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Red }
    throw 'Hay estilos inline. La CSP los descarta en produccion. Deploy abortado.'
}

Write-Host '==> Subiendo a raiola' -ForegroundColor Cyan
ssh raiola 'rm -rf ~/public'
scp -r public raiola:~
ssh raiola 'sudo /usr/local/bin/hyperion-deploy'

Write-Host '==> Desplegado: https://hyperionsmc.com' -ForegroundColor Green

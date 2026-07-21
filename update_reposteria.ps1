<#
  update_reposteria.ps1 — baja SOLO los archivos del cambio de reposteria:
    - ui/src/data/catalog_app.json   (pasteles Mediano: Zanahoria, Red Velvet, Volcano Brownie)
    - kiosko-puente/routes/order.js  (precio/tamano de pasteles 1800 y 1817)
  Backup de lo reemplazado. nodemon (npm run dev) reinicia el puente solo.
  No toca videos, .env, ni nada mas.
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rels = @(
  'ui/src/data/catalog_app.json',
  'kiosko-puente/routes/order.js',
  'ui/public/images/ZANAHORIA_MEDIANO.png',
  'ui/public/images/RED_VELVET_MEDIANO.png',
  'ui/public/images/VOLCANO_MEDIANO.jpg'
)

# Detectar raiz de la app (la que contiene ui\src\data\catalog_app.json)
$cands = @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz',
  (Join-Path $env:USERPROFILE 'kiosko'),
  (Join-Path $env:USERPROFILE 'Desktop\kiosko'))
$root = $null
foreach ($c in $cands) { if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $root = $c; break } }
if (-not $root) {
  Write-Host "Buscando la app en C:\ ..." -ForegroundColor Yellow
  $hit = Get-ChildItem 'C:\' -Recurse -Filter catalog_app.json -EA SilentlyContinue |
         Where-Object { $_.FullName -like '*\ui\src\data\catalog_app.json' } | Select-Object -First 1
  if ($hit) { $root = $hit.Directory.Parent.Parent.Parent.FullName }
}
if (-not $root) { throw "No encontre la app." }
Write-Host "App root: $root" -ForegroundColor Cyan

$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
foreach ($rel in $rels) {
  $dest = Join-Path $root ($rel -replace '/','\')
  $url  = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/' + $rel + '?t=' + $ts
  if (-not (Test-Path (Split-Path -Parent $dest))) { New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null }
  if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force }
  Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $dest
  Write-Host ("OK -> " + $dest) -ForegroundColor Green
}
Write-Host "LISTO. El puente (nodemon) se reinicia solo; da F5 al Chrome para la UI." -ForegroundColor Green

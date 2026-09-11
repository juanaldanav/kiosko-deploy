<#
  update_vainilla.ps1 — baja SOLO lo del cambio 11-sep-2026:
    - ui/src/data/catalog_app.json            (TRADICIONAL VAINILLA 2464 pastel + R. TRADICIONAL VAINILLA 2465 rebanada)
    - kiosko-puente/routes/order.js           (pastel 2464 en el hardcode de tallas/precios)
    - ui/src/pages/MenuPage.jsx               (sin TEMPORADA_JUNIO.mp4 en el banner)
    - ui/src/data/products.js                 (POPULAR: R. TRADICIONAL VAINILLA en lugar de M. MATCHA FRUTOS ROJOS)
    - ui/public/images/TRADICIONAL_VAINILLA.jpg (imagen local del pastel)
  Backup de lo reemplazado. nodemon reinicia el puente solo.
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rels = @(
  'ui/src/data/catalog_app.json',
  'kiosko-puente/routes/order.js',
  'ui/src/pages/MenuPage.jsx',
  'ui/src/data/products.js',
  'ui/public/images/TRADICIONAL_VAINILLA.jpg'
)

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
Write-Host "LISTO. Puente se reinicia solo (nodemon); F5 al Chrome para la UI." -ForegroundColor Green

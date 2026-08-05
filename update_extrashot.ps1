<#
  update_extrashot.ps1 — barra "Extras disponibles" (EXTRA SHOT caf/descaf) en bebidas.
  Baja: catalog_app.json, prepare-cart-for-backend.js, modifiersImages.js
  Solo frontend -> F5 al Chrome (order.js no cambia).
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rels = @(
  'ui/src/data/catalog_app.json',
  'ui/src/utils/prepare-cart-for-backend.js',
  'ui/src/data/modifiersImages.js'
)
$cands = @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz',
  (Join-Path $env:USERPROFILE 'kiosko'),
  (Join-Path $env:USERPROFILE 'Desktop\kiosko'))
$root = $null
foreach ($c in $cands) { if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $root = $c; break } }
if (-not $root) {
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
  if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force -EA SilentlyContinue }
  Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $dest
  Write-Host ("OK -> " + $dest) -ForegroundColor Green
}
Write-Host "LISTO. Da F5 al Chrome." -ForegroundColor Green

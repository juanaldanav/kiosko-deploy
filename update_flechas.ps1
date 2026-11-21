<#
  update_flechas.ps1 — Botones "Ver mas" / "Subir" en las bandas con scroll (20-nov, emergencia).
  Kioskos viejos cuyo touch llega como mouse no arrastran ni agarran la barra; el clic si sirve.
  Toca: FlechasScroll.jsx (nuevo), tema.css (.k-flecha + barra de scroll de 24 px), MenuPage, CustomizePage, ComboFlowOverlay, FloatingCart.
  Requiere la piel del 20-nov ya instalada. NO toca api.js, order.js, .env ni hidden_*.json.
  Uso:  irm "<url de este script>" | iex     (luego F5 al Chrome del kiosko)
#>
param(
  [string]$AppRoot = "",
  [string]$Ref     = "8776c9a29e2f0455c04bb9cbf7550792a039f44c"
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$BaseUrl = "https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/$Ref/"
Write-Host "Bajando del ref: $Ref" -ForegroundColor Cyan

$files = [ordered]@{
  'ui/src/components/FlechasScroll.jsx'     = 3000
  'ui/src/styles/tema.css'                  = 8000
  'ui/src/pages/MenuPage.jsx'               = 35000
  'ui/src/pages/CustomizePage.jsx'          = 18000
  'ui/src/components/ComboFlowOverlay.jsx'  = 12000
  'ui/src/components/FloatingCart.jsx'      = 5000
}

if (-not $AppRoot) {
  foreach ($c in @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz','C:\nomina','C:\Nomina')) {
    if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $AppRoot = $c; break }
  }
}
if (-not $AppRoot) { throw "No encontre la app. Corre con -AppRoot 'C:\<carpeta>'." }
Write-Host "App root: $AppRoot" -ForegroundColor Cyan
if (-not (Select-String -Path (Join-Path $AppRoot 'ui\index.html') -Pattern 'data-tema=' -Quiet)) {
  throw "Este kiosko no tiene la piel del 20-nov. Corre primero update_20nov.ps1. No se toco nada."
}

$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$tmp = Join-Path $env:TEMP "kiosko_flechas_$ts"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
foreach ($rel in $files.Keys) {
  $out = Join-Path $tmp ($rel -replace '/','_')
  Invoke-WebRequest -Uri ($BaseUrl + $rel + "?t=$ts") -Headers @{ 'Cache-Control'='no-cache' } -OutFile $out -UseBasicParsing
  $len = (Get-Item $out).Length
  if ($len -lt $files[$rel]) { throw "$rel bajo incompleto ($len bytes). Abortado, no se toco el kiosko." }
}
if (-not (Select-String -Path (Join-Path $tmp 'ui_src_pages_MenuPage.jsx') -Pattern 'FlechasScroll target=' -Quiet)) { throw "MenuPage no trae las flechas. Abortado." }
if (-not (Select-String -Path (Join-Path $tmp 'ui_src_pages_MenuPage.jsx') -Pattern 'lastTimestamp = null' -Quiet)) { throw "MenuPage perdio el fix del 4-oct. Abortado." }
if (-not (Select-String -Path (Join-Path $tmp 'ui_src_styles_tema.css') -Pattern '\.k-flecha' -Quiet)) { throw "tema.css no trae .k-flecha. Abortado." }

foreach ($rel in $files.Keys) {
  $src  = Join-Path $tmp ($rel -replace '/','_')
  $dest = Join-Path $AppRoot ($rel -replace '/','\')
  if (Test-Path $dest) { Copy-Item $dest "$dest.bak_$ts" -Force }
  Copy-Item $src $dest -Force
  Write-Host "OK -> $rel" -ForegroundColor Green
}
Remove-Item $tmp -Recurse -Force -EA SilentlyContinue
Write-Host ""
Write-Host "LISTO. Da F5 al Chrome del kiosko." -ForegroundColor Green
Write-Host "Prueba: Explorar/Minipostres -> 'Ver mas 1/6' abajo al centro; al final dice 'Volver arriba'." -ForegroundColor Yellow

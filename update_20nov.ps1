<#
  update_20nov.ps1 — Piel navidena 2026 + ajustes del 20-nov (VoBo del GG).

    - Piel navidena: index.html (data-tema="navidad"), tailwind.config.js, main.jsx, index.css,
      styles/tema.css, images/tema/*, fonts/LastChristmas (autorizada por marketing).
      En enero se quita cambiando data-tema="navidad" por "base" en index.html.
    - 6 videos nuevos: COPITAS, CUMPLEANERO, HORAFELIZ, JUEVES, MARTES, MIERCOLES.
    - Pantallas con la piel: MenuPage, CustomizePage, ModifierStep, FloatingCart, CartSummary,
      SeasonalDrinkOverlay, ComboFlowOverlay, InactivityModal, AtrasFlotante.
    - PUMPKIN en Populares: pregunta caliente (2491) / rocas (2471) SIN etiqueta de temporada.
    - Cold foams nuevos en 16 bebidas frias: PISTACHE 2504, CARAMELO SALADO 2505, LECHERITA 2506.
    - AdminVisibilidad: al salir del admin el kiosko recupera la piel sin recargar.
    - api.js (PARCHE EN SITIO, no se baja): se apagan las 2 reglas de "Iced Coffee con esencia".
      SIN ESENCIA iba a $60 y la caja cobra $75. Se conservan idTerminal/idUsuario de la sucursal.

  NO baja order.js ni .env. NO reinicia el puente. NO toca los hidden_*.json.
  Backup de cada archivo reemplazado al lado, como .bak_<fecha>.

  Uso:  irm "<url de este script>" | iex     (luego F5 al Chrome del kiosko)
#>
param(
  [string]$AppRoot = "",
  # Se pinea el SHA y no 'main': raw.githubusercontent cachea.
  [string]$Ref     = "01ffe9e71a7a74f77ea3e098712c148f3a80d16e"
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$BaseUrl = "https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/$Ref/"
Write-Host "Bajando del ref: $Ref" -ForegroundColor Cyan

# rel -> tamano minimo en bytes
$files = [ordered]@{
  'ui/index.html'                                  = 4000
  'ui/tailwind.config.js'                          = 1000
  'ui/src/main.jsx'                                = 900
  'ui/src/index.css'                               = 3000
  'ui/src/styles/tema.css'                         = 7000
  'ui/public/fonts/LastChristmas-Regular_PERSONAL_USE_ONLY.otf' = 400000
  'ui/public/images/tema/bebidas-temporada.jpg'    = 80000
  'ui/public/images/tema/copo.svg'                 = 300
  'ui/public/images/tema/destello.svg'             = 150
  'ui/public/images/tema/logo-lamarque.svg'        = 10000
  'ui/public/images/tema/nieve-tile.svg'           = 1000
  'ui/public/videos/COPITAS.mp4'                   = 400000
  'ui/public/videos/CUMPLEANERO.mp4'               = 400000
  'ui/public/videos/HORAFELIZ.mp4'                 = 400000
  'ui/public/videos/JUEVES.mp4'                    = 400000
  'ui/public/videos/MARTES.mp4'                    = 400000
  'ui/public/videos/MIERCOLES.mp4'                 = 400000
  'ui/src/components/AtrasFlotante.jsx'            = 700
  'ui/src/components/CartSummary.jsx'              = 15000
  'ui/src/components/ComboFlowOverlay.jsx'         = 12000
  'ui/src/components/FloatingCart.jsx'             = 5000
  'ui/src/components/InactivityModal.jsx'          = 2500
  'ui/src/components/ModifierStep.jsx'             = 10000
  'ui/src/components/SeasonalDrinkOverlay.jsx'     = 10000
  'ui/src/data/catalog_app.json'                   = 500000
  'ui/src/data/modifiersImages.js'                 = 18000
  'ui/src/data/products.js'                        = 20000
  'ui/src/data/seasonal_config.json'               = 2000
  'ui/src/pages/AdminVisibilidad.jsx'              = 40000
  'ui/src/pages/CustomizePage.jsx'                 = 18000
  'ui/src/pages/MenuPage.jsx'                      = 35000
}

# ---- 1. Detectar la app (la raiz cambia de nombre por equipo) ----
if (-not $AppRoot) {
  foreach ($c in @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz','C:\nomina','C:\Nomina',
                   (Join-Path $env:USERPROFILE 'kiosko'),
                   (Join-Path $env:USERPROFILE 'Desktop\kiosko'))) {
    if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $AppRoot = $c; break }
  }
}
if (-not $AppRoot) {
  Write-Host "Buscando la app en C:\ ..." -ForegroundColor Yellow
  $hit = Get-ChildItem 'C:\' -Recurse -Filter catalog_app.json -EA SilentlyContinue |
         Where-Object { $_.FullName -like '*\ui\src\data\catalog_app.json' } | Select-Object -First 1
  if ($hit) { $AppRoot = $hit.Directory.Parent.Parent.Parent.FullName }
}
if (-not $AppRoot) { throw "No encontre la app. Corre con -AppRoot 'C:\<carpeta>'." }
Write-Host "App root: $AppRoot" -ForegroundColor Cyan

# main.jsx nuevo importa esto: si el kiosko no lo tiene, no se toca nada.
foreach ($dep in 'ui\src\App.jsx','ui\src\context\CartContext.jsx','ui\src\styles\touch-scroll.css','ui\src\lib\api.js') {
  if (-not (Test-Path (Join-Path $AppRoot $dep))) { throw "Al kiosko le falta $dep. Abortado, no se toco nada." }
}

# ---- 2. Bajar TODO a temporal y verificar antes de tocar el kiosko ----
$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$tmp = Join-Path $env:TEMP "kiosko_20nov_$ts"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
foreach ($rel in $files.Keys) {
  $out = Join-Path $tmp ($rel -replace '/','_')
  Invoke-WebRequest -Uri ($BaseUrl + $rel + "?t=$ts") -Headers @{ 'Cache-Control'='no-cache' } `
                    -OutFile $out -UseBasicParsing
  $len = (Get-Item $out).Length
  if ($len -lt $files[$rel]) { throw "$rel bajo incompleto ($len bytes). Abortado, no se toco el kiosko." }
}

$catTmp = Join-Path $tmp 'ui_src_data_catalog_app.json'
$catRaw = Get-Content $catTmp -Raw -Encoding UTF8
try   { $cat = ($catRaw | ConvertFrom-Json).catalog }
catch { throw "El catalogo que bajo NO es JSON valido. Abortado, no se toco el kiosko." }
if ($cat.Count -lt 165) { throw "El catalogo trae solo $($cat.Count) productos. Abortado." }
foreach ($id in 2504,2505,2506) {
  if ($catRaw -notmatch "`"id`":\s*$id\b") { throw "Al catalogo le falta el cold foam $id. Abortado." }
}
try   { $sea = Get-Content (Join-Path $tmp 'ui_src_data_seasonal_config.json') -Raw -Encoding UTF8 | ConvertFrom-Json }
catch { throw "seasonal_config.json NO es JSON valido. Abortado, no se toco el kiosko." }
if ($sea.drinks.Count -ne 4) { throw "seasonal_config trae $($sea.drinks.Count) bebidas, se esperaban 4. Abortado." }
if (-not ($sea.drinks | Where-Object { $_.seasonalKey -eq 'pumpkin' -and $_.sinEtiqueta })) { throw "seasonal_config no trae PUMPKIN sin etiqueta. Abortado." }
$menu = Join-Path $tmp 'ui_src_pages_MenuPage.jsx'
if (-not (Select-String -Path $menu -Pattern 'lastTimestamp = null' -Quiet)) { throw "MenuPage.jsx perdio el fix del 4-oct. Abortado." }
if (-not (Select-String -Path (Join-Path $tmp 'ui_index.html') -Pattern 'data-tema="navidad"' -Quiet)) { throw "index.html no trae data-tema navidad. Abortado." }

# api.js: se prepara el parche en memoria; si no cuadra, no se toca NADA.
$apiPath  = Join-Path $AppRoot 'ui\src\lib\api.js'
$apiBytes = [IO.File]::ReadAllBytes($apiPath)
$apiBom   = ($apiBytes.Length -ge 3 -and $apiBytes[0] -eq 0xEF -and $apiBytes[1] -eq 0xBB -and $apiBytes[2] -eq 0xBF)
$api      = [IO.File]::ReadAllText($apiPath, [Text.Encoding]::UTF8)
$apiNuevo = $null
$r1 = 'if (isIcedCoffee && isEsencia) {'
$r2 = 'if (esenciaMod) {'
if ($api.Contains('20-nov: apagada')) {
  Write-Host "api.js ya estaba parchado, se deja igual." -ForegroundColor Yellow
} else {
  foreach ($r in $r1,$r2) {
    $n = ([regex]::Matches($api, [regex]::Escape($r))).Count
    if ($n -ne 1) { throw "api.js: '$r' aparece $n veces (se esperaba 1). Abortado, no se toco nada." }
  }
  $apiNuevo = $api.Replace($r1, 'if (false) { // 20-nov: apagada. La caja cobra la esencia ($12) y SIN ESENCIA va a precio normal').
                   Replace($r2, 'if (false) { // 20-nov: apagada. Con SIN ESENCIA mandaba $60; la caja cobra $75')
  if (-not $apiNuevo.Contains('idTerminal')) { throw "api.js perdio idTerminal. Abortado." }
}
Write-Host "Verificado: $($cat.Count) productos, 3 cold foams, 4 especiales (pumpkin sin etiqueta), 6 videos, piel." -ForegroundColor Green

# ---- 3. Reemplazar con backup ----
foreach ($rel in $files.Keys) {
  $src  = Join-Path $tmp ($rel -replace '/','_')
  $dest = Join-Path $AppRoot ($rel -replace '/','\')
  New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
  if (Test-Path $dest) { Copy-Item $dest "$dest.bak_$ts" -Force }
  Copy-Item $src $dest -Force
  Write-Host "OK -> $rel" -ForegroundColor Green
}
if ($apiNuevo) {
  Copy-Item $apiPath "$apiPath.bak_$ts" -Force
  [IO.File]::WriteAllText($apiPath, $apiNuevo, (New-Object Text.UTF8Encoding($apiBom)))
  Write-Host "OK -> ui/src/lib/api.js (parche SIN ESENCIA en sitio)" -ForegroundColor Green
}
Remove-Item $tmp -Recurse -Force -EA SilentlyContinue

Write-Host ""
Write-Host "LISTO. Da F5 al Chrome del kiosko." -ForegroundColor Green
Write-Host "Prueba: piel vino/crema con copos; PUMPKIN en Populares pregunta caliente/rocas sin 'Temporada';" -ForegroundColor Yellow
Write-Host "        Iced Coffee -> Cold Foam trae Pistache, Caramelo Salado y Lecherita;" -ForegroundColor Yellow
Write-Host "        Iced Coffee SIN ESENCIA en el carrito = `$75." -ForegroundColor Yellow

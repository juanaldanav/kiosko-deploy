<#
  update_13nov.ps1 — Bebidas navidenas 2026 (lanzamiento viernes 13-nov).

    - ui/src/data/catalog_app.json     +7 bebidas, todas de la BD (Status=1, receta de Dalia):
                                         CARAMELO SALADO LATTE 2495/2494   ICED CARAMELO SALADO 2475/2476
                                         PISTACHE LATTE        2496/2497   ICED PISTACHE LATTE  2498/2499
                                         SPANISH LATTE         2500/2501   ICED SPANISH LATTE   2502/2503
                                         PUMPKIN SPICE LATTE   2491/2492   (menu normal, no temporada)
                                       Sale PAN DE MUERTO (2480) del catalogo hasta 2027; sigue en la BD.
                                       Leches en el orden de siempre (Entera, Deslactosada, Almendra...).
    - ui/src/data/products.js          PAN DE MUERTO sale de Populares (unico cambio).
    - ui/src/data/seasonal_config.json Especiales = las 3 navidenas, cada una caliente + rocas.
                                       Iced Lotus, Iced Pumpkin, Aerocano e Iced Matchapan salen de
                                       Especiales y se quedan en su categoria (nada se borra).
    - ui/src/pages/MenuPage.jsx        Videos fijos: entra NAVIDAD.mp4 primero; salen AEROCANO,
                                       PUMPKIN y MATCHAPAN. Trae el fix del 4-oct (se verifica).
    - ui/public/images/bebidas/*.jpg   7 fotos de marketing (locales, 1080x1080).
    - ui/public/videos/NAVIDAD.mp4     video de marketing.

  NO baja order.js -> no toca idTerminal/idUsuario. NO reinicia el puente. NO toca los
  hidden_*.json: lo que cada sucursal tenga apagado en /admin se queda apagado.
  Son bebidas, asi que salen VISIBLES (la regla de desplegar oculto es para lo que no es bebida).
  Backup de cada archivo reemplazado al lado, como .bak_<fecha>.

  Uso:  irm "<url de este script>" | iex     (luego F5 al Chrome del kiosko)
#>
param(
  [string]$AppRoot = "",
  # Se pinea el SHA y no 'main': raw.githubusercontent cachea.
  [string]$Ref     = "b2de6b6790c1de0fb0d3116810cbd2aecd31f111"
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$BaseUrl = "https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/$Ref/"
Write-Host "Bajando del ref: $Ref" -ForegroundColor Cyan

# rel -> tamano minimo en bytes
$files = [ordered]@{
  'ui/src/data/catalog_app.json'                   = 400000
  'ui/src/data/seasonal_config.json'               = 1000
  'ui/src/data/products.js'                        = 15000
  'ui/src/pages/MenuPage.jsx'                      = 15000
  'ui/public/images/bebidas/iced-caramelo-salado.jpg' = 50000
  'ui/public/images/bebidas/caramelo-salado-latte.jpg'= 50000
  'ui/public/images/bebidas/iced-pistache-latte.jpg'  = 50000
  'ui/public/images/bebidas/pistache-latte.jpg'       = 50000
  'ui/public/images/bebidas/iced-spanish-latte.jpg'   = 50000
  'ui/public/images/bebidas/spanish-latte.jpg'        = 50000
  'ui/public/images/bebidas/pumpkin-spice-latte.jpg'  = 50000
  'ui/public/videos/NAVIDAD.mp4'                   = 300000
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

# ---- 2. Bajar TODO a temporal y verificar antes de tocar el kiosko ----
$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$tmp = Join-Path $env:TEMP "kiosko_13nov_$ts"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
foreach ($rel in $files.Keys) {
  $out = Join-Path $tmp ($rel -replace '/','_')
  Invoke-WebRequest -Uri ($BaseUrl + $rel + "?t=$ts") -Headers @{ 'Cache-Control'='no-cache' } `
                    -OutFile $out -UseBasicParsing
  $len = (Get-Item $out).Length
  if ($len -lt $files[$rel]) { throw "$rel bajo incompleto ($len bytes). Abortado, no se toco el kiosko." }
}

$catTmp = Join-Path $tmp 'ui_src_data_catalog_app.json'
try   { $cat = (Get-Content $catTmp -Raw -Encoding UTF8 | ConvertFrom-Json).catalog }
catch { throw "El catalogo que bajo NO es JSON valido. Abortado, no se toco el kiosko." }
if ($cat.Count -lt 165) { throw "El catalogo trae solo $($cat.Count) productos. Abortado." }
foreach ($id in 2475,2491,2495,2496,2498,2500,2502) {
  if (-not ($cat | Where-Object { $_.productId -eq $id })) { throw "Al catalogo le falta el $id. Abortado." }
}
if ($cat | Where-Object { $_.productId -eq 2480 }) { throw "El catalogo todavia trae PAN DE MUERTO. Ref equivocado? Abortado." }
if (Select-String -Path (Join-Path $tmp 'ui_src_data_products.js') -Pattern '"PAN DE MUERTO"' -CaseSensitive -Quiet) { throw "products.js todavia trae PAN DE MUERTO. Abortado." }
try   { $sea = Get-Content (Join-Path $tmp 'ui_src_data_seasonal_config.json') -Raw -Encoding UTF8 | ConvertFrom-Json }
catch { throw "seasonal_config.json NO es JSON valido. Abortado, no se toco el kiosko." }
if ($sea.drinks.Count -ne 3) { throw "seasonal_config trae $($sea.drinks.Count) bebidas, se esperaban 3. Abortado." }
$menu = Join-Path $tmp 'ui_src_pages_MenuPage.jsx'
if (-not (Select-String -Path $menu -Pattern 'NAVIDAD.mp4' -Quiet))         { throw "MenuPage.jsx no trae el video NAVIDAD. Abortado." }
if (-not (Select-String -Path $menu -Pattern 'lastTimestamp = null' -Quiet)) { throw "MenuPage.jsx perdio el fix del 4-oct. Abortado." }
Write-Host "Verificado: $($cat.Count) productos, 3 navidenas, 7 fotos, 1 video." -ForegroundColor Green

# ---- 3. Reemplazar con backup ----
foreach ($rel in $files.Keys) {
  $src  = Join-Path $tmp ($rel -replace '/','_')
  $dest = Join-Path $AppRoot ($rel -replace '/','\')
  New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
  if (Test-Path $dest) { Copy-Item $dest "$dest.bak_$ts" -Force }
  Copy-Item $src $dest -Force
  Write-Host "OK -> $rel" -ForegroundColor Green
}
Remove-Item $tmp -Recurse -Force -EA SilentlyContinue

Write-Host ""
Write-Host "LISTO. Da F5 al Chrome del kiosko." -ForegroundColor Green
Write-Host "Prueba: arriba deben salir CARAMELO SALADO, PISTACHE y SPANISH LATTE (caliente y rocas)," -ForegroundColor Yellow
Write-Host "        ya no debe salir PAN DE MUERTO," -ForegroundColor Yellow
Write-Host "        y el primer video debe ser el navideno." -ForegroundColor Yellow

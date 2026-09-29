<#
  update_29sep.ps1 - despliegue completo del 29-sep-2026.

  QUE HACE
    1. Oculta los 3 productos nuevos (aditivo: NO pisa lo que la sucursal ya tiene).
    2. Baja el catalogo y las 4 fotos nuevas.
    3. F5 opcional.

  ORDEN CRITICO: se oculta ANTES de bajar el catalogo. Al reves habria segundos
  con los productos nuevos visibles en pantalla.

  CONTENIDO
    - PAN DE MUERTO: una tarjeta con 4 sabores (clasico $55, nutella/jamoncillo/
      lotus $75), etiqueta TEMPORADA. OCULTO: se prende el 1-oct. Se puede apagar
      completo o sabor por sabor desde Admin Visibilidad.
    - 2 rebanadas (R. PEANUT BROWNIE, R. ROSA PASTEL), OCULTAS. Ambas traen foto.
    - EXTRA COLD BREW ya solo aparece en bebidas de cold brew (antes en las 62;
      generaba anulaciones - peticion de Conquista).
    - Admin Visibilidad rediseñado (identidad de produccion/v2) y con auto-refresh:
      al prender o apagar algo el kiosko se actualiza solo a los 2s.
    - PAN DE MUERTO: clasico $55, nutella / jamoncillo / lotus $75 (una sola foto).
    - FRAPUCCINO PEANUT GDE $90 / XL $95.
    - COLD FOAM: vainilla, fresa y coco a $20; leche a $15; entra COLD FOAM LOTUS $20
      en las 27 bebidas que tienen ese paso. Precios tomados de Netsilver hoy.

  NO lleva build: el kiosko corre npm run dev:vite y lee ui/src y ui/public directo.

  Uso:  powershell -ExecutionPolicy Bypass -File .\update_29sep.ps1 -Refresh
#>
param(
  [string]$AppRoot = "",
  [string]$Puente  = "http://localhost:3001",
  [switch]$Refresh
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$BaseUrl = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/'
$ids     = @(1854, 1861, 2480)   # rebanadas + PAN DE MUERTO
$files   = @(
  'ui/src/data/catalog_app.json',
  'ui/src/data/products.js',
  'ui/src/pages/MenuPage.jsx',
  'ui/src/pages/CustomizePage.jsx',
  'ui/src/pages/AdminVisibilidad.jsx',
  'ui/public/images/bebidas/frappe-peanut.jpg',
  'ui/public/images/panaderia/pan-de-muerto.jpg',
  'ui/public/images/rebanadas/peanut-brownie.jpg',
  'ui/public/images/rebanadas/rosa-pastel.jpg'
)

# ---- 0. El puente TIENE que estar vivo, o las rebanadas saldrian VISIBLES ----
try {
  Invoke-RestMethod -Uri "$Puente/health" -TimeoutSec 5 -UseBasicParsing | Out-Null
  Write-Host "Puente OK en $Puente" -ForegroundColor Green
} catch {
  throw "El puente NO responde en $Puente. Abortado antes de tocar nada."
}

# ---- 1. Ocultar las rebanadas (aditivo) ----
$antes = (Invoke-RestMethod -Uri "$Puente/api/visibility" -UseBasicParsing).hidden
Write-Host "Ocultos antes: $($antes.Count)"
foreach ($id in $ids) {
  $body = @{ productId = $id; visible = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri "$Puente/api/visibility" -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing | Out-Null
}
$despues = (Invoke-RestMethod -Uri "$Puente/api/visibility" -UseBasicParsing).hidden
$faltan = $ids | Where-Object { $despues -notcontains $_ }
if ($faltan) { throw "NO quedaron ocultos: $($faltan -join ', '). Abortado antes de bajar el catalogo." }
Write-Host "Ocultos despues: $($despues.Count). Las $($ids.Count) rebanadas quedaron APAGADAS." -ForegroundColor Green

# ---- 2. Detectar la app ----
if (-not $AppRoot) {
  foreach ($c in @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz',
                   "$env:USERPROFILE\kiosko","$env:USERPROFILE\Desktop\kiosko")) {
    if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $AppRoot = $c; break }
  }
}
if (-not $AppRoot) {
  $hit = Get-ChildItem 'C:\' -Recurse -Filter catalog_app.json -EA SilentlyContinue |
         Where-Object { $_.FullName -like '*\ui\src\data\catalog_app.json' } | Select-Object -First 1
  if ($hit) { $AppRoot = $hit.Directory.Parent.Parent.Parent.FullName }
}
if (-not $AppRoot) { throw "No encontre la app. Corre con -AppRoot 'C:\<carpeta>'." }
Write-Host "App root: $AppRoot" -ForegroundColor Cyan

# ---- 3. Bajar catalogo y fotos (con backup) ----
$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$bak = Join-Path $AppRoot "_deploy_bak_$ts"
foreach ($rel in $files) {
  $dest = Join-Path $AppRoot ($rel -replace '/','\')
  $tmp  = Join-Path $env:TEMP ("dl_" + [IO.Path]::GetFileName($rel))
  Write-Host "  bajando $rel ..."
  Invoke-WebRequest -Uri ($BaseUrl + $rel + "?t=$ts") -Headers @{ 'Cache-Control'='no-cache' } -OutFile $tmp -UseBasicParsing
  if ($rel -like '*catalog_app.json' -and (Get-Item $tmp).Length -lt 100000) {
    throw "El catalogo bajo incompleto ($((Get-Item $tmp).Length) bytes). Abortado."
  }
  if (Test-Path $dest) {
    $bd = Join-Path $bak ($rel -replace '/','\')
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $bd) | Out-Null
    Copy-Item $dest $bd -Force
  } else {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  }
  Copy-Item $tmp $dest -Force
  Remove-Item $tmp -Force -EA SilentlyContinue
  Write-Host "    -> $dest" -ForegroundColor Green
}
Write-Host "$($files.Count) archivos desplegados. Backup: $bak" -ForegroundColor Cyan

# ---- 4. F5 opcional ----
if ($Refresh) {
  try {
    Add-Type -AssemblyName System.Windows.Forms
    $sig = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
    $win = Add-Type -MemberDefinition $sig -Name Win -Namespace Native -PassThru
    $chrome = Get-Process chrome -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($chrome) {
      [void]$win::SetForegroundWindow($chrome.MainWindowHandle); Start-Sleep -Milliseconds 400
      [System.Windows.Forms.SendKeys]::SendWait('{F5}')
      Write-Host "F5 enviado." -ForegroundColor Green
    }
  } catch { Write-Host "Recarga a mano." -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "REVISAR EN PANTALLA:" -ForegroundColor Yellow
Write-Host "  - Pan de muerto (4 sabores) y Frappuccino Peanut visibles"
Write-Host "  - Cold foam: vainilla/fresa/coco \$20, leche \$15, y aparece COLD FOAM LOTUS"
Write-Host "  - Pan de muerto y las 2 rebanadas NO deben verse; estan en Admin apagados"

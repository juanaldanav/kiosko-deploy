<#
  deploy_kiosko_url.ps1  —  SELF-CONTAINED para TeamViewer "Gestionar scripts".
  Corre EN el kiosko, descarga los archivos de GitHub (raw) y los coloca en su
  lugar (detecta la raiz: kiosko/interfaz/nomina/cualquiera). Backup de lo reemplazado.
  NO compila, NO mata procesos, NO toca KIOSKO.bat. Opcional F5 a Chrome.

  >>> EDITA $BaseUrl con tu repo/branch/carpeta. <<<
  Si el repo es PRIVADO, pon un Personal Access Token en $Token (si es publico, dejalo "").
#>
param(
  [string]$AppRoot,
  [switch]$Refresh
)

# ====================== CONFIG (EDITAR) ======================
# Apunta a la carpeta del repo que contiene 'ui/...'. Termina con /
$BaseUrl = "https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/"
$Token   = ""   # repo publico -> sin token
# =============================================================

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$files = @(
  'ui/src/data/catalog_app.json',
  'ui/src/data/seasonal_config.json',
  'ui/src/data/products.js',
  'ui/src/data/modifiersImages.js',
  'ui/src/pages/MenuPage.jsx',
  'ui/src/pages/CustomizePage.jsx',
  'ui/src/pages/AdminVisibilidad.jsx',
  'kiosko-puente/routes/visibility.js',
  'kiosko-puente/routes/order.js',
  'ui/src/components/SeasonalDrinkOverlay.jsx',
  'ui/src/components/ModifierStep.jsx',
  'ui/src/components/FloatingCart.jsx',
  'ui/src/components/CartSummary.jsx',
  'ui/src/components/ComboFlowOverlay.jsx',
  'ui/src/components/PromoOverlay.jsx',
  'ui/src/context/CartContext.jsx',
  'ui/src/index.css',
  'ui/public/images/Nutella-logo.png',
  'ui/public/images/refresher_combo.png',
  'ui/public/images/ZANAHORIA_MEDIANO.png',
  'ui/public/images/RED_VELVET_MEDIANO.png',
  'ui/public/images/VOLCANO_MEDIANO.jpg',
  'ui/public/images/CHEESECAKE_FRESA.jpg',
  'ui/public/videos/NUTELLA.mp4',
  'ui/public/videos/TEMPORADA_JUNIO.mp4',
  'ui/public/videos/matchapostre.mp4',
  'ui/public/videos/MIERCOLES.mp4',
  'ui/public/videos/JUEVES.mp4',
  'ui/public/videos/COPITAS.mp4',
  'ui/public/videos/HORAFELIZ.mp4',
  'ui/public/videos/CUMPLEANERO.mp4',
  'ui/public/videos/SLUSH.mp4',
  'ui/public/videos/MARTES.mp4',
  'ui/public/videos/KIOSKO_REFRESHER.mp4'
)

# ---- 1. Detectar la raiz de la app ----
if (-not $AppRoot) {
  $candidates = @(
    'C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz','C:\nomina','C:\Nomina',
    "$env:USERPROFILE\kiosko","$env:USERPROFILE\interfaz","$env:USERPROFILE\nomina",
    "$env:USERPROFILE\Desktop\kiosko","$env:USERPROFILE\Desktop\interfaz","$env:USERPROFILE\Desktop\nomina"
  )
  foreach ($c in $candidates) {
    if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $AppRoot = $c; break }
  }
}
if (-not $AppRoot) {
  Write-Host "Buscando la app en C:\ ..."
  $hit = Get-ChildItem -Path 'C:\' -Recurse -Filter 'catalog_app.json' -ErrorAction SilentlyContinue |
         Where-Object { $_.FullName -like '*\ui\src\data\catalog_app.json' } | Select-Object -First 1
  if ($hit) { $AppRoot = $hit.Directory.Parent.Parent.Parent.FullName }
}
if (-not $AppRoot) { throw "No encontre la app. Corre con -AppRoot 'C:\<carpeta>'." }
Write-Host "App root: $AppRoot" -ForegroundColor Cyan

# ---- 2. Descargar cada archivo y colocarlo (con backup) ----
$headers = @{ 'Cache-Control' = 'no-cache' }
if ($Token) { $headers['Authorization'] = "token $Token" }

$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$bak = Join-Path $AppRoot "_deploy_bak_$ts"
$n = 0
foreach ($rel in $files) {
  $url  = $BaseUrl + $rel + "?t=$ts"     # cache-buster
  $dest = Join-Path $AppRoot ($rel -replace '/', '\')
  $tmp  = Join-Path $env:TEMP ("dl_" + [IO.Path]::GetFileName($rel))
  Write-Host "  bajando $rel ..."
  Invoke-WebRequest -Uri $url -Headers $headers -OutFile $tmp -UseBasicParsing
  # backup
  if (Test-Path $dest) {
    $bdest = Join-Path $bak ($rel -replace '/', '\')
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $bdest) | Out-Null
    Copy-Item $dest $bdest -Force
  } else {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  }
  Copy-Item $tmp $dest -Force
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  Write-Host "    -> $dest" -ForegroundColor Green
  $n++
}
Write-Host "$n archivo(s) desplegados. Backup: $bak" -ForegroundColor Cyan

# ---- 3. Refresh opcional (F5 a Chrome). NO mata procesos, NO toca KIOSKO.bat ----
if ($Refresh) {
  try {
    Add-Type -AssemblyName System.Windows.Forms
    $sig = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
    $win = Add-Type -MemberDefinition $sig -Name Win -Namespace Native -PassThru
    $chrome = Get-Process chrome -ErrorAction SilentlyContinue |
              Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($chrome) {
      [void]$win::SetForegroundWindow($chrome.MainWindowHandle)
      Start-Sleep -Milliseconds 400
      [System.Windows.Forms.SendKeys]::SendWait('{F5}')
      Write-Host "  F5 enviado a Chrome." -ForegroundColor Green
    } else { Write-Host "  No vi ventana de Chrome. Da F5 manual." -ForegroundColor Yellow }
  } catch { Write-Host "  F5 automatico fallo. Da F5 manual." -ForegroundColor Yellow }
}
Write-Host "DEPLOY LISTO." -ForegroundColor Green

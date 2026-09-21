<#
  update_temporada_sep2026.ps1 — Lanzamiento bebidas de otono (21-sep-2026).
  Baja SOLO los 12 archivos del lanzamiento: 4 bebidas nuevas (Iced Coffee Lotus,
  Iced Pumpkin, Aerocano, Iced Matchapan), sus fotos, sus videos y el badge de Lotus.
  Hace backup de lo anterior. NO toca .env, credenciales ni KIOSKO.bat.

  NOTA: el COLD FOAM LOTUS y el alza a $20 de los cold foam NO van aqui.
        Eso entra el miercoles 23-sep en un deploy aparte.

  Uso:  powershell -ExecutionPolicy Bypass -File .\update_temporada_sep2026.ps1
        (agrega -Refresh para mandarle F5 al kiosko al terminar)
#>
param(
  [string]$AppRoot = "",
  [switch]$Refresh
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$BaseUrl = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/'

$files = @(
  # --- catalogo y configuracion ---
  'ui/src/data/catalog_app.json',
  'ui/src/data/seasonal_config.json',
  'ui/src/pages/MenuPage.jsx',
  # --- fotos de las 4 bebidas ---
  'ui/public/images/bebidas/iced-coffee-lotus.jpg',
  'ui/public/images/bebidas/iced-pumpkin.jpg',
  'ui/public/images/bebidas/iced-matchapan.jpg',
  'ui/public/images/bebidas/aerocano.jpg',
  # --- badge "Nuevo" de Lotus ---
  'ui/public/images/Lotus-nuevo.svg',
  # --- videos del rotador ---
  'ui/public/videos/AEROCANO.mp4',
  'ui/public/videos/PUMPKIN.mp4',
  'ui/public/videos/MATCHAPAN.mp4',
  'ui/public/videos/PASTEL_VAINILLA.mp4'
)

# ---- 1. Detectar la raiz de la app ----
if (-not $AppRoot) {
  $candidates = @(
    'C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz',
    "$env:USERPROFILE\kiosko","$env:USERPROFILE\interfaz",
    "$env:USERPROFILE\Desktop\kiosko","$env:USERPROFILE\Desktop\interfaz"
  )
  foreach ($c in $candidates) {
    if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $AppRoot = $c; break }
  }
}
if (-not $AppRoot) {
  Write-Host "Buscando la app en C:\ ..." -ForegroundColor Yellow
  $hit = Get-ChildItem -Path 'C:\' -Recurse -Filter 'catalog_app.json' -ErrorAction SilentlyContinue |
         Where-Object { $_.FullName -like '*\ui\src\data\catalog_app.json' } | Select-Object -First 1
  if ($hit) { $AppRoot = $hit.Directory.Parent.Parent.Parent.FullName }
}
if (-not $AppRoot) { throw "No encontre la app. Corre con -AppRoot 'C:\<carpeta>'." }
Write-Host "App root: $AppRoot" -ForegroundColor Cyan

# ---- 2. Bajar cada archivo con backup ----
$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$bak = Join-Path $AppRoot "_deploy_bak_$ts"
$n = 0
foreach ($rel in $files) {
  $url  = $BaseUrl + $rel + "?t=$ts"          # cache-buster
  $dest = Join-Path $AppRoot ($rel -replace '/', '\')
  $tmp  = Join-Path $env:TEMP ("dl_" + [IO.Path]::GetFileName($rel))
  Write-Host "  bajando $rel ..."
  Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -OutFile $tmp -UseBasicParsing
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
Write-Host "Revisa: Populares/Especiales debe mostrar las 4 bebidas nuevas." -ForegroundColor Yellow

# ---- 3. Refresh opcional (F5 a Chrome). NO mata procesos. ----
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
      Write-Host "F5 enviado al kiosko." -ForegroundColor Green
    }
  } catch { Write-Host "No pude refrescar; recarga a mano." -ForegroundColor Yellow }
}

<#
  update_rebanadas_ocultas.ps1 - agrega 39 rebanadas al kiosko, TODAS OCULTAS.

  Cada sucursal las prende desde su panel de Admin Visibilidad segun su existencia.
  NO pisa lo que la sucursal ya tiene visible u oculto: el endpoint /api/visibility
  solo AGREGA el id a la lista si no estaba.

  ORDEN CRITICO: primero se ocultan los ids, DESPUES se baja el catalogo.
  Al reves habria unos segundos con las 39 rebanadas VISIBLES en pantalla.

  Uso:  powershell -ExecutionPolicy Bypass -File .\update_rebanadas_ocultas.ps1 -Refresh
#>
param(
  [string]$AppRoot = "",
  [string]$Puente  = "http://localhost:3001",
  [switch]$Refresh
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$BaseUrl = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/'
$rel     = 'ui/src/data/catalog_app.json'
$ids     = @(1825, 1828, 1829, 1830, 1831, 1833, 1835, 1836, 1838, 1839, 1840, 1842, 1843, 1845, 1846, 1847, 1848, 1849, 1851, 1852, 1854, 1855, 1856, 1857, 1859, 1861, 1862, 1863, 1864, 1865, 1866, 1867, 1868, 1879, 1880, 1991, 2001, 2042, 2256)

Write-Host "Rebanadas a ocultar: $($ids.Count)" -ForegroundColor Cyan

# ---- 0. El puente TIENE que estar vivo. Si no, abortamos ANTES de bajar nada ----
try {
  Invoke-RestMethod -Uri "$Puente/health" -TimeoutSec 5 -UseBasicParsing | Out-Null
  Write-Host "Puente OK en $Puente" -ForegroundColor Green
} catch {
  throw "El puente NO responde en $Puente. Abortado: sin el, las rebanadas saldrian VISIBLES."
}

# ---- 1. Ocultar (aditivo: no toca lo que la sucursal ya tenia) ----
$antes = (Invoke-RestMethod -Uri "$Puente/api/visibility" -UseBasicParsing).hidden
Write-Host "Ocultos antes: $($antes.Count)"
foreach ($id in $ids) {
  $body = @{ productId = $id; visible = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri "$Puente/api/visibility" -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing | Out-Null
}
$despues = (Invoke-RestMethod -Uri "$Puente/api/visibility" -UseBasicParsing).hidden
Write-Host "Ocultos despues: $($despues.Count)"

$faltan = $ids | Where-Object { $despues -notcontains $_ }
if ($faltan) { throw "NO quedaron ocultos: $($faltan -join ', '). Abortado antes de bajar el catalogo." }
Write-Host "Las $($ids.Count) quedaron ocultas." -ForegroundColor Green

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

# ---- 3. Bajar el catalogo (con backup) ----
$ts   = Get-Date -Format 'yyyyMMdd_HHmmss'
$dest = Join-Path $AppRoot ($rel -replace '/','\')
$tmp  = Join-Path $env:TEMP "dl_catalog_$ts.json"
Invoke-WebRequest -Uri ($BaseUrl + $rel + "?t=$ts") -Headers @{ 'Cache-Control'='no-cache' } -OutFile $tmp -UseBasicParsing
if ((Get-Item $tmp).Length -lt 100000) { throw "El catalogo bajo incompleto. Abortado." }
if (Test-Path $dest) { Copy-Item $dest "$dest.bak_$ts" -Force }
Copy-Item $tmp $dest -Force
Remove-Item $tmp -Force -EA SilentlyContinue
Write-Host "Catalogo actualizado -> $dest" -ForegroundColor Green
Write-Host "Backup: $dest.bak_$ts"

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
Write-Host "Listo. Las rebanadas estan en Admin Visibilidad, APAGADAS." -ForegroundColor Cyan

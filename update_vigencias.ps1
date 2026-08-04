<#
  update_vigencias.ps1 — actualiza videos de promos por nueva vigencia (31 nov) + banner.
  Baja:
    - ui/src/pages/MenuPage.jsx            (agrega CUMPLEANERO a fijos)
    - 6 videos actualizados + 1 nuevo (CUMPLEANERO)
  Backup de lo reemplazado. Solo frontend -> F5 al Chrome (no reinicia puente).
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rels = @(
  'ui/src/pages/MenuPage.jsx',
  'ui/public/videos/KIOSKO_REFRESHER.mp4',
  'ui/public/videos/MARTES.mp4',
  'ui/public/videos/MIERCOLES.mp4',
  'ui/public/videos/JUEVES.mp4',
  'ui/public/videos/COPITAS.mp4',
  'ui/public/videos/HORAFELIZ.mp4',
  'ui/public/videos/CUMPLEANERO.mp4'
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
  if (-not (Test-Path (Split-Path -Parent $dest))) { New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null }
  if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force }
  Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $dest
  Write-Host ("OK -> " + $dest) -ForegroundColor Green
}
Write-Host "LISTO. Solo frontend: da F5 al Chrome." -ForegroundColor Green

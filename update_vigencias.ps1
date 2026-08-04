<#
  update_vigencias.ps1 — actualiza videos de promos por nueva vigencia (31 nov) + banner + crossfade.
  Baja a TEMP y reemplaza con reintentos (los .mp4 pueden estar en uso por Chrome/vite).
  Backup de lo reemplazado. Solo frontend -> F5 al Chrome (no reinicia puente).
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rels = @(
  'ui/src/pages/MenuPage.jsx',
  'ui/src/components/PromoOverlay.jsx',
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
$bloqueados = @()
foreach ($rel in $rels) {
  $dest = Join-Path $root ($rel -replace '/','\')
  $url  = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/' + $rel + '?t=' + $ts
  $tmp  = Join-Path $env:TEMP ('dl_' + [IO.Path]::GetRandomFileName())

  # 1) Descargar SIEMPRE a temp (el temp nunca esta bloqueado)
  Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $tmp

  if (-not (Test-Path (Split-Path -Parent $dest))) { New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null }
  if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force -EA SilentlyContinue }

  # 2) Reemplazar con reintentos (espera a que Chrome/vite suelte el .mp4 al rotar)
  $ok = $false
  for ($i = 0; $i -lt 25; $i++) {
    try { Copy-Item $tmp $dest -Force; $ok = $true; break }
    catch { Start-Sleep -Milliseconds 800 }
  }
  Remove-Item $tmp -Force -EA SilentlyContinue

  if ($ok) { Write-Host ("OK -> " + $dest) -ForegroundColor Green }
  else { Write-Host ("BLOQUEADO (reintenta luego): " + $dest) -ForegroundColor Yellow; $bloqueados += $rel }
}

if ($bloqueados.Count -eq 0) {
  Write-Host "LISTO. Da F5 al Chrome." -ForegroundColor Green
} else {
  Write-Host ("QUEDARON BLOQUEADOS " + $bloqueados.Count + " archivo(s). Da F5 al Chrome y vuelve a correr el comando.") -ForegroundColor Yellow
}

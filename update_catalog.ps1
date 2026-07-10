<#
  update_catalog.ps1 — baja SOLO ui/src/data/catalog_app.json de GitHub y lo coloca.
  No toca videos, .env, ni nada mas. Backup del anterior.
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rel = 'ui/src/data/catalog_app.json'

# Detectar raiz de la app
$cands = @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz',
  (Join-Path $env:USERPROFILE 'kiosko'),
  (Join-Path $env:USERPROFILE 'Desktop\kiosko'))
$root = $null
foreach ($c in $cands) { if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $root = $c; break } }
if (-not $root) {
  Write-Host "Buscando la app en C:\ ..." -ForegroundColor Yellow
  $hit = Get-ChildItem 'C:\' -Recurse -Filter catalog_app.json -EA SilentlyContinue |
         Where-Object { $_.FullName -like '*\ui\src\data\catalog_app.json' } | Select-Object -First 1
  if ($hit) { $root = $hit.Directory.Parent.Parent.Parent.FullName }
}
if (-not $root) { throw "No encontre la app." }

$dest = Join-Path $root ($rel -replace '/','\')
$ts   = Get-Date -Format 'yyyyMMdd_HHmmss'
$url  = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/' + $rel + '?t=' + $ts

if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force }
Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $dest
Write-Host ("OK -> " + $dest) -ForegroundColor Green

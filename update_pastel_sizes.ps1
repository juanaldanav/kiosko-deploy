<#
  update_pastel_sizes.ps1 — baja SOLO ui/src/data/products.js.
  Fix: ocultar/mostrar tamano de pastel desde AdminVisibilidad aplica a TODA
  REPOSTERIA (antes solo 1725-1731). No toca extras ni nada mas.
  Solo frontend -> F5 al Chrome.
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rel = 'ui/src/data/products.js'
$cands = @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz','C:\nomina','C:\Nomina',
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

$dest = Join-Path $root ($rel -replace '/','\')
$ts   = Get-Date -Format 'yyyyMMdd_HHmmss'
$url  = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/' + $rel + '?t=' + $ts
if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force }
Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $dest
Write-Host ("OK -> " + $dest + "  (F5 al Chrome)") -ForegroundColor Green

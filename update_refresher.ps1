<#
  update_refresher.ps1 — sobrescribe SOLO ui/public/videos/KIOSKO_REFRESHER.mp4 (nuevo diseno).
  Baja a temp + reemplaza con reintentos (el .mp4 puede estar en uso por Chrome/vite).
  Solo frontend -> F5 al Chrome.
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rel = 'ui/public/videos/KIOSKO_REFRESHER.mp4'
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

$dest = Join-Path $root ($rel -replace '/','\')
$ts   = Get-Date -Format 'yyyyMMdd_HHmmss'
$url  = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/' + $rel + '?t=' + $ts
$tmp  = Join-Path $env:TEMP ('dl_' + [IO.Path]::GetRandomFileName())

Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $tmp
if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force -EA SilentlyContinue }

$ok = $false
for ($i = 0; $i -lt 25; $i++) {
  try { Copy-Item $tmp $dest -Force; $ok = $true; break }
  catch { Start-Sleep -Milliseconds 800 }
}
Remove-Item $tmp -Force -EA SilentlyContinue

if ($ok) { Write-Host ("OK -> " + $dest + "  (F5 al Chrome)") -ForegroundColor Green }
else { Write-Host ("BLOQUEADO. Da F5 al Chrome y vuelve a correr.") -ForegroundColor Yellow }

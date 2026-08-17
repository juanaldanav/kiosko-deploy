<#
  update_visibilidad.ps1 — arregla el guardado de VISIBILIDAD DE TAMANOS de pastel.
  Baja: kiosko-puente/routes/visibility.js (route sizes + auto-repara hidden_sizes.json corrupto)
        kiosko-puente/index.js (cierre elegante / anti-EADDRINUSE, reinicio limpio)
  Reinicia el puente (nodemon). Para el arranque mas limpio: cierra el puente y reabre KIOSKO.bat.
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rels = @(
  'kiosko-puente/routes/visibility.js',
  'kiosko-puente/index.js'
)
$cands = @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz','C:\nomina','C:\Nomina',
  (Join-Path $env:USERPROFILE 'kiosko'),(Join-Path $env:USERPROFILE 'Desktop\kiosko'))
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
  $tmp  = Join-Path $env:TEMP ('dl_' + [IO.Path]::GetRandomFileName())
  Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $tmp
  if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force -EA SilentlyContinue }
  $ok = $false
  for ($i=0; $i -lt 15; $i++) { try { Copy-Item $tmp $dest -Force; $ok=$true; break } catch { Start-Sleep -Milliseconds 800 } }
  Remove-Item $tmp -Force -EA SilentlyContinue
  if ($ok) { Write-Host "  OK -> $rel" -ForegroundColor Green } else { Write-Host "  BLOQUEADO: $rel" -ForegroundColor Yellow }
}
Write-Host "LISTO. El puente se reinicia solo. Para arranque limpio: cierra el puente y reabre KIOSKO.bat." -ForegroundColor Green

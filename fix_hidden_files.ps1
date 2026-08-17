<#
  fix_hidden_files.ps1 — repara los archivos de visibilidad (hidden_*.json) que
  quedaron CORRUPTOS (ej. hidden_sizes.json con puros NUL por una escritura interrumpida).
  Solo resetea los que NO son JSON valido; los validos NO se tocan (conserva lo ya oculto).
  NO reinicia el puente, NO deploya codigo. El route lee el archivo por request -> arregla al toque.
#>
$ErrorActionPreference = 'Stop'

# Detectar la carpeta data del puente
$cands = @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz','C:\nomina','C:\Nomina',
  (Join-Path $env:USERPROFILE 'kiosko'),(Join-Path $env:USERPROFILE 'Desktop\kiosko'))
$root = $null
foreach ($c in $cands) { if (Test-Path (Join-Path $c 'kiosko-puente\data')) { $root = $c; break } }
if (-not $root) {
  $hit = Get-ChildItem 'C:\' -Recurse -Filter hidden_sizes.json -EA SilentlyContinue |
         Where-Object { $_.FullName -like '*\kiosko-puente\data\hidden_sizes.json' } | Select-Object -First 1
  if ($hit) { $root = $hit.Directory.Parent.Parent.FullName }
}
if (-not $root) { throw "No encontre kiosko-puente\data." }
$dataDir = Join-Path $root 'kiosko-puente\data'
Write-Host "Data dir: $dataDir" -ForegroundColor Cyan

# archivo -> contenido default (llave interna)
$defaults = @{
  'hidden_products.json' = '{ "hidden": [] }'
  'hidden_sizes.json'    = '{ "hiddenSizes": [] }'
  'hidden_colors.json'   = '{ "hiddenColors": [] }'
  'hidden_insumos.json'  = '{ "hiddenInsumos": [] }'
}
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
foreach ($name in $defaults.Keys) {
  $path = Join-Path $dataDir $name
  $ok = $false
  if (Test-Path $path) {
    try {
      $raw = [IO.File]::ReadAllText($path)
      if ($raw -and $raw.Trim().Length -gt 0 -and -not $raw.Contains([char]0)) {
        $null = $raw | ConvertFrom-Json   # lanza si no es JSON valido
        $ok = $true
      }
    } catch { $ok = $false }
  }
  if ($ok) {
    Write-Host "  OK (valido, no se toca): $name" -ForegroundColor Green
  } else {
    if (Test-Path $path) { Copy-Item $path ($path + '.corrupto_' + $ts) -Force -EA SilentlyContinue }
    [IO.File]::WriteAllText($path, $defaults[$name], [Text.UTF8Encoding]::new($false))
    Write-Host "  REPARADO (estaba corrupto/vacio): $name" -ForegroundColor Yellow
  }
}
Write-Host "LISTO. Prueba ocultar/mostrar una talla en AdminVisibilidad (no hace falta reiniciar el puente)." -ForegroundColor Green

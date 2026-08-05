<#
  update_extrashot.ps1 — Feature EXTRAS (EXTRA SHOT / COLD BREW) completo.
  1) Baja archivos compartidos (catalog, order.js, UI de extras, etc.).
  2) PARCHEA el api.js LOCAL en su lugar (inserta el bloque sendWith del grano)
     SIN tocar las lineas de idTerminal/idUsuario (que son por sucursal).
  Idempotente: si api.js ya esta parcheado, no lo vuelve a tocar.
  Solo frontend -> F5 al Chrome (order.js reinicia el puente solo via nodemon).
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Archivos COMPARTIDOS que se bajan tal cual (api.js NO va aqui: se parchea local)
$rels = @(
  'ui/src/data/catalog_app.json',
  'ui/src/utils/prepare-cart-for-backend.js',
  'ui/src/data/modifiersImages.js',
  'ui/src/components/ModifierStep.jsx',
  'ui/src/data/products.js',
  'ui/src/pages/CustomizePage.jsx',
  'kiosko-puente/routes/order.js',
  'kiosko-puente/index.js'
)

# ---- Detectar raiz de la app ----
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

# ---- 1) Descargar compartidos (a temp + reemplazo con reintentos) ----
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
foreach ($rel in $rels) {
  $dest = Join-Path $root ($rel -replace '/','\')
  $url  = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/' + $rel + '?t=' + $ts
  $tmp  = Join-Path $env:TEMP ('dl_' + [IO.Path]::GetRandomFileName())
  Invoke-WebRequest -Uri $url -Headers @{ 'Cache-Control' = 'no-cache' } -UseBasicParsing -OutFile $tmp
  if (-not (Test-Path (Split-Path -Parent $dest))) { New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null }
  if (Test-Path $dest) { Copy-Item $dest ($dest + '.bak_' + $ts) -Force -EA SilentlyContinue }
  $ok = $false
  for ($i=0; $i -lt 15; $i++) { try { Copy-Item $tmp $dest -Force; $ok=$true; break } catch { Start-Sleep -Milliseconds 800 } }
  Remove-Item $tmp -Force -EA SilentlyContinue
  if ($ok) { Write-Host "  OK -> $rel" -ForegroundColor Green }
  else { Write-Host "  BLOQUEADO (reintenta luego): $rel" -ForegroundColor Yellow }
}

# ---- 2) Parchear api.js LOCAL (sin tocar idTerminal/idUsuario) ----
$apiPath = Join-Path $root 'ui\src\lib\api.js'
if (-not (Test-Path $apiPath)) {
  Write-Host "  api.js NO encontrado en $apiPath (parche omitido)." -ForegroundColor Yellow
} else {
  $api = [IO.File]::ReadAllText($apiPath)
  if ($api -match 'option\._raw && option\._raw\.sendWith') {
    Write-Host "  api.js ya estaba parcheado (sendWith). OK." -ForegroundColor Green
  } else {
    # Ancla: bloque de la rama cartItem.modificadores, hasta el push + su } de cierre del if(id)
    $anchor = '(const option = mod\.opcion;[\s\S]*?mods\.push\(\{ id, name, price \}\);\s*\r?\n\s*\})'
    $block = @'
$1
      // grano del EXTRA SHOT (sendWith) — auto-parche extras
      const _sw = option.sendWith || (option._raw && option._raw.sendWith);
      if (Array.isArray(_sw)) {
        for (const _ex of _sw) {
          if (_ex && _ex.id != null) mods.push({ id: _ex.id, name: _ex.name || "", price: 0 });
        }
      }
'@
    $new = [regex]::Replace($api, $anchor, $block, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if ($new -ne $api -and ($new -match 'option\._raw && option\._raw\.sendWith')) {
      Copy-Item $apiPath ($apiPath + '.bak_' + $ts) -Force -EA SilentlyContinue
      [IO.File]::WriteAllText($apiPath, $new, [Text.UTF8Encoding]::new($false))
      Write-Host "  api.js PARCHEADO (sendWith del grano). idTerminal/idUsuario INTACTOS." -ForegroundColor Green
    } else {
      Write-Host "  NO se pudo parchear api.js automatico (formato distinto). Aplicar a mano." -ForegroundColor Yellow
    }
  }
}

Write-Host "LISTO. Da F5 al Chrome (el puente se reinicia solo)." -ForegroundColor Green

<#
  update_4oct.ps1 — FIX: el kiosko se comia la PRIMERA senal de refresh del dia.

    - ui/src/pages/MenuPage.jsx   El poll de /api/visibility/refresh-status usaba 0
                                  como centinela de "aun no lei nada", pero 0 es un
                                  valor REAL: refreshTimestamp vive en memoria del
                                  puente y arranca en 0 cada vez que levanta (KIOSKO.bat
                                  en la manana, y nodemon en cada deploy).
                                  Resultado: la sucursal apagaba un producto en /admin,
                                  quedaba guardado en hidden_products.json, pero el
                                  kiosko NO recargaba y seguia ofreciendo el menu
                                  completo hasta el siguiente apagado. Reportado desde
                                  PRIMAVERA el 4-oct (minis sin existencia a la venta),
                                  pero el bug esta en TODOS los kioskos.
                                  Ahora el centinela es null: 0 deja de ser magico.

  Es SOLO frontend. NO baja order.js -> no toca idTerminal/idUsuario de la sucursal.
  NO reinicia el puente. NO toca catalogo, visibilidad, .env ni nada mas.
  Backup del archivo reemplazado al lado, como .bak_<fecha>.

  Uso:  irm "<url de este script>" | iex     (luego F5 al Chrome del kiosko)
#>
param(
  [string]$AppRoot = "",
  # Commit del que se baja MenuPage.jsx. Se pinea el SHA y no 'main':
  # raw.githubusercontent cachea y con 'main' un kiosko se puede traer la
  # version vieja sin avisar.
  [string]$Ref     = "c8c3dd6684e8c80939bbf3e2723abb031138f185"
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rel     = 'ui/src/pages/MenuPage.jsx'
$BaseUrl = "https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/$Ref/"
Write-Host "Bajando del ref: $Ref" -ForegroundColor Cyan

# ---- 1. Detectar la app (la raiz cambia de nombre por equipo) ----
if (-not $AppRoot) {
  foreach ($c in @('C:\kiosko','C:\Kiosko','C:\interfaz','C:\Interfaz',
                   (Join-Path $env:USERPROFILE 'kiosko'),
                   (Join-Path $env:USERPROFILE 'Desktop\kiosko'))) {
    if (Test-Path (Join-Path $c 'ui\src\data\catalog_app.json')) { $AppRoot = $c; break }
  }
}
if (-not $AppRoot) {
  Write-Host "Buscando la app en C:\ ..." -ForegroundColor Yellow
  $hit = Get-ChildItem 'C:\' -Recurse -Filter catalog_app.json -EA SilentlyContinue |
         Where-Object { $_.FullName -like '*\ui\src\data\catalog_app.json' } | Select-Object -First 1
  if ($hit) { $AppRoot = $hit.Directory.Parent.Parent.Parent.FullName }
}
if (-not $AppRoot) { throw "No encontre la app. Corre con -AppRoot 'C:\<carpeta>'." }
Write-Host "App root: $AppRoot" -ForegroundColor Cyan

# ---- 2. Bajar a temporal y VERIFICAR antes de tocar el kiosko ----
$ts   = Get-Date -Format 'yyyyMMdd_HHmmss'
$dest = Join-Path $AppRoot ($rel -replace '/','\')
$tmp  = Join-Path $env:TEMP "dl_MenuPage.jsx"
Invoke-WebRequest -Uri ($BaseUrl + $rel + "?t=$ts") -Headers @{ 'Cache-Control'='no-cache' } `
                  -OutFile $tmp -UseBasicParsing

$len = (Get-Item $tmp).Length
if ($len -lt 15000) { throw "MenuPage.jsx bajo incompleto ($len bytes). Abortado, no se toco el kiosko." }
# Si no trae el fix, el deploy no sirve de nada: mejor abortar que dar por bueno.
if (-not (Select-String -Path $tmp -Pattern 'lastTimestamp = null' -Quiet)) {
  throw "El MenuPage.jsx que bajo NO trae el fix (falta 'lastTimestamp = null'). Ref equivocado? Abortado."
}

# ---- 3. Reemplazar con backup ----
if (Test-Path $dest) { Copy-Item $dest "$dest.bak_$ts" -Force }
Move-Item $tmp $dest -Force
Write-Host "OK -> $dest  ($len bytes)" -ForegroundColor Green
if (Test-Path "$dest.bak_$ts") { Write-Host "Backup: $dest.bak_$ts" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "LISTO. Solo frontend: da F5 al Chrome del kiosko." -ForegroundColor Green
Write-Host "Prueba: en /admin apaga un producto; el kiosko debe recargar solo en ~5 seg" -ForegroundColor Yellow
Write-Host "        y ese producto ya NO debe aparecer en el menu." -ForegroundColor Yellow

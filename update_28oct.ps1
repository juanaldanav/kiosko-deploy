<#
  update_28oct.ps1 — fotos nuevas de marketing (subidas al eCommerce el 21, 22 y 23-oct).

    - ui/src/data/catalog_app.json   27 productos cambian de imagen. Una sola URL por
                                     producto -- la del tamano GDE -- replicada a sus
                                     tallas, como ya se maneja el mapeo en el kiosko.

      Panaderia   ROL CANELA CLASICO, ROL JAMONCILLO, ROL LOTUS, ROL NUTELLA
      Frias       FRAPPUCCINO, DIRTY CHAI FRAPPUCCINO, DIRTY MATCHA FRAPPUCCINO,
                  FRAPPE CHAI, FRAPPE MATCHA, FRAPPE TARO, VAINILLA FRAPPE,
                  ICED COFFEE, ICED DIRTY CHAI, ICED DIRTY MATCHA, VANILLA ICED,
                  COLD BREW, COLD BREW LIMON, OATMILK COLD BREW, CACAO MILK,
                  AMERICANO A LAS ROCAS, AMERICANO LIMON, AFFOGATO, ICED MATCHAPAN
      Minipostres M. SUSPIRO DE FRESA, M. ROSA PASTEL, M. PEANUT BROWNIE,
                  M. TRADICIONAL VAINILLA

      Las 4 ultimas y el ICED MATCHAPAN venian de una foto LOCAL del kiosko; ahora
      apuntan a la oficial del eCommerce, asi que esas dependen de internet igual que
      el resto del catalogo. Las demas fotos locales (28 productos) no se tocaron.

  Es SOLO el catalogo. NO baja order.js -> no toca idTerminal/idUsuario de la sucursal.
  NO reinicia el puente. NO toca visibilidad: lo que cada sucursal tenga apagado en
  /admin vive en kiosko-puente\data\hidden_*.json y este script ni lo lee.
  Backup del archivo reemplazado al lado, como .bak_<fecha>.

  Uso:  irm "<url de este script>" | iex     (luego F5 al Chrome del kiosko)
#>
param(
  [string]$AppRoot = "",
  # Commit del que se baja catalog_app.json. Se pinea el SHA y no 'main':
  # raw.githubusercontent cachea y con 'main' un kiosko se puede traer la
  # version vieja sin avisar.
  [string]$Ref     = "6b187d174b23f6c1a4e883aeb264d285306f90fa"
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rel     = 'ui/src/data/catalog_app.json'
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
# Un catalogo cortado deja al kiosko sin menu, asi que aqui se revisa todo:
# tamano, que sea JSON valido, que traiga los 160 productos y que de verdad
# venga con las fotos nuevas.
$ts   = Get-Date -Format 'yyyyMMdd_HHmmss'
$dest = Join-Path $AppRoot ($rel -replace '/','\')
$tmp  = Join-Path $env:TEMP "dl_catalog_app.json"
Invoke-WebRequest -Uri ($BaseUrl + $rel + "?t=$ts") -Headers @{ 'Cache-Control'='no-cache' } `
                  -OutFile $tmp -UseBasicParsing

$len = (Get-Item $tmp).Length
if ($len -lt 400000) { throw "catalog_app.json bajo incompleto ($len bytes). Abortado, no se toco el kiosko." }

try   { $cat = (Get-Content $tmp -Raw -Encoding UTF8 | ConvertFrom-Json).catalog }
catch { throw "El catalogo que bajo NO es JSON valido. Abortado, no se toco el kiosko." }
if ($cat.Count -lt 150) { throw "El catalogo trae solo $($cat.Count) productos. Abortado." }

$nuevas = ($cat | Where-Object { $_.image -like '*payclip.io/5067/*' }).Count
if ($nuevas -lt 25) {
  throw "El catalogo que bajo NO trae las fotos nuevas (solo $nuevas). Ref equivocado? Abortado."
}

# ---- 3. Reemplazar con backup ----
if (Test-Path $dest) { Copy-Item $dest "$dest.bak_$ts" -Force }
Move-Item $tmp $dest -Force
Write-Host "OK -> $dest  ($len bytes, $($cat.Count) productos, $nuevas con foto nueva)" -ForegroundColor Green
if (Test-Path "$dest.bak_$ts") { Write-Host "Backup: $dest.bak_$ts" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "LISTO. Solo el catalogo: da F5 al Chrome del kiosko." -ForegroundColor Green
Write-Host "Prueba: en el menu, los ROLES y los FRAPPUCCINOS deben verse con la foto nueva." -ForegroundColor Yellow
Write-Host "        Si alguna sale en blanco, es la URL del CDN: avisame cual." -ForegroundColor Yellow

<#
  update_30sep.ps1 — ROSA PASTEL (pastel + minipostre) y modo oscuro del admin.

    - ui/src/data/catalog_app.json    ROSA PASTEL 1802 (Ind 290 / Chico 550 / Med 690)
                                      y M. ROSA PASTEL 1754 ($45). La rebanada (1861)
                                      ya iba desde el 29-sep.
    - kiosko-puente/routes/order.js   OJO: este archivo trae idTerminal/idUsuario, que
                                      son DISTINTOS en cada sucursal. El script los lee
                                      del order.js que ya esta en el kiosko y se los
                                      re-aplica al nuevo, para no resetearlos a 1/9.
                                      Los pasteles se reconocen por Id_Grupo (34/35) y
                                      no por una lista de ids a mano. 1802 se habia
                                      quedado fuera de esa lista: sin esto el POS le
                                      cobraria Precio1 ($550) a las tres tallas.
                                      MISMO caso que update_reposteria.ps1 con 1800/1817.
    - ui/src/pages/AdminVisibilidad.jsx  modo claro/oscuro con switch. Lo elige cada
                                      sucursal y se guarda en el navegador de ese kiosko.
    - 2 fotos nuevas.

  Los DOS productos bajan OCULTOS: los prende la sucursal cuando tenga existencia.
  Backup de todo lo reemplazado. nodemon reinicia el puente solo.
  NO toca .env, videos, products.js ni nada mas.

  Uso:  .\update_30sep.ps1            (o -Refresh para mandar F5 al Chrome)
#>
param(
  [string]$AppRoot = "",
  [string]$Puente  = "http://localhost:3001",
  [switch]$Refresh
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$BaseUrl = 'https://raw.githubusercontent.com/juanaldanav/kiosko-deploy/main/'
$ids     = @(1802, 1754)          # ROSA PASTEL y M. ROSA PASTEL: bajan apagados
$rels    = @(
  'ui/src/data/catalog_app.json',
  'kiosko-puente/routes/order.js',
  'ui/src/pages/AdminVisibilidad.jsx',
  'ui/public/images/ROSA_PASTEL.jpg',
  'ui/public/images/m.rosapastel.jpg'
)

# ---- 0. El puente TIENE que estar vivo, o los productos saldrian VISIBLES ----
try {
  Invoke-RestMethod -Uri "$Puente/health" -TimeoutSec 5 -UseBasicParsing | Out-Null
  Write-Host "Puente OK en $Puente" -ForegroundColor Green
} catch {
  throw "El puente NO responde en $Puente. Abortado antes de tocar nada."
}

# ---- 1. Apagarlos ANTES de bajar el catalogo (aditivo) ----
$antes = (Invoke-RestMethod -Uri "$Puente/api/visibility" -UseBasicParsing).hidden
Write-Host "Ocultos antes: $($antes.Count)"
foreach ($id in $ids) {
  $body = @{ productId = $id; visible = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri "$Puente/api/visibility" -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing | Out-Null
}
$despues = (Invoke-RestMethod -Uri "$Puente/api/visibility" -UseBasicParsing).hidden
$faltan  = $ids | Where-Object { $despues -notcontains $_ }
if ($faltan) { throw "NO quedaron ocultos: $($faltan -join ', '). Abortado antes de bajar el catalogo." }
Write-Host "Ocultos despues: $($despues.Count). Los $($ids.Count) productos quedaron APAGADOS." -ForegroundColor Green

# ---- 2. Detectar la app ----
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

# ---- 3. Bajar, con backup ----
$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$bak = Join-Path $AppRoot "_deploy_bak_$ts"
foreach ($rel in $rels) {
  $dest = Join-Path $AppRoot ($rel -replace '/','\')
  $tmp  = Join-Path $env:TEMP ("dl_" + [IO.Path]::GetFileName($rel))
  Write-Host "  bajando $rel ..."
  Invoke-WebRequest -Uri ($BaseUrl + $rel + "?t=$ts") -Headers @{ 'Cache-Control'='no-cache' } -OutFile $tmp -UseBasicParsing
  # El catalogo pesa ~1 MB: si bajo cortado, mejor abortar que dejar el kiosko sin menu.
  if ($rel -like '*catalog_app.json' -and (Get-Item $tmp).Length -lt 100000) {
    throw "El catalogo bajo incompleto ($((Get-Item $tmp).Length) bytes). Abortado."
  }

  # --- order.js: conservar la terminal y el usuario DE ESTA SUCURSAL ---
  # Estan escritos como literales en el destructuring del body (idTerminal = N,
  # idUsuario = N) y cambian de kiosko a kiosko. El archivo del repo trae los de
  # matriz; si se copia plano, esta sucursal se queda con los ajenos.
  if ($rel -like '*routes/order.js' -and (Test-Path $dest)) {
    $viejo = Get-Content $dest -Raw
    $mT = [regex]::Match($viejo, 'idTerminal\s*=\s*(\d+)')
    $mU = [regex]::Match($viejo, 'idUsuario\s*=\s*(\d+)')
    if (-not ($mT.Success -and $mU.Success)) {
      throw "No encontre idTerminal/idUsuario en el order.js actual ($dest). Abortado para no pisarlos."
    }
    $idT = $mT.Groups[1].Value; $idU = $mU.Groups[1].Value
    $nuevo = Get-Content $tmp -Raw
    $nuevo = [regex]::Replace($nuevo, 'idTerminal\s*=\s*\d+', "idTerminal = $idT")
    $nuevo = [regex]::Replace($nuevo, 'idUsuario\s*=\s*\d+',  "idUsuario = $idU")
    if ($nuevo -notmatch "idTerminal = $idT" -or $nuevo -notmatch "idUsuario = $idU") {
      throw "No pude re-aplicar idTerminal/idUsuario al order.js nuevo. Abortado."
    }
    Set-Content -Path $tmp -Value $nuevo -NoNewline -Encoding UTF8
    Write-Host "    conservados de esta sucursal: idTerminal=$idT idUsuario=$idU" -ForegroundColor Yellow
  }
  if (Test-Path $dest) {
    $bd = Join-Path $bak ($rel -replace '/','\')
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $bd) | Out-Null
    Copy-Item $dest $bd -Force
  } else {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  }
  Copy-Item $tmp $dest -Force
  Remove-Item $tmp -Force -EA SilentlyContinue
  Write-Host "    -> $dest" -ForegroundColor Green
}
Write-Host "$($rels.Count) archivos desplegados. Backup: $bak" -ForegroundColor Cyan

# ---- 4. El puente debe RECARGAR order.js, no solo seguir vivo ----
# Nodemon ('npm run dev') lo reinicia solo. Pero si el puente se lanzo con
# 'npm start' (node index.js pelado) NO hay nodemon: el archivo queda nuevo en
# disco y el proceso sigue corriendo el viejo en memoria. /health responde igual,
# asi que no basta con preguntarle: hay que comparar CUANDO arranco el proceso
# contra cuando se escribio el archivo. Paso de verdad en la Mac el 30-sep.
Start-Sleep -Seconds 4
$orderPath = Join-Path $AppRoot 'kiosko-puente\routes\order.js'
$escrito   = (Get-Item $orderPath).LastWriteTime
try {
  Invoke-RestMethod -Uri "$Puente/health" -TimeoutSec 10 -UseBasicParsing | Out-Null
} catch {
  throw "El puente no respondio despues de copiar order.js. Revisa la ventana de npm run dev."
}
$puerto = ([uri]$Puente).Port
$conn   = Get-NetTCPConnection -LocalPort $puerto -State Listen -EA SilentlyContinue | Select-Object -First 1
if ($conn) {
  $proc = Get-Process -Id $conn.OwningProcess -EA SilentlyContinue
  if ($proc -and $proc.StartTime -lt $escrito) {
    Write-Host ""
    Write-Host "!! El puente NO se reinicio: lleva arriba desde $($proc.StartTime) y order.js" -ForegroundColor Red
    Write-Host "   se escribio a las $escrito. Sigue corriendo el codigo VIEJO en memoria." -ForegroundColor Red
    Write-Host "   Probablemente se lanzo con 'npm start' en vez de 'npm run dev' (nodemon)." -ForegroundColor Red
    Write-Host "   ARREGLO: cierra la ventana del puente y vuelve a correr KIOSKO.bat." -ForegroundColor Yellow
    Write-Host "   NO prendas ROSA PASTEL en Admin hasta que esto quede." -ForegroundColor Yellow
  } else {
    Write-Host "Puente reiniciado y con el order.js nuevo cargado." -ForegroundColor Green
  }
} else {
  Write-Host "No pude identificar el proceso del puente; verifica a mano que se haya reiniciado." -ForegroundColor Yellow
}

# ---- 5. F5 opcional ----
if ($Refresh) {
  try {
    Add-Type -AssemblyName System.Windows.Forms
    $sig = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
    $win = Add-Type -MemberDefinition $sig -Name Win -Namespace Native -PassThru
    $chrome = Get-Process chrome -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($chrome) {
      [void]$win::SetForegroundWindow($chrome.MainWindowHandle); Start-Sleep -Milliseconds 400
      [System.Windows.Forms.SendKeys]::SendWait('{F5}')
      Write-Host "F5 enviado." -ForegroundColor Green
    }
  } catch { Write-Host "Recarga a mano." -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "REVISAR EN PANTALLA:" -ForegroundColor Yellow
Write-Host "  - ROSA PASTEL y M. ROSA PASTEL NO deben verse en el menu; estan en Admin apagados"
Write-Host "  - Admin Visibilidad: el switch de arriba a la derecha cambia claro/oscuro"
Write-Host "  - Al prender ROSA PASTEL, sus 3 tallas cobran 290 / 550 / 690 (no 550 las tres)"
Write-Host ""
Write-Host "El script NO toca ui/src/lib/api.js, que tambien trae idTerminal/idUsuario de esta" -ForegroundColor Cyan
Write-Host "sucursal. Si arriba dice que conservo valores != 1/9, verifica que api.js siga igual." -ForegroundColor Cyan

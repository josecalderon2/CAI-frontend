# Script para desplegar la aplicación en IIS
# Guardar como deploy-to-iis.ps1

param (
    [string]$destinationPath = "C:\inetpub\wwwroot\cai",
    [string]$siteName = "CAI",
    [string]$port = "80",
    [string]$hostName = "cai.local"
)

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Error "Este script debe ejecutarse como administrador. Por favor, reinicia PowerShell como administrador."
    exit 1
}

# Comprobar si IIS está instalado
if (-not (Get-Service -Name W3SVC -ErrorAction SilentlyContinue)) {
    Write-Error "IIS no está instalado. Por favor, instala IIS antes de ejecutar este script."
    exit 1
}

# Comprobar si URL Rewrite está instalado
$urlRewriteModule = Get-WebGlobalModule -Name "RewriteModule" -ErrorAction SilentlyContinue
if (-not $urlRewriteModule) {
    Write-Warning "El módulo URL Rewrite no está instalado. Las rutas SPA pueden no funcionar correctamente."
    Write-Host "Por favor, instálalo desde: https://www.iis.net/downloads/microsoft/url-rewrite"
}

# Crear la carpeta de destino si no existe
if (-not (Test-Path $destinationPath)) {
    New-Item -ItemType Directory -Path $destinationPath | Out-Null
    Write-Host "Carpeta de destino creada: $destinationPath"
}

# Construir la aplicación
Write-Host "Construyendo la aplicación..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al construir la aplicación."
    exit 1
}

# Copiar los archivos al destino
Write-Host "Copiando archivos a $destinationPath..."
Copy-Item -Path ".\dist\*" -Destination $destinationPath -Recurse -Force

# Verificar si el sitio ya existe
$site = Get-WebSite -Name $siteName -ErrorAction SilentlyContinue
if ($site) {
    Write-Host "El sitio web '$siteName' ya existe. Actualizando..."
    Set-ItemProperty "IIS:\Sites\$siteName" -Name physicalPath -Value $destinationPath
} else {
    # Crear un nuevo sitio web
    Write-Host "Creando el sitio web '$siteName'..."
    New-WebSite -Name $siteName -Port $port -HostHeader $hostName -PhysicalPath $destinationPath -Force | Out-Null
}

# Configurar el sitio para admitir SPA
Write-Host "Configurando el sitio para admitir aplicaciones SPA..."

# Asegurar que el archivo web.config está presente
$webConfigPath = Join-Path -Path $destinationPath -ChildPath "web.config"
if (-not (Test-Path $webConfigPath)) {
    Write-Warning "No se encontró web.config en la carpeta de destino. Las rutas SPA pueden no funcionar correctamente."
}

Write-Host "¡Despliegue completado!"
Write-Host "La aplicación está disponible en: http://$hostName"
Write-Host ""
Write-Host "Nota: Si estás utilizando un nombre de host personalizado ($hostName), asegúrate de agregarlo a tu archivo hosts"
Write-Host "Puedes editar C:\Windows\System32\drivers\etc\hosts y agregar la línea:"
Write-Host "127.0.0.1 $hostName"
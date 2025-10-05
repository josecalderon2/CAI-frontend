@echo off
REM Script para desplegar la aplicación en IIS
REM Guardar como deploy-to-iis.bat

echo Verificando permisos de administrador...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Este script debe ejecutarse como administrador. Por favor, haz clic derecho y selecciona "Ejecutar como administrador".
    pause
    exit /b 1
)

set DESTINATION_PATH=C:\inetpub\wwwroot\cai
set SITE_NAME=CAI
set PORT=80
set HOST_NAME=cai.local

REM Permite cambiar parámetros mediante argumentos
if not "%~1"=="" set DESTINATION_PATH=%~1
if not "%~2"=="" set SITE_NAME=%~2
if not "%~3"=="" set PORT=%~3
if not "%~4"=="" set HOST_NAME=%~4

echo Construyendo la aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo Error al construir la aplicación.
    pause
    exit /b 1
)

echo Copiando archivos a %DESTINATION_PATH%...
if not exist "%DESTINATION_PATH%" mkdir "%DESTINATION_PATH%"
xcopy ".\dist\*" "%DESTINATION_PATH%" /E /Y

echo La aplicación se ha desplegado en %DESTINATION_PATH%
echo.
echo Para completar la instalación:
echo 1. Abre el Administrador de IIS (Ejecuta inetmgr)
echo 2. Crea un nuevo sitio web o aplicación apuntando a: %DESTINATION_PATH%
echo 3. Configura el nombre de host como: %HOST_NAME%
echo 4. Asegúrate de que el módulo URL Rewrite está instalado
echo.
echo ¡Despliegue completado!
echo.
pause
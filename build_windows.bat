@echo off
REM ═══════════════════════════════════════════════════════════════
REM Compilar Generador DC-3 y Reconocimientos AGASI para Windows (.exe con icono)
REM ═══════════════════════════════════════════════════════════════
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ═══════════════════════════════════════════════════════════
echo   Compilando Generador DC-3 y Reconocimientos AGASI para Windows
echo ═══════════════════════════════════════════════════════════
echo.

REM 1. Verificar venv
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] No se encontro venv\. Crea el entorno virtual primero:
    echo    python -m venv venv
    echo    venv\Scripts\activate
    echo    pip install -r requirements.txt
    echo    playwright install chromium
    exit /b 1
)

call venv\Scripts\activate.bat

REM 2. Instalar PyInstaller si no está
echo Verificando PyInstaller...
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo Instalando PyInstaller...
    pip install pyinstaller
)

REM 3. Verificar Chromium de Playwright
echo Verificando Chromium de Playwright...
python -m playwright install chromium

REM 4. Limpiar builds previos
echo Limpiando builds previos...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"

REM 5. Compilar
echo Compilando (esto puede tardar 3-7 minutos)...
pyinstaller build.spec --clean --noconfirm

REM 6. Verificar resultado
if exist "dist\Generador DC-3 y Reconocimientos AGASI.exe" (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo   Build exitoso
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo   Ejecutable: dist\Generador DC-3 y Reconocimientos AGASI.exe
    echo.
    echo   Para ejecutar, doble click en:
    echo     dist\Generador DC-3 y Reconocimientos AGASI.exe
    echo.
    echo   ^(Se abrira el navegador en http://127.0.0.1:8765^)
    echo.
) else (
    echo [ERROR] No se genero dist\Generador DC-3 y Reconocimientos AGASI.exe
    exit /b 1
)

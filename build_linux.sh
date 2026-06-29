#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Compilar GeneradorAGASI para Linux (ejecutable único .bin)
# ═══════════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Compilando GeneradorAGASI para Linux"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Verificar venv
if [ ! -d "venv" ]; then
    echo "❌ No se encontró venv/. Crea el entorno virtual primero:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    echo "   playwright install chromium"
    exit 1
fi

source venv/bin/activate

# 2. Verificar PyInstaller
if ! python -c "import PyInstaller" 2>/dev/null; then
    echo "📦 Instalando PyInstaller..."
    pip install pyinstaller
fi

# 3. Verificar que Playwright tenga Chromium instalado
echo "🔍 Verificando Chromium de Playwright..."
python -m playwright install chromium 2>&1 | tail -3

# 4. Limpiar builds previos
echo "🧹 Limpiando builds previos..."
rm -rf build/ dist/

# 5. Compilar
echo "🔨 Compilando (esto puede tardar 2-5 minutos)..."
pyinstaller build.spec --clean --noconfirm

# 6. Verificar resultado
if [ -f "dist/GeneradorAGASI" ]; then
    SIZE=$(du -h "dist/GeneradorAGASI" | cut -f1)
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  ✅ Build exitoso"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "  Ejecutable: dist/GeneradorAGASI ($SIZE)"
    echo ""
    echo "  Para ejecutar:"
    echo "    ./dist/GeneradorAGASI"
    echo ""
    echo "  (Se abrirá el navegador en http://127.0.0.1:8765)"
    echo ""
else
    echo "❌ Error: no se generó dist/GeneradorAGASI"
    exit 1
fi

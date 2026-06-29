# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec para Generador de Certificados AGASI
- Empaqueta app.py + dependencias (Flask, openpyxl, playwright)
- Incluye plantillas, firmas, logos, assets y venv de playwright
- Genera un único ejecutable con icono

Uso:
  pyinstaller build.spec --clean --noconfirm

El icono se detecta automáticamente según plataforma:
  - Windows: assets/agasi_icon.ico
  - Linux:   assets/agasi_icon_256.png
"""

import sys
from pathlib import Path

block_cipher = None
BASE = Path(SPECPATH).resolve()  # SPECPATH lo inyecta PyInstaller

# ─── Detección de icono según plataforma ───
if sys.platform == "win32":
    icon_path = str(BASE / "assets" / "agasi_icon.ico")
elif sys.platform == "darwin":
    icon_path = str(BASE / "assets" / "agasi_icon_256.png")
else:
    icon_path = str(BASE / "assets" / "agasi_icon_256.png")

# ─── Datos a incluir (datas) ───
datas = [
    # Templates HTML de Flask (index.html)
    (str(BASE / "templates"), "templates"),
    # Plantillas de certificados (DC-3, reconocimiento, constancia)
    (str(BASE / "plantillas"), "plantillas"),
    # Archivos estáticos (CSS, JS, excels de ejemplo)
    (str(BASE / "static"), "static"),
    # Firmas PNG
    (str(BASE / "firmas"), "firmas"),
    # Logos del agente capacitador
    (str(BASE / "Logos agente capacitador"), "Logos agente capacitador"),
    # Logo principal en raíz (lo usa la app en algunos lados)
    (str(BASE / "AG_Principal.png"), "."),
    (str(BASE / "Firma.avif"), "."),
    (str(BASE / "Firma_Soledad_Pastorutti.png"), "."),
]

# ─── Hidden imports (módulos que PyInstaller no detecta automáticamente) ───
hiddenimports = [
    "flask",
    "openpyxl",
    "openpyxl.styles",
    "openpyxl.utils",
    "playwright",
    "playwright.sync_api",
    "playwright._impl._driver",
    "playwright._impl._registry",
    "playwright._impl._transport",
    # greenlet y _greenlet son DLLs nativos críticos para Playwright
    # Si Windows los bloquea al cargar, el binario crashea al arrancar
    "greenlet",
    "_greenlet",
    "pkg_resources.py2_warn",
]

# ─── Binarios adicionales: chromium de Playwright ───
# PyInstaller NO incluye los binarios de Playwright automáticamente.
# Hay que detectar dónde está instalado y meterlo al bundle.
# El path varía por OS:
#   - Linux: ~/.cache/ms-playwright/
#   - Windows: %LOCALAPPDATA%\ms-playwright\  (típicamente C:\Users\X\AppData\Local\ms-playwright\)
#   - macOS: ~/Library/Caches/ms-playwright/
import os
import subprocess

def find_playwright_browsers():
    """Encuentra la carpeta de browsers de Playwright según plataforma."""
    candidates = []
    if sys.platform == "win32":
        # Windows: %LOCALAPPDATA%\ms-playwright
        local_app = os.environ.get("LOCALAPPDATA", "")
        if local_app:
            candidates.append(Path(local_app) / "ms-playwright")
        # Fallback: %USERPROFILE%\AppData\Local\ms-playwright
        userprofile = os.environ.get("USERPROFILE", "")
        if userprofile:
            candidates.append(Path(userprofile) / "AppData" / "Local" / "ms-playwright")
    elif sys.platform == "darwin":
        candidates.append(Path.home() / "Library" / "Caches" / "ms-playwright")
    else:
        # Linux
        candidates.append(Path.home() / ".cache" / "ms-playwright")

    for c in candidates:
        if c.exists():
            return c
    return None

try:
    playwright_dir = find_playwright_browsers()
    if playwright_dir and playwright_dir.exists():
        # Buscar las subcarpetas de chromium (chromium, chromium_headless_shell, etc.)
        for d in playwright_dir.iterdir():
            if d.is_dir() and "chromium" in d.name.lower():
                # En Windows el path destino NO debe tener subcarpeta intermedia
                # porque Playwright busca rutas relativas fijas
                dest = "_ms-playwright/" + d.name
                datas.append((str(d), dest))
                print(f"[build.spec] Incluyendo browser: {d} -> {dest}")
            elif d.is_dir() and "ffmpeg" in d.name.lower():
                # ffmpeg lo necesita Playwright para video (no lo usamos pero por si)
                datas.append((str(d), "_ms-playwright/" + d.name))
                print(f"[build.spec] Incluyendo ffmpeg: {d}")
    else:
        print(f"[build.spec] ADVERTENCIA: no se encontró carpeta de Playwright")
        print(f"[build.spec] Buscado en: {[str(c) for c in candidates]}")
        print(f"[build.spec] Ejecuta primero: playwright install chromium")
except Exception as e:
    print(f"[build.spec] Error localizando Playwright browser: {e}")

a = Analysis(
    [str(BASE / "app.py")],
    pathex=[str(BASE)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Excluir lo que no usamos para reducir tamaño
        "tkinter",
        "matplotlib",
        "numpy",
        "scipy",
        "pandas",
        "PyQt5",
        "PyQt6",
        "PySide2",
        "PySide6",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="GeneradorAGASI",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # UPX puede dar problemas en algunos antivirus
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Mostrar consola para que el usuario vea el log
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=icon_path if Path(icon_path).exists() else None,
)

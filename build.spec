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
    "pkg_resources.py2_warn",
]

# ─── Binarios adicionales: chromium de Playwright ───
# Localizar la carpeta de browsers de Playwright dentro del venv
import subprocess
try:
    result = subprocess.run(
        [sys.executable, "-m", "playwright", "install", "--dry-run", "chromium"],
        capture_output=True, text=True, timeout=10
    )
    # Buscar carpeta ms-playwright en el home del usuario
    import os
    playwright_browsers = Path.home() / ".cache" / "ms-playwright"
    if playwright_browsers.exists():
        # Buscar la subcarpeta de chromium
        for d in playwright_browsers.iterdir():
            if d.is_dir() and "chromium" in d.name.lower():
                datas.append((str(d), f"_ms-playwright/{d.name}"))
                print(f"[build.spec] Incluyendo browser: {d}")
                break
except Exception as e:
    print(f"[build.spec] No se pudo localizar Playwright browser: {e}")

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

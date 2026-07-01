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
    icon_path = str(BASE / "assets" / "agasi_icon_256.ico")
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
    # Assets (logos, iconos)
    (str(BASE / "assets"), "assets"),
    # Firmas PNG
    (str(BASE / "firmas"), "firmas"),
    # Logos del agente capacitador
    (str(BASE / "Logos agente capacitador"), "Logos agente capacitador"),
    # Logo principal en raíz (lo usa la app en algunos lados)
    (str(BASE / "AG_Principal.png"), "."),
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
        # ─── Nivel 1 optimización: solo UNA versión de headless_shell ───
        # Usamos chromium_headless_shell (no el chromium completo) porque:
        #   - headless_shell es ~70 MB más liviano
        #   - Solo necesitamos generar PDFs (no navegación visual)
        #   - La app está configurada para usar headless_shell
        # PyInstaller NO los necesita todos — solo uno de cada tipo.
        # Sin esto, el .exe termina con 2-3 versiones de Chromium = 200+ MB extra.

        def _version_key(d):
            """Ordena por número de versión (más reciente primero)."""
            try:
                version = d.name.split("-")[-1]
                return int(version) if version.isdigit() else 0
            except (ValueError, IndexError):
                return 0

        # Buscar SOLO headless_shell (NO chromium completo) para reducir tamaño
        headless_dirs = sorted(
            [
                d
                for d in playwright_dir.iterdir()
                if d.is_dir() and d.name.startswith("chromium_headless_shell-")
            ],
            key=_version_key,
            reverse=True,
        )

        if headless_dirs:
            newest = headless_dirs[0]
            dest = "_ms-playwright/" + newest.name
            datas.append((str(newest), dest))
            print(f"[build.spec] Usando headless_shell: {newest.name}")
        else:
            # Fallback: si no hay headless_shell, usar chromium completo
            print(
                f"[build.spec] ADVERTENCIA: no hay chromium_headless_shell, usando chromium completo"
            )
            for d in playwright_dir.iterdir():
                if d.is_dir() and d.name.startswith("chromium-"):
                    dest = "_ms-playwright/" + d.name
                    datas.append((str(d), dest))
                    print(f"[build.spec] Fallback: {d.name}")

        # ffmpeg (pequeño, lo dejamos por si Playwright lo necesita)
        for d in playwright_dir.iterdir():
            if d.is_dir() and "ffmpeg" in d.name.lower():
                datas.append((str(d), "_ms-playwright/" + d.name))
                print(f"[build.spec] Incluyendo ffmpeg: {d.name}")
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
    # ─── Fix: noarchive=True evita "Failed to extract ... decompression -1" ───
    # PyInstaller tiene un bug con bundles grandes (>150 MB) y archivos
    # comprimidos grandes: la descompresión falla aleatoriamente.
    # Con noarchive=True los archivos van sin comprimir, evitando el bug.
    # El bundle es ~10% más grande en disco, pero FUNCIONA.
    noarchive=True,
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

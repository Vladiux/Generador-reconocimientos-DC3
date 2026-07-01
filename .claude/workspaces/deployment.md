# Workspace: Deployment / Build / CI

> **Layer 2: The Room** — Contexto para build .exe, PyInstaller, GitHub Actions, distribución.

---

## Qué hace este workspace

- Build local con PyInstaller (onefile, ventana, sin consola)
- Build automático en GitHub Actions (windows-latest)
- Release automático en tags `v*` con `.exe` adjunto
- Manejo de assets, fonts, binarios Playwright en bundle

---

## Flujo de build

### Local
```bash
pyinstaller build.spec --clean --noconfirm
# Output: dist/GeneradorAGASI.exe
```

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/build-windows.yml
on:
  push:
    tags: ["v*"]
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - checkout
      - setup-python
      - install deps + pyinstaller
      - playwright install chromium
      - pyinstaller build.spec
      - upload-artifact
      - create-release (softprops/action-gh-release@v2)
```

---

## Build.spec — puntos clave

```python
# build.spec
icon_path = BASE / "assets" / "agasi_icon_256.ico"  # Windows
# datas incluye: templates/, plantillas/, static/, firmas/, assets/, logos/
# binaries: _ms-playwright/chromium_headless_shell-*/chrome-headless-shell*
hiddenimports: flask, openpyxl, playwright.sync_api, etc.
```

### Archivos incluidos en bundle (`datas`)

| Carpeta | Destino en bundle |
|---------|-------------------|
| `templates/` | `templates/` |
| `plantillas/` | `plantillas/` (SVGs decorativos) |
| `static/` | `static/` (JS, CSS) |
| `firmas/` | `firmas/` (PNGs de firma) |
| `assets/` | `assets/` (fonts, logos, iconos) |
| `AG_Principal.png` | raíz |
| `Gotita.png` | raíz |

### Binarios Playwright

- Se buscan en `~/.cache/ms-playwright/` o `%LOCALAPPDATA%\ms-playwright`
- Se copian a `_ms-playwright/` en bundle
- `build.spec:find_playwright_browsers()` detecta headless_shell

---

## Variables de entorno

| Variable | Qué hace |
|----------|----------|
| `PLAYWRIGHT_BROWSERS_PATH` | Override ruta browsers (dev: cache, bundle: `_MEIPASS/_ms-playwright`) |
| `PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW` | Usa headless shell nuevo |

---

## Release automático

```yaml
# Trigger: push tag v*
on:
  push:
    tags: ["v*"]
# Crea Release con:
# - name: "Generador AGASI v1.2.0"
# - body: notas auto-generadas
# - files: dist/GeneradorAGASI.exe
```

---

## Checklist pre-release

- [ ] Tests locales pasan (`python app.py` + preview manual)
- [ ] `build.spec` actualizado si agregaste archivos
- [ ] `assets/agasi_icon_256.ico` existe y es el ícono nuevo
- [ ] `static/favicon.ico` copiado para browser tab
- [ ] `build.spec` incluye nuevas carpetas en `datas`
- [ ] Tag semver correcto (`v1.2.0`, `v1.2.1`, etc.)

---

## Comandos útiles

```bash
# Build local limpio
pyinstaller build.spec --clean --noconfirm

# Test rápido del .exe generado
dist/GeneradorAGASI.exe

# Git tag + push (dispara workflow)
git tag -f v1.2.0
git push origin main
git push origin v1.2.0 --force

# Ver logs workflow
gh run list --workflow=build-windows.yml
gh run view --log
```

---

## Troubleshooting build

| Error | Causa | Fix |
|-------|-------|-----|
| "Executable doesn't exist" | Browser no en bundle | Verifica `build.spec` copy `_ms-playwright/` |
| "PIL not found" | Workflow intenta generar placeholder | Fix: workflow ya no usa PIL; verificar `agasi_icon_256.ico` existe |
| "Font not found" | Fuente no inlineada | Verificar `@font-face` + `inline_font()` en `app.py` |
| "Icono viejo en .exe" | Cache Windows | Renombrar .exe o `ie4uinit.exe -show` |
| "Fuente no carga" | `url()` no inlineado | Verificar `inline_font()` en `_generar_pdf_playwright` |
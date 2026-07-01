# CLAUDE.md — Generador de Certificados AGASI

> **Layer 1: The Map** — Este archivo es el punto de entrada. Léelo siempre primero.

---

## Qué es este proyecto

Generador local (Flask + Playwright) para emitir certificados PDF en lote (DC-3 STPS, Reconocimientos, Constancias) a partir de un Excel con la lista de participantes.

- **Backend**: Flask 3.x, Python 3.11+
- **PDF Engine**: Playwright + Chromium Headless Shell (sin UI, ligero ~70 MB)
- **Frontend**: Vanilla JS (ES6), CSS Grid/Flex, Sin build step
- **Excel**: openpyxl (xlsx), csv fallback
- **Build**: PyInstaller onefile (ventana, sin consola)
- **CI/CD**: GitHub Actions (windows-latest) → Release con `.exe`

---

## Estructura de carpetas

```
Generador reconocimientos/
├── CLAUDE.md                 ← Layer 1: Mapa (este archivo)
├── app.py                    # Backend Flask + Playwright + PyInstaller spec inline
├── build.spec                # Spec PyInstaller (assets, binarios, hidden imports)
├── requirements.txt
├── .github/workflows/        # CI/CD: build-windows.yml (tag v* → Release)
├── .claude/
│   ├── workspaces/           # Layer 2: The Rooms (contextos por área)
│   │   ├── backend.md        # Contexto backend/PDF
│   │   ├── frontend.md       # Contexto frontend/JS/CSS
│   │   ├── templates.md      # Contexto plantillas HTML/placeholders
│   │   └── deployment.md     # Contexto build/despliegue/CI
│   ├── skills/               # Layer 3: The Tools (skills reutilizables)
│   │   ├── pdf-rendering.md  # Skill: render PDF con Playwright
│   │   ├── excel-parsing.md  # Skill: leer/validar Excel
│   │   └── doc-coauthoring.md # Skill: co-redacción de docs
│   └── mcp/                  # (futuro) MCP servers
├── templates/                # Plantillas HTML (Jinja2-style {{placeholder}})
│   ├── index.html            # Página principal (servida por Flask)
│   ├── dc3.html              # Plantilla DC-3 STPS (2 páginas)
│   ├── reconocimiento_clasico.html
│   ├── reconocimiento_moderno.html
│   ├── reconocimiento_marco.html
│   ├── reconocimiento_ribbon.html
│   ├── reconocimiento_geometrico.html
│   └── constancia.html
├── static/
│   ├── app.js                # Frontend vanilla JS (mapping, preview, progress)
│   └── style.css
├── assets/                   # Assets estáticos (íconos, fuentes, logos)
│   ├── fonts/                # Inter, Rajdhani (self-hosted, no Google Fonts)
│   ├── agasi_icon_256.ico    # Ícono .exe Windows (build.spec lo usa)
│   └── AGASI.png             # Logo cabecera
├── plantillas/               # Plantillas Excel de ejemplo (descarga)
│   ├── Reconocimientos/
│   └── ...
├── firmas/                   # Imágenes de firma (PNG)
├── plantillas/Reconocimientos/  # SVGs decorativos (Certificado 1, 2, 3)
├── output/                   # PDFs generados (ignorado en git)
├── docs/                     # Documentación (Layer 2 + 3 duplicada aquí para humanos)
│   ├── architecture/
│   ├── guides/
│   └── reference/
└── .github/workflows/build-windows.yml
```

---

## Placeholders estándar (todas las plantillas)

| Placeholder | Descripción | Ejemplo |
|-------------|-------------|---------|
| `{{nombre}}` | Nombre completo participante | López Hernández María Fernanda |
| `{{curso}}` | Nombre del curso | Seguridad Industrial |
| `{{duracion}}` | Horas | 40 |
| `{{fecha}}` / `{{fecha_ini}}` / `{{fecha_fin}}` | Fechas | 15/06/2026 |
| `{{instructor}}` | Nombre instructor | Ing. Roberto Martínez |
| `{{lugar}}` | Sede | Pachuca, Hidalgo |
| `{{folio}}` | Folio auto/auto | AG-001 / DC3-001 |
| `{{curp}}` / `{{rfc}}` / `{{empresa}}` / `{{puesto}}` | DC-3 | — |
| `{{representante_legal}}` / `{{representante_legal_puesto}}` | DC-3 | — |
| `{{firma_representante}}` / `{{firma_trabajadores}}` | Rutas firma | `firmas/...` |
| `{{reg_stps}}` | Registro STPS | JUVH8204083R3-005 |
| `{{director_nombre}}` / `{{director_puesto}}` | Director | Ing. Alejandro García Salinas / Director General |

> **Nota**: Los placeholders se renderizan con `_render_plantilla()` en `app.py`. Los defaults de `director_*` y `reg_stps` vienen de `static/app.js → getAgentConfig()`.

---

## Flujo de trabajo típico

1. **Subir Excel** → POST `/api/upload-excel` → detecta headers (busca en 30 filas, ignora instrucciones) → devuelve headers + preview
2. **Mapeo** → UI drag-drop → POST `/api/preview` con `config` (STPS, director) → devuelve PDF 1 página
4. **Generar** → POST `/api/generate` → thread background → SSE `/api/progress` → ZIP en `output/batch_YYYYMMDD_HHMMSS/`
5. **Release** → push tag `v*` → GitHub Actions compila `.exe` → crea Release con `.exe` adjunto

---

## Referencias rápidas

| Archivo | Qué hace |
|---------|----------|
| `app.py` | Backend completo: routes, Excel parsing, PDF rendering, build.spec inline |
| `static/app.js` | Frontend: upload, mapping, config, preview, generate, progress SSE |
| `templates/*.html` | Plantillas Jinja2-like (placeholders `{{...}}`, CSS embebido) |
| `build.spec` | PyInstaller spec (assets, fonts, binarios Playwright, icono) |
| `.github/workflows/build-windows.yml` | CI: build en windows-latest, Release en tag `v*` |

---

## Comandos útiles

```bash
# Dev
python app.py                          # Flask en 8765
python -m pytest                       # (si hay tests)

# Build local
pyinstaller build.spec --clean --noconfirm

# Git tags → Release
git tag -f v1.2.0 && git push origin v1.2.0 --force
```

---

## Decisiones clave (ADR)

- **Self-hosted fonts** (Inter + Rajdhani) → sin tracking Google Fonts, offline
- **Playwright Headless Shell** (~70 MB) vs Chromium completo (~200 MB)
- **Inline base64** para imágenes/fonts** → Playwright `set_content` usa origen `data:`, no puede leer `file://`
- **Inline CSS/JS en plantillas** → sin dependencias estáticas extra, portable
- **SSE para progreso** → simple, sin WebSocket
- **openpyxl `data_only=True`** → lee valores calculados, no fórmulas
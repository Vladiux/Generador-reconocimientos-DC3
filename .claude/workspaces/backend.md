# Workspace: Backend / PDF Rendering

> **Layer 2: The Room** — Contexto para trabajar en backend, PDF rendering, Excel parsing.

---

## Qué hace este workspace

- Backend Flask: routes, middleware, error handling
- PDF rendering con Playwright (Chromium Headless Shell)
- Excel parsing: openpyxl + detección automática de headers
- Generación de PDFs en lote (background thread + SSE progress)

---

## Flujo del proceso

1. **upload_excel()** → lee Excel/CSV → detecta fila de headers (busca en 30 filas) → devuelve headers + preview filas
2. **preview_cert()** → toma primera fila mapeada → renderiza plantilla → PDF 1 página
3. **generate_batch()** → thread background → para cada fila: renderiza plantilla → PDF → ZIP → progreso via SSE
3. **_render_plantilla()** → carga HTML → reemplaza `{{placeholders}}` → expande chars (CURP, RFC, fechas)
4. **_generar_pdf_playwright()** → inlinea imágenes/fonts como base64 → Playwright `set_content` → PDF

---

## Archivos clave

| Archivo | Qué hace |
|---------|----------|
| `app.py:455` | `upload_excel()` — subida + detección headers (30 filas) |
| `app.py:562` | `preview_cert()` — preview 1 PDF |
| `app.py:635` | `generate_batch()` — batch en background |
| `app.py:770` | `_render_plantilla()` — placeholder replacement |
| `app.py:846` | `_generar_pdf_playwright()` — PDF con Playwright |
| `build.spec:24` | `icon_path` → `agasi_icon_256.ico` (Windows) |

---

## Decisiones clave (ADR)

- **Playwright Headless Shell** (~70 MB) vs Chromium completo (~200 MB)
- **Inline base64** para imágenes/fonts → Playwright `set_content` usa origen `data:`
- **Inline CSS/JS en plantillas** → sin dependencias estáticas extra
- **SSE para progreso** → simple, sin WebSocket
- **openpyxl `data_only=True`** → lee valores calculados, no fórmulas
- **Detector headers 30 filas** → DC-3 tiene ~18 líneas de instrucciones

---

## Errores comunes y fixes

| Error | Causa | Fix |
|-------|-------|-----|
| "Executable doesn't exist" | Browser no encontrado en `_ms-playwright` | Busca en 5 rutas: `_ms-playwright`, `.local-browsers`, `~/.cache/ms-playwright`, `%LOCALAPPDATA%/ms-playwright` |
| "Error generando preview: PIL not found" | Workflow usa PIL para placeholder icon | Workflow ya no usa PIL; verifica `agasi_icon_256.ico` existe |
| Preview muestra instrucciones | Detector headers solo 10 filas | `rows[:30]` en `app.py:526` |
| Preview no muestra imágenes | `inline_image_batch` solo `firmas/` | Agregado `assets/`, `plantillas/`, raíz |
| Fuentes no cargan | Playwright origen `data:` | Inline fonts como base64 en `_generar_pdf_playwright` |

---

## Archivos a tocar para cambios comunes

| Cambio | Archivos |
|--------|----------|
| Nuevo template | `plantillas/nuevo.html` + registrar en `static/app.js:TEMPLATE_GROUPS` |
| Nuevo campo placeholder | `app.py` `_render_plantilla()` + template HTML |
| Cambiar detección headers | `app.py:526` (`rows[:30]`) |
| Agregar validación Excel | `app.py:488` (`example_row_indices`) |
| Cambiar icono .exe | `build.spec:24` + `assets/agasi_icon_256.ico` |
| Cambiar defaults director/STPS | `static/app.js:getAgentConfig()` + `app.py:_render_plantilla()` |
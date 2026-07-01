# Workspace: Plantillas HTML / Placeholders

> **Layer 2: The Room** — Contexto para crear/modificar plantillas HTML de certificados.

---

## Qué hace este workspace

- Plantillas HTML con placeholders `{{campo}}` (estilo Jinja2)
- CSS embebido en `<style>` (sin archivos externos)
- Placeholders estándar + específicos por plantilla
- Imágenes/fonts inlineadas como base64 en render

---

## Estructura de una plantilla

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 297mm; height: 210mm; font-family: 'Inter', sans-serif; }
  /* CSS embebido completo */
</style>
</head>
<body>
  <img src="plantillas/Reconocimientos/Certificado 1.png" class="decoracion">
  <div class="contenido">
    <h1>{{nombre}}</h1>
    ...
  </div>
</body>
</html>
```

---

## Reglas de oro

1. **CSS embebido** en `<style>` — nada de archivos `.css` externos
2. **Placeholders** con `{{campo}}` exacto (case-sensitive)
3. **Imágenes** → `src="plantillas/.../archivo.png"` o `assets/...` o `firmas/...` → se inlinean como base64
4. **Fuentes** → `@font-face` con `url('assets/fonts/...')` → se inlinean como base64
5. **@page** → siempre `@page { size: A4 landscape; margin: 0; }`
6. **Unidades** → `mm` para dimensiones de página, `pt` para fuentes

---

## Placeholders estándar

| Placeholder | Descripción | Usado en |
|-------------|-------------|----------|
| `{{nombre}}` | Participante | Todas |
| `{{curso}}` | Nombre curso | Todas |
| `{{duracion}}` | Horas | Todas |
| `{{fecha}}` / `{{fecha_ini}}` / `{{fecha_fin}}` | Fechas | Todas |
| `{{instructor}}` | Instructor | Todas |
| `{{lugar}}` | Sede | Todas |
| `{{folio}}` | Folio auto | Todas |
| `{{curp}}` `{{rfc}}` `{{empresa}}` `{{puesto}}` | DC-3 | DC-3 |
| `{{representante_legal}}` | DC-3 | DC-3 |
| `{{representante_legal_puesto}}` | **QUITADO** v1.2.0 | — |
| `{{firma_representante}}` `{{firma_trabajadores}}` | Rutas firma | DC-3 |
| `{{reg_stps}}` | Registro STPS | DC-3 + Reconocimientos |
| `{{director_nombre}}` `{{director_puesto}}` | Director | Todas |

---

## Plantillas existentes

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `dc3.html` | DC-3 STPS | 2 páginas, formato oficial STPS |
| `reconocimiento_clasico.html` | Reconocimiento | Bordes dorados, esquinas decoradas |
| `reconocimiento_moderno.html` | Reconocimiento | Banda azul superior, minimalista |
| `reconocimiento_marco.html` | Reconocimiento | Marco azul doble línea (Certificado 2) |
| `reconocimiento_ribbon.html` | Reconocimiento | Cinta lateral (Certificado 1) |
| `reconocimiento_geometrico.html` | Reconocimiento | Diamantes esquinas (Certificado 3) |
| `constancia.html` | Constancia | Simple, una página |

---

## Placeholders por plantilla

| Plantilla | Placeholders específicos |
|-----------|--------------------------|
| `dc3.html` | `curp`, `rfc`, `empresa`, `puesto`, `area_tematica`, `ocupacion`, `fecha_ini`, `fecha_fin`, `representante_legal`, `firma_representante`, `representante_trabajadores`, `firma_trabajadores`, `mostrar_rep_trabajadores`, `reg_stps` |
| `reconocimiento_*` | `director_nombre`, `director_puesto`, `reg_stps` (via config) |
| `constancia.html` | Solo estándar |

---

## Cómo crear una plantilla nueva

1. Copia `plantillas/reconocimiento_clasico.html` → `plantillas/mi_nueva.html`
2. Cambia CSS/HTML manteniendo placeholders estándar
3. Agrega en `static/app.js`:
   ```js
   TEMPLATE_GROUPS.push({ name: "Mi Tipo", icon: "📄", templates: ["mi_nueva"] });
   TEMPLATE_INFO["mi_nueva"] = { icon: "📄", desc: "Descripción" };
   ```
4. Agrega en `app.py` `PLANTILLAS_EXCEL["mi_tipo"]` con headers y ejemplo
5. En `detectarCampos()` agrega palabras clave si tiene campos nuevos

---

## Assets en plantillas

| Tipo | Path | Inline |
|------|------|--------|
| Decoración SVG/PNG | `plantillas/Reconocimientos/Certificado 1.png` | ✅ base64 |
| Logo AGASI | `assets/AGASI.png` | ✅ base64 |
| Gotita | `assets/Gotita.png` | ✅ base64 |
| Firmas | `firmas/instructor.png` | ✅ base64 |
| Fuentes | `assets/fonts/inter/Inter-Regular.ttf` | ✅ base64 (font/ttf) |

> **Importante**: `src="plantillas/..."` o `src="assets/..."` → `_generar_pdf_playwright` los inlinea como `data:...;base64,...`

---

## Fuentes self-hosted (v1.2.0+)

| Fuente | Uso | Pesos |
|--------|-----|-------|
| **Inter** | Cuerpo (body, descripciones) | Regular, SemiBold, Bold |
| **Rajdhani** | Títulos (`.titulo`, `.subtitulo`, `.nombre`, `.curso-txt`) | Medium, SemiBold, Bold |

```css
@font-face { font-family: 'Inter'; src: url('assets/fonts/inter/Inter-Regular.ttf') format('truetype'); font-weight: 400; }
@font-face { font-family: 'Inter'; src: url('assets/fonts/inter/Inter-SemiBold.ttf') format('truetype'); font-weight: 600; }
@font-face { font-family: 'Inter'; src: url('assets/fonts/inter/Inter-Bold.ttf') format('truetype'); font-weight: 700; }
@font-face { font-family: 'Rajdhani'; src: url('assets/fonts/rajdhani/Rajdhani-Medium.ttf') format('truetype'); font-weight: 500; }
@font-face { font-family: 'Rajdhani'; src: url('assets/fonts/rajdhani/Rajdhani-SemiBold.ttf') format('truetype'); font-weight: 600; }
@font-face { font-family: 'Rajdhani'; src: url('assets/fonts/rajdhani/Rajdhani-Bold.ttf') format('truetype'); font-weight: 700; }

body { font-family: 'Inter', sans-serif; }
.titulo, .subtitulo, .nombre, .curso-txt { font-family: 'Rajdhani', sans-serif; }
```

---

## DC-3: Layout de firmas (v1.2.0+)

```html
<div class="sig-col">
  <div class="sig-role">Instructor o tutor</div>
  <div class="sig-area">
    <img class="sig-img" src="firmas/instructor.png">
    <div class="sig-name">{{instructor}}</div>
  </div>
  <div class="sig-line"></div>
  <div class="sig-label">Nombre y firma</div>
</div>
```

CSS clave:
```css
.sig-area { position: relative; min-height: 12mm; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.sig-img { position: absolute; top: 0; left: 50%; transform: translateX(-50%); max-height: 10mm; }
.sig-name { font-size: 7.5pt; font-weight: bold; position: relative; z-index: 1; background: #fff; padding: 0 2mm; margin: 0; }
.sig-line { width: 70%; border-top: 0.5pt solid #000; margin: 0 auto; }
.sig-label { font-size: 7pt; margin-top: 0.3mm; }
```

- `.sig-area` → 12mm de alto, posición relativa
- `.sig-img` → absoluta arriba (imagen de firma)
- `.sig-name` → relativo, z-index 1, fondo blanco (tapa firma si se superpone)
- `.sig-line` → debajo del nombre, margen 0 auto
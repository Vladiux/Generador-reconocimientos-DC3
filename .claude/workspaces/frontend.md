# Workspace: Frontend / JS / CSS

> **Layer 2: The Room** — Contexto para trabajar en frontend vanilla JS, CSS, mapeo, preview.

---

## Qué hace este workspace

- Subida de archivos (drag & drop, validación)
- Mapeo columnas Excel → campos plantilla (drag & drop UI)
- Selección de plantilla (categorías + sub-templates)
- Configuración "Datos del agente" (STPS, director)
- Preview PDF (iframe) + progreso batch (SSE)
- Descarga ZIP / apertura carpeta

---

## Flujo del proceso (Steps 1-4)

| Paso | UI | Acción |
|------|-----|--------|
| 1 | Dropzone + botones plantilla Excel | `upload_excel()` → `/api/upload-excel` |
| 2 | Tarjetas plantilla + subcategorías | `selectTemplate()` → `state.selectedTemplate` |
| 3 | Mapeo drag-drop + "Datos del agente" | `buildMapping()` + `getAgentConfig()` |
| 4 | Preview (iframe) + Generate (SSE) | `preview_cert()` + `generate_batch()` + SSE |

---

## Estado global (`state`)

```js
let state = {
  excelData: null,      // { headers, rows, total, tmp_path }
  selectedTemplate: null,
  mapping: {},          // { campo: col_idx }
  camposDisponibles: [], // campos que la plantilla necesita
};
```

---

## Archivos clave

| Archivo | Qué hace |
|---------|----------|
| `static/app.js` | Todo el frontend (4 steps + utils) |
| `static/style.css` | Estilos (CSS Grid/Flex, variables) |
| `templates/index.html` | HTML base + `<script src="...">` |

---

## Lógica de mapeo

1. **Auto-mapeo** → `detectarCampos()` → POST `/api/plantilla/<nombre>` → matchea headers Excel vs `CAMPOS_CERT` por nombre/fuzzy
2. **Ajuste manual** → UI drag-drop → `state.mapping[campo] = col_idx`
3. **Validación** → campos `required: true` deben estar mapeados

---

## Configuración "Datos del agente" (Step 4)

```js
function getAgentConfig() {
  return {
    reg_stps: document.getElementById("cfgRegStps")?.value?.trim() || "JUVH8204083R3-005",
    director_nombre: document.getElementById("cfgDirectorNombre")?.value?.trim() || "Ing. Hugo Juárez Vite",
    director_puesto: document.getElementById("cfgDirectorPuesto")?.value?.trim() || "AGENTE CAPACITADOR EXTERNO",
  };
}
```

- Solo se muestra si template **NO es DC-3** (se oculta en `selectTemplate()`)
- Se envía en `config` en requests `/api/preview` y `/api/generate`
- Backend mezcla `config` en cada fila antes de renderizar

---

## Preview PDF

```js
async function showPreview() {
  const primeraFila = state.excelData.rows[0];
  const datos = {}; // mapea primera fila según mapping
  const res = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plantilla: state.selectedTemplate, fila: datos, config: getAgentConfig() })
  });
  const blob = await res.blob();
  frame.src = URL.createObjectURL(blob);
}
```

---

## Generación batch + SSE

```js
const res = await fetch("/api/generate", {
  method: "POST",
  body: JSON.stringify({ plantilla, filas, mapeo, tmp_path, config: getAgentConfig() })
});
// SSE /api/progress → progress bar + current name
```

---

## Archivos clave

| Archivo | Qué hace |
|---------|----------|
| `static/app.js` | Todo el frontend (state, steps, API calls, UI) |
| `static/style.css` | Variables CSS, Grid/Flex, componentes |
| `templates/index.html` | HTML base + `<link>` + `<script>` |

---

## Cambios comunes

| Cambio | Dónde |
|--------|--------|
| Nueva plantilla | `TEMPLATE_GROUPS` + `TEMPLATE_INFO` en `app.js` + `plantillas/nueva.html` |
| Nuevo campo DC-3 | `CAMPOS_CERT` + `dc3Options` en `renderTemplateCategories()` |
| Cambiar default director | `getAgentConfig()` línea 39 |
| Cambiar label DC-3 | `dc3Options` string template (líneas 600-620) |
| Ocultar panel en DC-3 | `panel.style.display = name !== "dc3" ? "" : "none"` (en `selectTemplate()`) |

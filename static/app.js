// ─── Estado global del frontend ───
let state = {
  excelData: null, // { headers, rows, total, tmp_path }
  selectedTemplate: null,
  mapping: {}, // { campo: col_index }
  camposDisponibles: [], // campos que la plantilla necesita
};

// ─── Campos que el certificado puede necesitar ───
const CAMPOS_CERT = [
  { key: "nombre", label: "Nombre del participante", required: true },
  { key: "curso", label: "Nombre del curso", required: true },
  { key: "duracion", label: "Duración (horas)", required: false },
  { key: "fecha", label: "Fecha de conclusión", required: false },
  { key: "fecha_ini", label: "Fecha inicio (dd/mm/aaaa)", required: false },
  { key: "fecha_fin", label: "Fecha fin (dd/mm/aaaa)", required: false },
  { key: "calificacion", label: "Calificación", required: false },
  { key: "folio", label: "Folio", required: false },
  { key: "curp", label: "CURP", required: false },
  { key: "rfc", label: "RFC de la empresa", required: false },
  { key: "ocupacion", label: "Ocupación específica", required: false },
  { key: "area_tematica", label: "Área temática del curso", required: false },
  { key: "instructor", label: "Nombre del instructor", required: false },
  { key: "lugar", label: "Lugar de expedición", required: false },
  { key: "empresa", label: "Empresa / Razón social", required: false },
  { key: "puesto", label: "Puesto del participante", required: false },
  {
    key: "representante_legal",
    label: "Representante legal (nombre)",
    required: false,
  },
  {
    key: "firma_representante",
    label: "Ruta firma del representante",
    required: false,
  },
  {
    key: "representante_trabajadores",
    label: "Nombre rep. trabajadores",
    required: false,
  },
  {
    key: "mostrar_rep_trabajadores",
    label: "Incluir rep. trabajadores?",
    required: false,
  },
  { key: "reg_stps", label: "Registro STPS (opcional)", required: false },
];

// ─── Datos del agente (STPS + director) — se aplican a todo el lote ───
function getAgentConfig() {
  return {
    reg_stps:
      document.getElementById("cfgRegStps")?.value?.trim() ||
      "JUVH8204083R3-005",
    director_nombre:
      document.getElementById("cfgDirectorNombre")?.value?.trim() ||
      "Ing. Hugo Juárez Vite",
    director_puesto:
      document.getElementById("cfgDirectorPuesto")?.value?.trim() ||
      "Agente Capacitador Externo",
    agente_capacitador:
      document.getElementById("cfgAgenteCapacitador")?.value?.trim() ||
      "Ing. Hugo Juárez Vite",
  };
}

// ─── Descargar plantilla Excel vacía ───
function descargarPlantilla(tipo) {
  window.location.href = `/api/plantilla-excel/${tipo}`;
}

// ─── Step 1: Subir Excel ───
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () =>
  dropzone.classList.remove("dragover"),
);
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

document.getElementById("btnChangeFile").addEventListener("click", () => {
  document.getElementById("uploadResult").style.display = "none";
  document.getElementById("dropzone").style.display = "block";
  fileInput.value = "";
  state.excelData = null;
  document.getElementById("step2").style.display = "none";
  document.getElementById("step3").style.display = "none";
  document.getElementById("step4").style.display = "none";
});

async function handleFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  dropzone.querySelector(".dropzone-text").textContent = "Subiendo...";
  dropzone.querySelector(".dropzone-icon").textContent = "⏳";

  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (data.error) {
      alert("Error: " + data.error);
      dropzone.querySelector(".dropzone-text").innerHTML =
        "Arrastra tu Excel aquí<br>o <strong>haz click para seleccionar</strong>";
      dropzone.querySelector(".dropzone-icon").textContent = "📄";
      return;
    }

    state.excelData = data;
    dropzone.style.display = "none";
    document.getElementById("uploadResult").style.display = "block";
    document.getElementById("fileName").textContent = file.name;
    document.getElementById("rowCount").textContent = data.total;
    actualizarGenCount();

    // Mostrar botón de preview de datos
    document.getElementById("dataPreview").style.display = "block";

    // Construir tabla de preview
    construirPreviewDatos(data);

    // Mostrar step 2
    document.getElementById("step2").style.display = "block";
    // Scroll suave
    document.getElementById("step2").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("Error de conexión: " + err.message);
    dropzone.querySelector(".dropzone-text").innerHTML =
      "Arrastra tu Excel aquí<br>o <strong>haz click para seleccionar</strong>";
    dropzone.querySelector(".dropzone-icon").textContent = "📄";
  }
}

// ─── Validación de CURP y RFC ───
function validarCURP(curp) {
  if (!curp || curp.trim() === "") return { ok: false, msg: "vacío" };
  const c = curp.trim().toUpperCase();
  if (c.length !== 18)
    return { ok: false, msg: `${c.length} chars (deben ser 18)` };
  return { ok: true, msg: "18 chars ✅" };
}

function validarRFC(rfc) {
  if (!rfc || rfc.trim() === "") return { ok: false, msg: "vacío" };
  const c = rfc.trim().toUpperCase();
  if (c.length === 12) return { ok: true, msg: "12 chars · Empresa" };
  return { ok: false, msg: `${c.length} chars (deben ser 12)` };
}

// ─── Preview de datos cargados ───
function construirPreviewDatos(data) {
  const head = document.getElementById("previewHead");
  const body = document.getElementById("previewBody");
  head.innerHTML = "";
  body.innerHTML = "";

  head.innerHTML = "";
  body.innerHTML = "";

  // Contador de filas
  const countHtml = `<p style="font-size:11px;color:#64748b;margin:0 0 6px 0">${data.rows.length} fila${data.rows.length !== 1 ? "s" : ""} · scroll para ver más</p>`;
  const oldCount = document.getElementById("previewRowCount");
  if (oldCount) oldCount.remove();
  const countDiv = document.createElement("div");
  countDiv.id = "previewRowCount";
  countDiv.innerHTML = countHtml;
  const table = document.getElementById("previewTable");
  table.parentNode.insertBefore(countDiv, table);

  // Detectar índices de CURP y RFC por nombre de columna
  const curpIdx = data.headers.findIndex((h) => h && /curp/i.test(h));
  const rfcIdx = data.headers.findIndex((h) => h && /rfc/i.test(h));
  const hasValidation = curpIdx >= 0 || rfcIdx >= 0;

  // Fila de números
  let headerRow = "<tr><th class='row-num'>#</th>";
  data.headers.forEach((h) => {
    headerRow += `<th>${h || "Columna"}</th>`;
  });
  if (hasValidation) headerRow += "<th style='font-size:10px'>Validación</th>";
  headerRow += "</tr>";
  head.innerHTML = headerRow;

  // Filas de datos (mostrar TODAS con scroll vertical)
  for (let i = 0; i < data.rows.length; i++) {
    let rowHtml = `<tr><td class='row-num'>${i + 1}</td>`;
    let curpVal = "",
      rfcVal = "";
    data.rows[i].forEach((cell, j) => {
      let bg = "";
      if (j === curpIdx) {
        const v = validarCURP(cell || "");
        if (!v.ok) bg = ' style="background:#fee2e2"'; // rojo suave
        curpVal = cell || "";
      }
      if (j === rfcIdx) {
        const v = validarRFC(cell || "");
        if (!v.ok) bg = ' style="background:#fff3cd"'; // amarillo suave
        rfcVal = cell || "";
      }
      rowHtml += `<td title="${(cell || "").replace(/"/g, "&quot;")}"${bg}>${cell || ""}</td>`;
    });
    if (hasValidation) {
      let icons = "";
      if (curpIdx >= 0) {
        const v = validarCURP(curpVal);
        icons += v.ok ? "✅" : "❌";
      }
      if (rfcIdx >= 0) {
        const v = validarRFC(rfcVal);
        icons += v.ok ? "🟢" : "🟠";
      }
      rowHtml += `<td style="font-size:16px;text-align:center;padding:4px">${icons || ""}</td>`;
    }
    rowHtml += "</tr>";
    body.innerHTML += rowHtml;
  }
}

function toggleDataPreview() {
  const area = document.getElementById("previewTableArea");
  const btn = document.getElementById("btnTogglePreview");
  if (area.style.display === "none") {
    area.style.display = "block";
    btn.textContent = "🙈 Ocultar datos";
  } else {
    area.style.display = "none";
    btn.textContent = "👁️ Ver datos cargados";
  }
}

// ─── Toggle mapping ───
function toggleMapping() {
  const body = document.getElementById("mappingBody");
  const btn = document.getElementById("btnToggleMapping");
  if (body.style.display === "none") {
    body.style.display = "block";
    btn.innerHTML = "Ocultar mapeo ▴";
  } else {
    body.style.display = "none";
    btn.innerHTML = "Ajustar mapeo ▾";
  }
}

// ─── Step 2: Elegir plantilla (agrupadas) ───
// Configuración de grupos de plantillas
const TEMPLATE_GROUPS = [
  {
    name: "DC-3",
    icon: "📋",
    desc: "Formato oficial STPS",
    templates: ["dc3"],
  },
  {
    name: "Reconocimiento",
    icon: "📜",
    desc: "Diplomas y reconocimientos",
    templates: [
      "reconocimiento_clasico",
      "reconocimiento_moderno",
      "reconocimiento_marco",
      "reconocimiento_ribbon",
      "reconocimiento_geometrico",
    ],
  },
  {
    name: "Constancia",
    icon: "📄",
    desc: "Constancia simple",
    templates: ["constancia"],
  },
];

// Info de cada sub-variante (icono + descripción)
const TEMPLATE_INFO = {
  dc3: { icon: "📋", desc: "Formato oficial STPS · 2 páginas" },
  reconocimiento_clasico: {
    icon: "📜",
    desc: "Estilo clásico con bordes dorados",
  },
  reconocimiento_moderno: {
    icon: "✨",
    desc: "Estilo minimalista con banda azul",
  },
  reconocimiento_marco: { icon: "🖼️", desc: "Marco azul con doble línea" },
  reconocimiento_ribbon: { icon: "🎗️", desc: "Cinta teal lateral" },
  reconocimiento_geometrico: {
    icon: "◆",
    desc: "Acentos geométricos en esquina",
  },
  constancia: { icon: "📄", desc: "Constancia de capacitación simple" },
};

function renderTemplateCategories() {
  const grid = document.getElementById("templateGrid");
  grid.innerHTML = "";
  TEMPLATE_GROUPS.forEach((group) => {
    const card = document.createElement("div");
    card.className = "template-card category-card";
    card.dataset.template =
      group.templates.length === 1 ? group.templates[0] : "";
    card.innerHTML = `
            <div class="template-preview">${group.icon}</div>
            <p class="template-name">${group.name}</p>
            <p class="template-desc">${group.desc}</p>
        `;
    card.addEventListener("click", () => {
      if (group.templates.length === 1) {
        // Selección directa
        selectTemplate(group.templates[0]);
      } else {
        // Mostrar sub-opciones
        showSubTemplates(group);
      }
    });
    grid.appendChild(card);
  });
}

function showSubTemplates(group) {
  document.getElementById("templateGrid").style.display = "none";
  const subArea = document.getElementById("subTemplateArea");
  subArea.style.display = "block";
  document.getElementById("subCategoryTitle").textContent =
    group.icon + " " + group.name;

  const subGrid = document.getElementById("subTemplateGrid");
  subGrid.innerHTML = "";
  group.templates.forEach((name) => {
    const info = TEMPLATE_INFO[name] || { icon: "📄", desc: "" };
    const card = document.createElement("div");
    card.className = "template-card";
    card.dataset.template = name;
    card.innerHTML = `
            <div class="template-preview">${info.icon}</div>
            <p class="template-name">${name.replace(/_/g, " ").replace(/(\b\w)/g, (c) => c.toUpperCase())}</p>
            <p class="template-desc">${info.desc}</p>
        `;
    card.addEventListener("click", () => selectTemplate(name));
    subGrid.appendChild(card);
  });
}

function backToCategories() {
  document.getElementById("subTemplateArea").style.display = "none";
  document.getElementById("templateGrid").style.display = "grid";
  document.querySelectorAll(".template-card").forEach((c) => {
    c.classList.remove("selected");
    const check = c.querySelector(".sel-check");
    if (check) check.remove();
  });
}

function selectTemplate(name) {
  // Quitar selected de todas las cards en ambos grids
  document.querySelectorAll(".template-card").forEach((c) => {
    c.classList.remove("selected");
    // Quitar checkmark si existe
    const check = c.querySelector(".sel-check");
    if (check) check.remove();
  });

  // Marcar la card seleccionada
  const card =
    document.querySelector(`.template-card[data-template="${name}"]`) ||
    document.querySelector(`.category-card[data-template="${name}"]`);
  if (card) {
    card.classList.add("selected");
    // Agregar checkmark visual
    if (!card.querySelector(".sel-check")) {
      const check = document.createElement("span");
      check.className = "sel-check";
      check.textContent = "✅";
      check.style.cssText =
        "position:absolute;top:-6px;right:-6px;font-size:20px;z-index:5";
      card.style.position = "relative";
      card.appendChild(check);
    }
  }

  state.selectedTemplate = name;

  // El panel de "Datos del agente" solo aplica a Reconocimiento y Constancia,
  // no al DC-3 (que no lleva STPS ni director en su layout)
  const panel = document.getElementById("agentConfigPanel");
  if (panel) {
    const requiereAgente = name !== "dc3";
    panel.style.display = requiereAgente ? "" : "none";
  }

  detectarCampos(name).then((campos) => {
    state.camposDisponibles = campos;
    construirMapeo();
    document.getElementById("step3").style.display = "block";
    document.getElementById("step3").scrollIntoView({ behavior: "smooth" });
  });
}

// Inicializar categorías al cargar
document.addEventListener("DOMContentLoaded", renderTemplateCategories);

async function detectarCampos(templateName) {
  try {
    const res = await fetch(`/api/plantilla/${templateName}`);
    const data = await res.json();
    if (data.html) {
      // Buscar {{campo}} en el HTML
      const matches = [...data.html.matchAll(/\{\{(\w+)\}\}/g)];
      const campos = [...new Set(matches.map((m) => m[1]))];
      // Filtrar campos que no son del certificado (fecha_hoy, año)
      return campos.filter((c) => !["fecha_hoy", "año"].includes(c));
    }
  } catch (e) {
    console.error("Error detectando campos:", e);
  }
  return CAMPOS_CERT.map((c) => c.key);
}

// ─── Step 3: Mapear columnas ───
function construirMapeo() {
  const table = document.getElementById("mappingTable");
  table.innerHTML = "";
  const headers = state.excelData.headers;

  // Solo mostrar campos que la plantilla usa
  const camposAMostrar =
    state.camposDisponibles.length > 0
      ? CAMPOS_CERT.filter((c) => state.camposDisponibles.includes(c.key))
      : CAMPOS_CERT;

  camposAMostrar.forEach((campo) => {
    const row = document.createElement("div");
    row.className = "mapping-row";

    const label = document.createElement("div");
    label.className = "mapping-label";
    label.innerHTML = `${campo.label} ${campo.required ? '<span style="color:#dc2626">*</span>' : ""}`;

    const arrow = document.createElement("div");
    arrow.className = "mapping-arrow";
    arrow.textContent = "→";

    const select = document.createElement("select");
    select.className = "mapping-select";
    select.dataset.campo = campo.key;

    const optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "-- Seleccionar columna --";
    select.appendChild(optNone);

    headers.forEach((h, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = h || `Columna ${i + 1}`;
      select.appendChild(opt);
    });

    // Auto-detect: normalizar header y campo para matching
    const normalize = (s) => s.toLowerCase().replace(/[_\s-]+/g, " ");
    const campoNorm = normalize(campo.key);
    const matchIdx = headers.findIndex(
      (h) => h && normalize(h).includes(campoNorm),
    );
    if (matchIdx >= 0) {
      select.value = matchIdx;
      state.mapping[campo.key] = matchIdx;
    }

    select.addEventListener("change", () => {
      if (select.value === "") {
        delete state.mapping[campo.key];
      } else {
        state.mapping[campo.key] = parseInt(select.value);
      }
    });

    row.appendChild(label);
    row.appendChild(arrow);
    row.appendChild(select);
    table.appendChild(row);
  });

  // Mostrar step 4
  document.getElementById("step4").style.display = "block";
  actualizarResumen();

  // El mapeo queda colapsado; el badge muestra que se hizo auto
  document.getElementById("mappingBadge").textContent = "✔ Mapeo automático";
  document.getElementById("mappingBody").style.display = "none";
  const btn = document.getElementById("btnToggleMapping");
  if (btn) btn.innerHTML = "Ajustar mapeo ▾";
}

function actualizarResumen() {
  const summary = document.getElementById("generateSummary");
  const count = state.excelData.total;

  // Validar CURP y RFC en todos los datos
  const headers = state.excelData.headers;
  const curpCol = headers.findIndex((h) => h && /curp/i.test(h));
  const rfcCol = headers.findIndex((h) => h && /rfc/i.test(h));
  const nombreCol = headers.findIndex((h) => h && /nombre/i.test(h));

  let curpOk = 0,
    curpBad = 0,
    rfcOk = 0,
    rfcBad = 0;
  let errores = [];

  state.excelData.rows.forEach((row, idx) => {
    let nombre =
      nombreCol >= 0 ? row[nombreCol] || `Fila ${idx + 1}` : `Fila ${idx + 1}`;
    let rowErrors = [];

    if (curpCol >= 0) {
      const v = validarCURP(row[curpCol] || "");
      if (v.ok) curpOk++;
      else {
        curpBad++;
        rowErrors.push(`CURP: ${v.msg}`);
      }
    }
    if (rfcCol >= 0) {
      const v = validarRFC(row[rfcCol] || "");
      if (v.ok) rfcOk++;
      else {
        rfcBad++;
        rowErrors.push(`RFC: ${v.msg}`);
      }
    }
    if (rowErrors.length > 0) {
      errores.push({ nombre, errors: rowErrors, idx: idx + 1 });
    }
  });

  // Validación resumen
  let validacionHtml = "";
  if (curpCol >= 0 || rfcCol >= 0) {
    const hasErrors = errores.length > 0;
    validacionHtml = `<div class="summary-section" style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0">`;

    if (curpCol >= 0) {
      validacionHtml += `<div class="summary-row">
                <span class="summary-label">CURP ${curpBad > 0 ? "❌" : "✅"}</span>
                <span class="summary-value">${curpOk} válidos${curpBad > 0 ? ` · ${curpBad} inválidos` : ""}</span>
            </div>`;
    }
    if (rfcCol >= 0) {
      validacionHtml += `<div class="summary-row">
                <span class="summary-label">RFC ${rfcBad > 0 ? "🟠" : "🟢"}</span>
                <span class="summary-value">${rfcOk} válidos${rfcBad > 0 ? ` · ${rfcBad} inválidos` : ""}</span>
            </div>`;
    }

    // Lista detallada de errores
    if (hasErrors) {
      // Pre-armar texto plano para el botón "Copiar"
      const erroresTexto = errores
        .map((e) => `${e.nombre}: ${e.errors.join(", ")}`)
        .join("\n");

      validacionHtml += `<div style="margin-top:6px;padding:6px 10px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                    <strong style="font-size:12px;color:#991b1b">⚠️ Errores de validación</strong>
                    <button type="button" class="btn-copy-errores" data-errores="${encodeURIComponent(erroresTexto)}"
                            title="Copiar lista al portapapeles"
                            style="font-size:10px;padding:2px 8px;border:1px solid #fca5a5;background:#fff;color:#991b1b;border-radius:4px;cursor:pointer;font-family:inherit">
                        📋 Copiar
                    </button>
                </div>
                <ul style="margin:4px 0 0 0;padding-left:16px;font-size:11px;color:#7f1d1d">`;
      errores.forEach((e) => {
        validacionHtml += `<li><strong>${e.nombre}</strong>: ${e.errors.join(", ")}</li>`;
      });
      validacionHtml += `</ul></div>`;
    }

    validacionHtml += `</div>`;
  }

  // Opciones DC-3: representante legal + checkbox >50 trabajadores
  let dc3Options = "";
  if (state.selectedTemplate === "dc3") {
    dc3Options = `
        <div class="summary-section" style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0">
            <div class="summary-row">
                <span class="summary-label">👤 Agente capacitador (DC-3)</span>
                <span class="summary-value">
                    <input type="text" id="cfgAgenteCapacitador" placeholder="Ing. Hugo Juárez Vite"
                           style="border:1px solid #cbd5e1;border-radius:6px;padding:4px 8px;font-size:12px;width:200px"
                           value="Ing. Hugo Juárez Vite">
                </span>
            </div>
            <div class="summary-row">
                <span class="summary-label">✍️ Firma del Instructor</span>
                <span class="summary-value">
                    <input type="file" id="fileFirmaLegal" accept="image/*"
                           style="font-size:11px;width:200px">
                    <span id="firmaLegalName" style="font-size:10px;color:#666;margin-left:4px"></span>
                </span>
            </div>
            <div style="border-top:1px solid #e2e8f0;margin:6px 0"></div>
            <div class="summary-row">
                <span class="summary-label">👥 ¿Más de 50 trabajadores?</span>
                <span class="summary-value">
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px">
                        <input type="checkbox" id="chkRepTrabajadores" onchange="toggleRepTrabajadores(this)">
                        Sí, incluir datos del representante de los trabajadores
                    </label>
                </span>
            </div>
            <div id="repTrabajadoresFields" style="margin-top:6px;padding:6px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">
                <div style="display:flex;flex-direction:column;gap:4px">
                    <div>
                        <label style="font-size:11px;color:#666">Nombre del representante:</label>
                        <input type="text" id="inputRepTrabajadores" placeholder="Nombre del representante"
                               style="width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:4px 8px;font-size:12px"
                               disabled>
                    </div>
                    <div>
                        <label style="font-size:11px;color:#666">Firma del representante:</label>
                        <input type="file" id="fileFirmaTrabajadores" accept="image/*" disabled
                               style="font-size:11px">
                        <span id="firmaTrabName" style="font-size:10px;color:#666;margin-left:4px"></span>
                    </div>
                </div>
            </div>
        </div>`;
  }

  summary.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Plantilla</span>
            <span class="summary-value">${state.selectedTemplate.replace(/_/g, " ")}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Total de certificados</span>
            <span class="summary-value">${count}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Campos mapeados</span>
            <span class="summary-value">${Object.keys(state.mapping).length}</span>
        </div>
        ${validacionHtml}
        ${dc3Options}
    `;
  document.getElementById("genCount").textContent = count;
}

// ─── Toggle representante de trabajadores ───
function toggleRepTrabajadores(checkbox) {
  const enabled = checkbox.checked;
  document.getElementById("inputRepTrabajadores").disabled = !enabled;
  document.getElementById("fileFirmaTrabajadores").disabled = !enabled;
}

// ─── Controles de modo generación ───
function onGenModeChange() {
  const mode = document.querySelector('input[name="genMode"]:checked')?.value;
  document.getElementById("genCountInput").disabled = mode !== "first";
  document.getElementById("genFromInput").disabled = mode !== "from";
  actualizarGenCount();
}

function getGenRange() {
  const total = state.excelData?.total || 0;
  const mode = document.querySelector('input[name="genMode"]:checked')?.value || "all";
  const count = parseInt(document.getElementById("genCountInput")?.value || "5");
  const from = parseInt(document.getElementById("genFromInput")?.value || "1");

  let start_row = 0;
  let gen_count = 0;

  switch (mode) {
    case "first":
      start_row = 0;
      gen_count = Math.min(count, total);
      break;
    case "from":
      start_row = Math.max(0, from - 1);
      gen_count = 0;
      break;
    default: // all
      start_row = 0;
      gen_count = 0;
  }
  return { start_row, count: gen_count, mode };
}

function actualizarGenCount() {
  const total = state.excelData?.total || 0;
  const { start_row, count, mode } = getGenRange();
  let show = total;
  if (mode === "first") show = Math.min(count, total);
  else if (mode === "from") show = total - start_row;
  document.getElementById("genCount").textContent = show;
}

// ─── Preview ───
document.getElementById("btnPreview").addEventListener("click", async () => {
  // Validar campos requeridos
  const requiredFields = CAMPOS_CERT.filter(
    (c) => c.required && state.camposDisponibles.includes(c.key),
  );
  for (const field of requiredFields) {
    if (state.mapping[field.key] === undefined) {
      alert(`Falta mapear: ${field.label}`);
      return;
    }
  }

  const modal = document.getElementById("previewModal");
  const loading = document.getElementById("previewLoading");
  const frame = document.getElementById("previewFrame");

  modal.style.display = "flex";
  loading.style.display = "block";
  frame.style.display = "none";

  // Usar primera fila de datos
  const primeraFila = state.excelData.rows[0];
  const datos = {};
  for (const [campo, colIdx] of Object.entries(state.mapping)) {
    datos[campo] = primeraFila[colIdx] || "";
  }

  try {
    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plantilla: state.selectedTemplate,
        fila: datos,
        config: getAgentConfig(),
      }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      frame.src = url;
      frame.style.display = "block";
      loading.style.display = "none";
    } else {
      const err = await res.json();
      loading.textContent = "Error: " + err.error;
    }
  } catch (e) {
    loading.textContent = "Error: " + e.message;
  }
});

function closePreview() {
  document.getElementById("previewModal").style.display = "none";
}

// ─── Step 4: Generar ───
document.getElementById("btnGenerate").addEventListener("click", async () => {
  // Validar campos requeridos
  const requiredFields = CAMPOS_CERT.filter(
    (c) => c.required && state.camposDisponibles.includes(c.key),
  );
  for (const field of requiredFields) {
    if (state.mapping[field.key] === undefined) {
      alert(`Falta mapear: ${field.label}`);
      return;
    }
  }

  // Leer archivos de firma como base64
  async function readFileAsDataURL(input) {
    if (!input || !input.files || !input.files[0]) return "";
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(input.files[0]);
    });
  }
  const firmaLegalData = await readFileAsDataURL(
    document.getElementById("fileFirmaLegal"),
  );
  const firmaTrabData = await readFileAsDataURL(
    document.getElementById("fileFirmaTrabajadores"),
  );

  // Construir filas con datos mapeados
  const filas = state.excelData.rows.map((row) => {
    const datos = {};
    for (const [campo, colIdx] of Object.entries(state.mapping)) {
      datos[campo] = row[colIdx] || "";
    }
    // Inyectar opciones DC-3 si aplica
    if (state.selectedTemplate === "dc3") {
      const chkRep = document.getElementById("chkRepTrabajadores");
      datos["firma_instructor"] = firmaLegalData || "";
      datos["representante_trabajadores"] =
        chkRep && chkRep.checked
          ? document.getElementById("inputRepTrabajadores")?.value ||
            "Representante"
          : "";
      datos["firma_trabajadores"] =
        chkRep && chkRep.checked ? firmaTrabData : "";
    }
    return datos;
  });

  // Obtener rango de generación
  const { start_row, count } = getGenRange();

  // Enviar a generar
  fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plantilla: state.selectedTemplate,
      filas: filas,
      start_row: start_row,
      count: count,
      mapeo: state.mapping,
      tmp_path: state.excelData.tmp_path,
      config: getAgentConfig(),
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }
      // Mostrar progreso
      document.getElementById("step4").style.display = "none";
      document.getElementById("stepProgress").style.display = "block";
      document.getElementById("progressTotal").textContent = data.total;
      document
        .getElementById("stepProgress")
        .scrollIntoView({ behavior: "smooth" });
      iniciarProgreso();
    });
});

// ─── Progress SSE ───
function iniciarProgreso() {
  const fill = document.getElementById("progressFill");
  const done = document.getElementById("progressDone");
  const current = document.getElementById("progressCurrent");
  const timeEl = document.getElementById("progressTime");
  const actions = document.getElementById("progressActions");
  const badge = document.getElementById("statusBadge");

  badge.className = "status-badge running";
  badge.textContent = "Generando...";

  const evtSource = new EventSource("/api/progress");
  const startTime = Date.now();

  evtSource.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (data.total > 0) {
      const pct = (data.completed / data.total) * 100;
      fill.style.width = pct + "%";
      done.textContent = data.completed;
    }
    current.textContent = data.current_name
      ? `Procesando: ${data.current_name}`
      : "";
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timeEl.textContent = `Tiempo: ${elapsed}s`;

    if (data.status === "done") {
      fill.style.width = "100%";
      done.textContent = data.total;
      current.textContent = "✅ Completado";
      actions.style.display = "flex";
      badge.className = "status-badge";
      badge.textContent = "Listo";
      evtSource.close();

      // Mostrar filas con error
      if (data.failed_rows && data.failed_rows.length > 0) {
        const container = document.getElementById("failedRowsContainer");
        const list = document.getElementById("failedRowsList");
        container.style.display = "block";
        list.innerHTML = data.failed_rows.map(
          (f) => `<div style="padding:2px 0"><strong>Fila ${f.row}</strong> — ${f.nombre}: ${f.error}</div>`
        ).join("");
      }
    } else if (data.status === "error") {
      current.textContent = "❌ Error: " + data.error;
      badge.className = "status-badge error";
      badge.textContent = "Error";
      evtSource.close();
    }
  };
}

// ─── Post-generación ───
document.getElementById("btnDownload").addEventListener("click", () => {
  window.location.href = "/api/download";
});

document.getElementById("btnOpenFolder").addEventListener("click", async () => {
  const res = await fetch("/api/open-folder");
  const data = await res.json();
  if (data.error) alert("Error: " + data.error);
});

document.getElementById("btnRestart").addEventListener("click", () => {
  location.reload();
});

// ─── Botón "Copiar" lista de errores de validación ───
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-copy-errores");
  if (!btn) return;

  const texto = decodeURIComponent(btn.dataset.errores || "");

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
    } else {
      // Fallback para contextos no seguros (http://127.0.0.1 funciona,
      // pero por si acaso)
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    const original = btn.textContent;
    btn.textContent = "✓ Copiado";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1500);
  } catch (err) {
    console.error("Error al copiar:", err);
    btn.textContent = "❌ Error";
    setTimeout(() => {
      btn.textContent = "📋 Copiar";
    }, 1500);
  }
});

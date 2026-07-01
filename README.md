# Generador de Certificados / Reconocimientos / DC-3 — AGASI

App local (Flask + Playwright) que genera **cientos de PDFs** (DC-3, reconocimientos, constancias) a partir de un Excel con la lista de participantes.

> **Diseñado para uso interno de AGASI** (~3 usuarios). No requiere internet, no requiere base de datos, no requiere login. Todo corre en la máquina local.

---

## 🧠 Flujo del programa

1. **Subes un Excel** con los datos de los participantes.
2. **Eliges la plantilla** (DC-3, Reconocimiento, Constancia).
3. **Mapeas columnas** del Excel a los campos del certificado (auto-detecta por nombre).
4. **Configuras el agente capacitador** (STPS, director, firma) en el panel ⚙️ del paso 4.
5. **Previsualizas** con la primera fila.
6. **Generas** — puedes elegir: Todos / Primeros N / Desde fila N.
7. La app genera los PDFs en segundo plano, mostrando progreso en vivo. Si alguna fila falla, la salta y reporta cuáles fallaron al final.
8. Al terminar: descargas ZIP o abres la carpeta.

---

## 🚀 Inicio rápido

### Si ya tienes el ejecutable (.exe / binario)

**Windows:** doble click en `GeneradorAGASI.exe`. Se abre el navegador solo.
**Linux:** `./GeneradorAGASI` desde terminal.

### Si quieres correrlo en modo desarrollo

**Linux:**
```bash
cd "Generador reconocimientos"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python app.py
```

**Windows:**
```bat
cd "Generador reconocimientos"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
python app.py
```

Se abre automáticamente en `http://127.0.0.1:8765`.

### Si quieres generar el .exe

Ver [`BUILD.md`](./BUILD.md) — incluye instrucciones para Linux local, Windows local, y **GitHub Actions** (compilar el `.exe` sin tener Windows propio).

---

## 📋 Uso típico

1. **Sube tu Excel** — arrastra el archivo o haz clic en la zona de carga. Si no tienes, descarga una plantilla con los botones de la UI.
2. **Elige plantilla** — DC-3, Reconocimiento, Constancia, etc.
3. **Mapea columnas** — la app intenta auto-mapear por nombre de columna. Puedes ajustarlo manualmente.
4. **Configura el agente capacitador** (paso 4, botón ⚙️):
   - **Registro STPS** — número de registro oficial (default: `JUVH8204083R3-005`)
   - **Director General** — nombre y puesto (default: `Ing. Hugo Juárez Vite`)
   - **Firma del instructor** — sube la imagen PNG de la firma
5. **Si elegiste DC-3**, aparecen opciones extra:
   - **Agente capacitador (STPS)** — texto editable para el campo "Nombre del agente capacitador" del DC-3
   - **Firma del instructor** — también disponible aquí
   - **¿Más de 50 trabajadores?** — checkbox para habilitar datos del representante de los trabajadores
6. **Elige modo de generación**: Todos | Primeros N | Desde fila N
7. **Previsualiza** con la primera fila (botón 👁️).
8. **Genera** — los PDFs quedan en `output/batch_YYYYMMDD_HHMMSS/`. Cuando termina puedes descargar ZIP o abrir la carpeta.

### Control de errores

Si alguna fila falla al generar (ej. Playwright crashea, imagen no encontrada), la app **la salta y sigue con las demás**. Al terminar muestra un panel rojo con las filas que fallaron y el error. No se pierde el lote completo.

### Validación de Excel

Si tu Excel tiene CURPs/RFCs inválidos, la caja de "Errores de validación" muestra cada fila con su problema. El botón **"📋 Copiar"** copia la lista al portapapeles, listo para pegar en WhatsApp/email.

---

## 📁 Estructura del proyecto

```
Generador reconocimientos/
├── app.py                          # Servidor Flask principal (entry point)
├── requirements.txt                # Flask, openpyxl, playwright
├── templates/index.html            # UI web
├── static/                         # CSS, JS, excels de ejemplo
├── plantillas/                     # HTML de cada tipo de certificado
│   ├── dc3.html                    # DC-3 formato STPS
│   ├── reconocimiento_clasico.html
│   ├── reconocimiento_moderno.html
│   ├── constancia.html             # + otros estilos (ribbon, marco, geométrico)
├── firmas/                         # Logos PNG de AGASI
├── "Logos agente capacitador"/     # Logos de agentes
├── assets/                         # Iconos + AGASI.png para reconocimientos
├── output/                         # PDFs generados (auto-creado)
├── scripts/                        # Lanzadores .sh / .bat
├── build.spec                      # Config PyInstaller
├── build_linux.sh                  # Build local Linux
├── build_windows.bat               # Build local Windows
├── BUILD.md                        # 📖 Cómo compilar a .exe + GitHub Actions
├── .github/workflows/              # 🤖 Build automático en GitHub
└── README.md                       # Este archivo
```

---

## 🎨 Plantillas personalizadas

Crea un `.html` en `plantillas/` con placeholders `{{campo}}` que se reemplazan al generar:

```html
<div class="nombre">{{nombre}}</div>
<div class="curso">{{curso}}</div>
<div class="fecha">{{fecha_hoy}}</div>
```

### Campos disponibles

| Placeholder | Descripción | Plantilla |
|------------|-------------|-----------|
| `{{nombre}}` | Nombre del participante | Todas |
| `{{curso}}` | Nombre del curso | Todas |
| `{{duracion}}` | Duración en horas | Todas |
| `{{fecha}}` | Fecha de conclusión | Reconocimiento, Constancia |
| `{{fecha_ini}}` | Fecha inicio (dd/mm/aaaa) | DC-3 |
| `{{fecha_fin}}` | Fecha fin (dd/mm/aaaa) | DC-3 |
| `{{fecha_ini_dia_0}}`..`{{fecha_ini_dia_1}}` | Día desglosado (2 chars) | DC-3 |
| `{{fecha_ini_mes_0}}`..`{{fecha_ini_mes_1}}` | Mes desglosado (2 chars) | DC-3 |
| `{{fecha_ini_año_0}}`..`{{fecha_ini_año_3}}` | Año desglosado (4 chars) | DC-3 |
| `{{fecha_fin_*}}` | Igual pero para fecha fin | DC-3 |
| `{{instructor}}` | Nombre del instructor (del Excel) | Todas |
| `{{director_nombre}}` | Nombre del director (configurable en UI) | Todas |
| `{{director_puesto}}` | Puesto del director (configurable en UI) | Todas |
| `{{agente_capacitador}}` | Agente capacitador (solo DC-3, configurable en opciones) | DC-3 |
| `{{reg_stps}}` | Registro STPS (configurable en UI) | DC-3 |
| `{{firma_instructor}}` | Firma del instructor (subida desde UI) | Todas |
| `{{representante_legal}}` | Representante legal (del Excel o UI) | DC-3 |
| `{{firma_representante}}` | Firma del representante legal (del Excel) | DC-3 |
| `{{representante_trabajadores}}` | Representante de trabajadores (solo >50 empleados) | DC-3 |
| `{{firma_trabajadores}}` | Firma del rep. de trabajadores (subida desde UI) | DC-3 |
| `{{lugar}}` | Lugar de expedición | Reconocimiento |
| `{{empresa}}` | Razón social de la empresa | DC-3 |
| `{{rfc}}` | RFC de la empresa (12-13 chars) | DC-3 |
| `{{puesto}}` | Puesto del participante | DC-3 |
| `{{ocupacion}}` | Ocupación (catálogo CNO) | DC-3 |
| `{{area_tematica}}` | Código + nombre del área | DC-3 |
| `{{curp}}` | CURP completa (18 chars) | DC-3 |
| `{{curp_0}}`..`{{curp_17}}` | CURP letra por letra | DC-3 |
| `{{folio}}` | Folio único (auto si vacío) | Todas |
| `{{fecha_hoy}}` | Fecha actual (auto) | Todas |
| `{{año}}` | Año actual (auto) | Todas |

La app detecta automáticamente qué campos usa tu plantilla y te muestra los inputs correctos en la UI.

### Plantillas especiales DC-3 (formato STPS)

La DC-3 oficial usa los caracteres individuales (`{{curp_0}}`..`{{curp_17}}`, `{{fecha_ini_dia_0}}` etc.) para rellenar cajitas pre-impresas en el PDF. **No cambies la plantilla DC-3 a menos que sepas exactamente lo que haces** — esos campos son requisito del formato STPS.

---

## 📦 Formato del Excel

### Reconocimiento (7 columnas)
| Nombre Completo | Curso | Duracion (hrs) | Fecha | Instructor | Lugar | Folio |
|----------------|-------|----------------|-------|-----------|-------|-------|
| López Hernández María Fernanda | Seguridad Industrial | 40 | 15/06/2026 | Ing. Roberto Martínez | Pachuca, Hidalgo | (vacío → auto) |

### DC-3 (13 columnas)
| Nombre | CURP | Ocupacion | Puesto | Empresa | RFC | Curso | Duracion | Fecha Inicio | Fecha Fin | Area Tematica | Instructor | Folio |
|--------|------|-----------|--------|---------|-----|-------|----------|--------------|-----------|---------------|-----------|-------|
| López Hernández María Fernanda | LOHF900215HGPLRR09 | 09.4 Protección | Supervisor | Industrias Peoles | IPE850101AB1 | Seguridad Industrial | 40 | 01/06/2026 | 15/06/2026 | 6000 Seguridad | Ing. Roberto Martínez | (vacío → auto) |

**Validaciones automáticas:**
- CURP debe tener exactamente 18 caracteres
- RFC (de la empresa) debe tener 12 caracteres (Persona Moral) o 13 (Física)
- Los errores se muestran en pantalla con un botón para copiarlos todos al portapapeles

**Folio:** si lo dejas vacío, la app asigna uno automático (`DC3-001`, `AG-001`, `CT-001` según el tipo). Si lo llenas, respeta tu valor.

---

## ✍️ Firmas

Las firmas se **suben desde la UI** en cada lote — no requieren archivos en `firmas/`.

### Reconocimientos y Constancias

Una sola firma (centrada) que usa:
- **Nombre:** `{{director_nombre}}` (del panel ⚙️ Datos del agente capacitador)
- **Imagen:** se sube desde el mismo panel (botón ⚙️ → "Firma del instructor")

### DC-3 (tres espacios de firma)

1. **Instructor** — nombre `{{instructor}}` del Excel, firma se sube desde opciones DC-3
2. **Patrón o representante legal** — nombre `{{representante_legal}}` del Excel, firma `{{firma_representante}}` también del Excel
3. **Representante de los trabajadores** — solo si la empresa tiene >50 empleados (checkbox en opciones DC-3). Se ingresa nombre y se sube la firma desde la UI

Si una firma no se sube, el espacio se oculta automáticamente (el `<img>` tiene un `onerror` que lo esconde).

---

## 🔌 API interna (para integraciones)

La app expone algunos endpoints JSON por si quieres integrarla con otro sistema:

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/plantilla-excel/dc3` | GET | Descarga plantilla DC-3 (.xlsx) |
| `/api/plantilla-excel/reconocimiento` | GET | Descarga plantilla Reconocimiento |
| `/api/plantilla-excel/constancia` | GET | Descarga plantilla Constancia |
| `/api/upload` | POST | Recibe Excel (`multipart/form-data`, campo `file`) |
| `/api/preview` | POST | Genera PDF preview de 1 fila |
| `/api/generate` | POST | Inicia generación masiva (background) |
| `/api/progress` | GET (SSE) | Stream de progreso en tiempo real |
| `/api/download` | GET | Descarga ZIP con todos los PDFs |
| `/api/open-folder` | GET | Abre la carpeta de output en el explorador |

---

## 🛠️ Stack técnico

- **Python 3.11+** + **Flask 3.0** — servidor web local
- **openpyxl 3.1+** — lectura de Excel
- **Playwright 1.40+** + Chromium — render HTML → PDF (pixel-perfect)
- **PyInstaller 6.0+** — empaquetado en .exe / binario standalone
- Sin internet, sin base de datos, sin login
- Estado del batch en memoria (se pierde al cerrar la app, pero los PDFs ya generados quedan en `output/`)

---

## 📌 Tareas comunes

- **Compilar el `.exe`:** ver [`BUILD.md`](./BUILD.md)
- **Cambiar el logo:** reemplazar `AG_Principal.png`, `assets/AGASI.png`, y regenerar iconos (ver Iconos en `BUILD.md`)
- **Agregar un campo nuevo a las plantillas:** agregar el `{{placeholder}}` en el HTML + actualizar `PLANTILLAS_EXCEL` en `app.py`
- **Personalizar la UI:** editar `templates/index.html` + `static/app.js` + `static/style.css`
- **Actualizar defaults del agente:** editar `getAgentConfig()` en `static/app.js` (líneas ~51-63)
- **Agregar opción DC-3:** editar `static/app.js` dentro del bloque `if (state.selectedTemplate === "dc3")` (~lín. 595-623)
- **Las firmas subidas van a base64 inline** — no se guardan en disco, viajan en el JSON al backend

---

## 🐛 Reportar bugs

Si algo no jala, anota:
1. Qué plantilla usaste (DC-3 / Reconocimiento / Constancia)
2. Qué hiciste paso a paso
3. Qué error salió (screenshot de la consola del navegador o de la terminal donde corre la app)
4. Tu sistema operativo + versión de Python (solo si corres en modo dev)

Para DC-3, los errores de validación ahora son copiables al portapapeles con un botón — pégalo en el reporte.

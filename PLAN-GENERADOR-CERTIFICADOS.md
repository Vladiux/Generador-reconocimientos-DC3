# Plan — Generador de Certificados / Reconocimientos / DC3

> App local para AGASI Capacitadora.
> Genera lotes masivos desde Excel, con plantillas editables y firmas automáticas.

---

## 1. ¿Qué va a hacer?

| Funcionalidad | Descripción |
|--------------|-------------|
| 📥 **Subir lista** | Carga Excel/CSV con participantes |
| 🎨 **Elegir plantilla** | Reconocimiento, DC3 o Constancia |
| 🔗 **Mapear columnas** | Nombre → {nombre}, Curso → {curso}, etc. |
| 👁️ **Vista previa** | Muestra cómo se ve con datos de muestra |
| ⚡ **Generar lote** | 30, 100, 400 certificados en segundos |
| 📦 **Descargar** | ZIP individual o todos juntos |
| ✍️ **Firmas auto** | Firma del instructor/director superpuesta |

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────┐
│  app.py  (punto de entrada)                      │
│  python app.py → http://localhost:8765           │
│                                                  │
│  ┌──────────────┐   ┌─────────────────────────┐  │
│  │ Servidor web  │   │ Motor de PDF            │  │
│  │ local (litestar│   │ (Playwright/Chromium)   │  │
│  │ o flask)      │   │                         │  │
│  │               │   │ HTML + CSS → PDF exacto │  │
│  │ - Subir Excel │   │ - Plantillas .html      │  │
│  │ - Preview     │   │ - Firmas overlay        │  │
│  │ - Progreso    │   │ - Batch processing      │  │
│  └──────────────┘   └─────────────────────────┘  │
│                                                  │
│  📁 /plantillas/   📁 /static/   📁 /output/    │
└─────────────────────────────────────────────────┘
```

### "¿Por qué un servidor si es local?"

Así funciona **Syncthing, Jupyter, VS Code Server, Home Assistant** — todos levantan un servidor web local. No es un "backend en la nube", es un proceso Python que:

1. Arranca con `python app.py`
2. Abre tu navegador solo
3. Sirve la interfaz en `localhost:8765`
4. Cuando cierras la terminal, se muere

**Sin servidor no hay interfaz web.** Necesitas algo que reciba el Excel, lo procese y te muestre el resultado. Eso es un servidor HTTP local.

### Alternativa más simple: Flask (sin FastAPI)

Flask es más ligero que FastAPI y para esto sobra:

```python
from flask import Flask, render_template, request
app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    # Subir Excel, mostrar preview, generar
    return render_template("index.html")
```

4 rutas, sin async, sin schemas, sin base de datos. **Menos archivos, menos complejidad.**

---

## 3. Motor de PDF: Playwright (no WeasyPrint)

| Aspecto | WeasyPrint | Playwright 🏆 |
|---------|-----------|---------------|
| **Pixel perfect** | ❌ Fondos en @page no jalaban | ✅ Renderiza como Chrome |
| **Imágenes** | 😬 Daba lata en AGASI | ✅ Sin problemas |
| **Posicionamiento** | CSS limitado en PDF | ✅ Flex, Grid, absolute, todo |
| **Calidad** | Buena | ✅ **Excelente** (pinta el DOM) |
| **Instalación local** | pip install | pip install + playwright install chromium |
| **Velocidad por cert** | Rápido | Similar (~0.3-0.5s x cert) |

**Batch de 400 certificados:**
- Playwright abre Chromium **una vez**
- Renderiza 400 páginas en ~2-3 minutos
- Guarda cada PDF individual
- Todo en paralelo (hasta 4-8 simultáneos)

---

## 4. Estructura del proyecto

```
📁 generador-certificados/
│
├── app.py                    ← Punto de entrada (Flask + Playwright)
├── requirements.txt          ← Dependencias
├── README.md                 ← Instrucciones
│
├── static/
│   ├── style.css             ← Estilos de la interfaz
│   ├── app.js                ← Lógica del frontend
│   └── icono.png             ← Ícono de la app
│
├── templates/
│   ├── index.html            ← Página principal (subir Excel)
│   ├── preview.html          ← Vista previa
│   └── progress.html         ← Barra de progreso
│
├── plantillas/
│   ├── reconocimiento.html   ← Plantilla Canva-style
│   ├── dc3.html              ← Plantilla DC3
│   └── constancia.html       ← Plantilla simple
│
├── firmas/
│   ├── instructor.png        ← Firma escaneada 1
│   └── director.png          ← Firma escaneada 2
│
├── output/                   ← Aquí caen los PDFs generados
│
├── scripts/
│   ├── iniciar.bat           ← Windows: doble click
│   └── iniciar.sh            ← Linux: doble click
│
└── instalador/
    └── generador.desktop     ← Acceso directo Linux
```

---

## 5. Flujo de uso (pantallas)

### Pantalla 1: Cargar Excel
```
┌─────────────────────────────────────────────┐
│  🔖 GENERADOR DE CERTIFICADOS AGASI         │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  📂 Arrastra tu Excel aquí          │    │
│  │  o haz click para seleccionar       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Plantilla: [Reconocimiento ▼]              │
│                                             │
│  [Previsualizar →]                          │
└─────────────────────────────────────────────┘
```

### Pantalla 2: Mapeo + Preview
```
┌─────────────────────────────────────────────┐
│  Columna Excel    → Campo del certificado   │
│  ─────────────────────────────────────────── │
│  Nombre completo  →  {nombre}        [✓]   │
│  Curso            →  {curso}         [✓]   │
│  Fecha            →  {fecha}         [✓]   │
│  Calificación     →  {calificacion}  [✓]   │
│  Folio            →  {folio}         [✓]   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  👁️ VISTA PREVIA                    │    │
│  │  [certificado de muestra]           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [⬇️ Generar 247 certificados]             │
└─────────────────────────────────────────────┘
```

### Pantalla 3: Progreso
```
┌─────────────────────────────────────────────┐
│  ⚡ Generando...                               │
│                                             │
│  ████████████░░░░░░░░░░  127/247            │
│                                             │
│  Último: María López Hernández ✓            │
│                                             │
│  Tiempo: 12 segundos                        │
│                                             │
│  [📁 Abrir carpeta]  [⏹️ Cancelar]          │
└─────────────────────────────────────────────┘
```

---

## 6. Tecnologías definitivas

| Componente | Tecnología | ¿Por qué? |
|-----------|-----------|-----------|
| **Servidor web** | Flask | Más simple que FastAPI para esto, 4 rutas |
| **Frontend** | HTML + CSS + JS vanilla | Sin framework, sin build, sin npm |
| **PDF engine** | Playwright (Chromium) | Pixel perfect, sin bugs de WeasyPrint |
| **Excel** | openpyxl | Lee/escribe .xlsx nativo |
| **UI components** | Nada extra | Bootstrap desde CDN o CSS plain |
| **Empaquetado** | PyInstaller | .exe portable (~80MB) |
| **Ventana nativa** | pywebview | Fase 2 — sin cambiar código |

---

## 7. Plan de construcción

| Fase | Qué incluye | Tiempo |
|------|------------|--------|
| **Fase 1: Core** 🚀 | app.py funcional, subir Excel, mapear, generar PDF con Playwright, descargar ZIP | **Hoy** |
| **Fase 2: Plantillas** 🎨 | 3 plantillas (reconocimiento, DC3, constancia), firmas automáticas, vista previa | +1 día |
| **Fase 3: UX** ✨ | Barra de progreso real, drag & drop Excel, interfaz bonita | +1 día |
| **Fase 4: Empaquetado** 📦 | PyInstaller .exe, .desktop, icono, acceso directo | +1 día |
| **Fase 5: Ventana** 🪟 | pywebview para que no se vea el navegador | +½ día |

---

## 8. Lo que NO va a tener (por ahora)

- ❌ Editor Canva drag & drop — eso es para después
- ❌ Base de datos — todo es archivo, nada persistente
- ❌ Login/usuarios — 3 usuarios de confianza, se pasan el programa
- ❌ Conexión a internet — 100% local
- ❌ OCR de PDFs escaneados — mejor que suban Excel

---

## 9. ¿Cómo se usa finalmente?

```
Linux:
  1. Doble click en "Iniciar Generador"
  2. Se abre http://localhost:8765 en tu navegador
  3. Arrastras tu Excel
  4. Seleccionas plantilla
  5. ¡A generar!
  6. Ctrl+C para salir

Windows (después de empaquetar):
  1. Doble click en "Generador AGASI.exe"
  2. Se abre el navegador solo
  3. Mismo flujo

Con pywebview (después):
  1. Doble click → se abre ventanita nativa
  2. Sin navegador, sin barra de direcciones
  3. Se ve como programa de verdad
```

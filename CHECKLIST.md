# ✅ Checklist — Generador de Certificados AGASI

> Proyecto: App local para generar Certificados, Reconocimientos y DC-3.
> Estado actual: **Fase 1 completa** — Core funcional con DC-3 al 100%.
> Siguiente: Plantillas adicionales + empaquetado de escritorio.

---

## 🔴 PRIORIDAD 1: Plantillas adicionales

### Reconocimiento
- [ ] **Diseño horizontal** con marco ornamental (estilo diploma)
- [ ] Placeholders: `{{nombre}}`, `{{curso}}`, `{{fecha}}`, `{{calificacion}}`, `{{folio}}`, `{{instructor}}`, `{{lugar}}`, `{{empresa}}`
- [ ] Firmas automáticas (instructor + director)
- [ ] Fondo decorativo con bordes
- [ ] Logo de AGASI
- [ ] **Selector visual** de plantillas en frontend (tarjetas con thumbnail)

### Constancia simple
- [ ] Diseño vertical, banda azul superior
- [ ] Placeholders básicos: `{{nombre}}`, `{{curso}}`, `{{fecha}}`, `{{folio}}`

### DC-4 / DC-5 (futuro)
- [ ] Reutilizar componentes: `SectionBar`, `LabeledCell`, `CharacterField`, `SignatureBlock`
- [ ] Documentar en `ARQUITECTURA-MOTOR.md`

---

## 🟡 PRIORIDAD 2: UX / Frontend

- [ ] **Selector visual de plantillas** — mostrar thumbnail de cada plantilla al elegir
- [ ] **Drag & drop Excel** — mejora visual del dropzone
- [ ] **Preview inline** — mostrar el PDF en un `<embed>` en lugar de modal
- [ ] **Progreso con tiempo estimado** — cuántos segundos faltan
- [ ] **Tema claro/oscuro** (opcional)
- [ ] **Columna de selección** para generar solo filas seleccionadas del Excel
- [ ] **Edición de datos inline** — modificar un valor antes de generar
- [ ] **Notificaciones toast** en lugar de alerts

---

## 🟢 PRIORIDAD 3: Empaquetado de escritorio

### PyInstaller (.exe)
- [ ] `pyinstaller --onefile --windowed app.py`
- [ ] Incluir Chromium de Playwright embebido
- [ ] Icono personalizado (.ico)
- [ ] Probar en Windows (VM o máquina física)
- [ ] Probar en Linux (AppImage)
- [ ] Probar en Mac (.app bundle)

### pywebview (ventana nativa)
- [ ] Agregar pywebview: `pip install pywebview`
- [ ] Envolver app Flask con ventana webview
- [ ] Ocultar barra de direcciones
- [ ] Menú de aplicación (Archivo, Ayuda)
- [ ] Atajo de teclado para abrir carpeta de outputs

### Acceso directo
- [ ] **Linux**: .desktop file → ya creado en `scripts/generador-agasi.desktop`
- [ ] **Windows**: .bat → ya creado en `scripts/iniciar.bat`
- [ ] **Instalador**: Inno Setup (Windows) o script de instalación

---

## ⚪ PRIORIDAD 4: Features power-user

- [ ] **Firmas digitales** — firmar PDFs generados (librería `cryptography` o `pyHanko`)
- [ ] **Marcas de agua** — texto "BORRADOR" o "VIGENTE"
- [ ] **Estampado de tiempo** — sello de tiempo SAT-like
- [ ] **QR Code** en certificados (enlace de verificación)
- [ ] **Validación de CURP** — checksum del CURP
- [ ] **Validación de RFC** — checksum del RFC
- [ ] **Historial de batches** — ver batches anteriores
- [ ] **Re-generación selectiva** — regenerar solo algunos PDFs de un batch
- [ ] **Exportar a CSV** — resumen de lo generado
- [ ] **Modo oscuro** en UI

---

## 📐 PRIORIDAD 5: Nuevos formatos

- [ ] **DC-4** (Constancia de Habilidades Laborales)
- [ ] **DC-5** (Constancia de Productividad)
- [ ] **Formatos SAT** (CFDI, Carta Porte)
- [ ] **Certificados médicos**
- [ ] **Diplomas institucionales**
- [ ] **Cartas de recomendación**

---

## 🐛 Bugs conocidos

- [ ] Ninguno reportado hasta ahora

---

## 📦 Documentación pendiente

- [ ] README con screenshots
- [ ] Manual de usuario (PDF)
- [ ] Video demo de 2 minutos
- [ ] Documentar flujo de creación de plantillas

---

## ✅ Completado

- [x] Core de la app (Flask + Playwright)
- [x] Subida de Excel con detección de columnas
- [x] Auto-mapeo de campos (normalizado)
- [x] Preview de datos cargados
- [x] Mapeo colapsable con badge
- [x] Preview de PDF vía Playwright
- [x] Generación batch con progreso SSE
- [x] Descarga ZIP
- [x] Abrir carpeta de outputs
- [x] **Plantilla DC-3** al 100% fiel al original STPS
- [x] CURP (18 cajas) y RFC (13 cajas) con sistema de caracteres
- [x] Periodo de ejecución con subceldas independientes
- [x] Barras negras (SectionBar Component)
- [x] Bloque de firmas (3 columnas, línea 70%)
- [x] Reverso con catálogos STPS
- [x] Excel de ejemplo (DC3 + participantes)
- [x] Documento de arquitectura (`ARQUITECTURA-MOTOR.md`)
- [x] Scripts de inicio (`.bat`, `.sh`, `.desktop`)

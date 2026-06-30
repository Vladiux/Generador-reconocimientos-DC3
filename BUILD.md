# Generador de Certificados AGASI — Build & Distribución

Esta carpeta contiene todo lo necesario para empaquetar **Generador de Certificados / Reconocimientos / DC-3 AGASI** como un ejecutable standalone para Windows o Linux, incluyendo la generación de iconos y builds automatizados con GitHub Actions.

---

## 📋 Tabla de contenidos

- [¿Qué es esta app?](#-qué-es-esta-app)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Cómo correr la app en modo desarrollo](#-cómo-correr-la-app-en-modo-desarrollo)
- [Compilar el ejecutable](#-compilar-el-ejecutable)
  - [Linux (compilación local)](#-linux-compilación-local)
  - [Windows desde una máquina Windows](#-windows-desde-una-máquina-windows)
  - [Windows vía GitHub Actions (sin Windows propio)](#-windows-vía-github-actions-sin-windows-propio)
- [Cómo usar el workflow de GitHub Actions](#-cómo-usar-el-workflow-de-github-actions)
- [Distribuir el ejecutable](#-distribuir-el-ejecutable)
- [Iconos](#-iconos)
- [Cómo funciona `build.spec`](#-cómo-funciona-buildspec)
- [Optimización de tamaño del ejecutable](#-optimización-de-tamaño-del-ejecutable)
- [Ventana propia vs consola](#-ventana-propia-vs-consola)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 ¿Qué es esta app?

App local en Flask (Python) que genera **cientos de PDFs de certificados DC-3, reconocimientos y constancias en segundos** a partir de un Excel con la lista de participantes. Usa Playwright/Chromium embebido para renderizar plantillas HTML a PDF con alta fidelidad visual.

**Casos de uso típicos en AGASI:**

- Lote de 50 DC-3 después de un curso de seguridad industrial
- 200 reconocimientos para participantes de un diplomado
- Constancias individuales de asistencia

**Stack técnico:**

| Componente | Versión | Para qué |
|------------|---------|----------|
| Python | 3.11+ | Runtime |
| Flask | 3.0+ | Servidor web local |
| openpyxl | 3.1+ | Lectura de Excel |
| Playwright | 1.40+ | Render HTML → PDF (Chromium) |
| PyInstaller | 6.0+ | Empaquetado en .exe / binario |

**Sin dependencias externas en la máquina destino** — todo va dentro del ejecutable.

---

## 📁 Estructura del proyecto

```
Generador reconocimientos/
├── app.py                          # ⭐ Servidor Flask principal (entry point)
├── requirements.txt                # Dependencias Python
│
├── templates/                      # Templates de Flask (UI)
│   └── index.html                  # Página principal
│
├── static/                         # Assets servidos al navegador
│   ├── app.js                      # Lógica del frontend (validación, UI)
│   ├── style.css                   # Estilos
│   ├── ejemplo_dc3.xlsx            # Excel de ejemplo
│   ├── ejemplo_certificados.xlsx
│   └── ejemplo_errores.xlsx        # ⭐ Útil para probar el botón "Copiar errores"
│
├── plantillas/                     # Templates HTML de los certificados
│   ├── dc3.html                    # ⭐ DC-3 formato STPS
│   ├── reconocimiento_clasico.html
│   ├── reconocimiento_moderno.html
│   └── constancia.html
│
├── firmas/                         # Firmas PNG que se pueden usar en plantillas
│
├── "Logos agente capacitador"/     # Logos de los agentes capacitadores
│
├── assets/                         # Iconos generados (auto-generados)
│   ├── agasi_icon.ico              # Icono Windows (multi-resolución)
│   └── agasi_icon_*.png            # Iconos Linux (varios tamaños)
│
├── output/                         # PDFs generados (auto-creado al generar)
│
├── scripts/
│   ├── iniciar.sh                  # Lanzador Linux
│   ├── iniciar.bat                 # Lanzador Windows
│   └── generador-agasi.desktop     # Entrada de menú Linux
│
├── build.spec                      # ⭐ Configuración de PyInstaller
├── build_linux.sh                  # ⭐ Script de build para Linux
├── build_windows.bat               # ⭐ Script de build para Windows
├── BUILD.md                        # ⭐ Este archivo
│
└── .github/
    └── workflows/
        └── build-windows.yml       # ⭐ GitHub Actions: compila el .exe en Windows
```

---

## 🚀 Cómo correr la app en modo desarrollo

Para iterar rápido sin recompilar:

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

**Resultado:** Se abre el navegador en `http://127.0.0.1:8765`. La consola muestra el log del servidor.

**Para parar:** `Ctrl+C` en la terminal.

> 💡 Flask está en modo `debug=True` cuando corres como script → activa auto-reload al editar `app.py`. **Esto no aplica al binario empaquetado** (ahí `debug=False` para evitar conflictos con `sys.frozen`).

---

## 🏗️ Compilar el ejecutable

### Resultado esperado

| Plataforma | Archivo | Tamaño | Cómo se ejecuta |
|------------|---------|--------|-----------------|
| **Windows** | `dist/GeneradorAGASI.exe` | ~170-200 MB | Doble click |
| **Linux**   | `dist/GeneradorAGASI`    | ~170-200 MB | `./GeneradorAGASI` desde terminal |

Ambos son **un solo archivo** que incluye Python, Flask, Playwright/Chromium, plantillas, firmas y el icono.

> El tamaño es alto (~170 MB) porque Chromium va embebido. **Es esperado**, no es un bug.

---

### 🐧 Linux (compilación local)

```bash
cd "Generador reconocimientos"
chmod +x build_linux.sh
./build_linux.sh
```

El script:
1. Activa el venv
2. Instala PyInstaller si falta
3. Verifica que Chromium de Playwright esté instalado
4. Compila con `build.spec` → produce `dist/GeneradorAGASI`
5. Imprime resumen con tamaño final

**Probar el binario:**
```bash
./dist/GeneradorAGASI
# Espera 5s y se debe abrir el navegador en http://127.0.0.1:8765
```

**Para parar:** `Ctrl+C` en la terminal donde lo lanzaste.

---

### 🪟 Windows desde una máquina Windows

⚠️ **No se puede compilar un `.exe` de Windows desde Linux** — PyInstaller necesita ejecutarse en la plataforma destino.

**Pasos:**

1. Copia toda la carpeta `Generador reconocimientos/` a la máquina Windows (excepto `venv/`, `__pycache__/`, `output/`, `weasyprint-samples/`, `build/`, `dist/`)
2. Instala Python 3.11+ desde [python.org](https://www.python.org/downloads/) (**marca "Add to PATH"** al instalar)
3. Abre CMD en esa carpeta y corre:

```bat
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pyinstaller
playwright install chromium
build_windows.bat
```

4. El `.exe` queda en `dist\GeneradorAGASI.exe` con icono AGASI

**Probar:** doble click en `dist\GeneradorAGASI.exe`. Se debe abrir el navegador.

---

### ☁️ Windows vía GitHub Actions (sin Windows propio)

Esta es la opción recomendada si **no tienes Windows a mano**. GitHub te presta un runner Windows, compila el `.exe` ahí, y te lo entrega como artifact descargable (y opcionalmente como Release).

**Setup inicial (una sola vez):**

1. Sube esta carpeta a un repo de GitHub (puede ser repo nuevo solo para el Generador, o integrarlo al repo principal de AGASI)
2. Confirma que el workflow está en `.github/workflows/build-windows.yml`
3. Listo — solo crea un tag y el build se dispara

**Ver sección siguiente para detalles de uso.**

---

## 🤖 Cómo usar el workflow de GitHub Actions

El workflow en `.github/workflows/build-windows.yml` se dispara **al crear un tag de versión** que empiece con `v` (ej: `v1.0.0`, `v1.2.3`).

### ⚠️ Requisito previo: necesita estar en un repo de GitHub

Esta carpeta **actualmente no es un repo git** (verifícalo con `git status`). Tienes dos opciones:

#### Opción A: Repo nuevo solo para el Generador (recomendado para empezar)

```bash
cd "Generador reconocimientos"
git init
git add .
git commit -m "Initial commit: Generador AGASI v1.0.0"

# Crea un repo VACÍO en https://github.com/new (no inicialices con README)
# Luego conecta este directorio:
git remote add origin https://github.com/TU_USUARIO/generador-agasi.git
git branch -M main
git push -u origin main
```

#### Opción B: Integrarlo al repo principal de AGASI

Si prefieres que viva en `AGASI/generador-reconocimientos/` dentro de un repo existente:

```bash
# Desde la raíz del repo principal de AGASI:
mkdir -p "Generador reconocimientos"  # si no existe
cd "Generador reconocimientos"
git init
git add .
git commit -m "Agregar Generador de Certificados AGASI"
# Push desde la raíz del repo padre
```

### Crear un nuevo release (.exe) — paso a paso

**1. Decide la versión.** Usa [semver](https://semver.org/lang/es/):
- `v1.0.0` — primera versión pública
- `v1.0.1` — bugfix
- `v1.1.0` — feature nueva
- `v2.0.0` — cambio incompatible

**2. Haz commit de cualquier cambio pendiente:**
```bash
git add .
git commit -m "Release v1.0.0: botón copiar errores + .exe"
```

**3. Crea el tag y súbelo:**
```bash
git tag -a v1.0.0 -m "Primera versión distribuible"
git push origin v1.0.0
```

**4. Espera 3-7 minutos.** Ve a la pestaña **Actions** del repo en GitHub para ver el build en progreso.

**5. Cuando termine (✅ verde), el .exe está disponible en dos lugares:**

| Lugar | Para qué sirve |
|-------|---------------|
| **Releases** (página principal del repo → click "Releases" → click en `v1.0.0`) | Link público permanente. Compártelo con tu equipo por WhatsApp/email. |
| **Artifacts** (dentro del run específico en Actions) | Descarga directa solo si tienes acceso al repo. |

### Probar sin publicar un Release

Si quieres validar que el workflow compila bien **antes de crear un release real**, puedes dispararlo manual:

1. Ve a la pestaña **Actions** del repo
2. Click en "Build Windows .exe" en la lista de la izquierda
3. Click en **Run workflow** (botón azul, lado derecho)
4. Selecciona rama `main` y click en el botón verde "Run workflow"
5. Espera a que termine. El .exe queda **solo como artifact** (no se crea Release)

### Reconstruir después de cambios

Simplemente crea otro tag:
```bash
# Haz los cambios que quieras
git add .
git commit -m "..."
git tag -a v1.0.1 -m "Fix: <descripción>"
git push origin v1.0.1
```

El workflow reconstruye y crea un nuevo Release automáticamente.

### ¿Y si el build falla?

Ve a la pestaña **Actions**, click en el run con ❌ rojo, lee el log. Causas comunes:
- Falta un archivo en el spec (ver [Troubleshooting](#-troubleshooting))
- Una dependencia nueva en `requirements.txt` rompió algo

---

## 📦 Distribuir el ejecutable

Una vez tengas `GeneradorAGASI.exe` (o `GeneradorAGASI` en Linux), la persona que lo usa solo necesita:

### Windows
1. Doble click en el `.exe`
2. Si Windows SmartScreen lo bloquea: "Más información" → "Ejecutar de todas formas" (es normal en `.exe` no firmados digitalmente; el mensaje es genérico, no significa que sea malware)
3. Se abre el navegador en `http://127.0.0.1:8765`
4. La carpeta `output/` se crea al lado del `.exe` para los PDFs generados

### Linux
1. `chmod +x GeneradorAGASI` (solo la primera vez, o doble click desde explorador de archivos si el sistema lo permite)
2. `./GeneradorAGASI` desde terminal
3. Se abre el navegador en `http://127.0.0.1:8765`

**La app NO necesita:**
- Python instalado
- pip ni venv
- Que el usuario sepa qué es Flask o Playwright
- Acceso a internet

---

## 🎨 Iconos

Los iconos se generan desde `AG_Principal.png` (logo raíz) recortado al cuadrado:

- `assets/agasi_icon.ico` — Windows, multi-resolución (16/32/48/64/128/256)
- `assets/agasi_icon_{16,32,48,64,128,256,512}.png` — Linux/macOS

### Regenerar los iconos

Si cambias el logo de AGASI o quieres usar otro:

```bash
source venv/bin/activate
python <<'PY'
from PIL import Image
import os

src = "AG_Principal.png"  # o la ruta al logo nuevo
img = Image.open(src)
W, H = img.size
side = min(W, H)
img_square = img.crop(((W - side) // 2, (H - side) // 2,
                        (W + side) // 2, (H + side) // 2))

os.makedirs("assets", exist_ok=True)

# PNGs para Linux
for size in [16, 32, 48, 64, 128, 256, 512]:
    img_square.resize((size, size), Image.LANCZOS).convert("RGBA") \
        .save(f"assets/agasi_icon_{size}.png")

# .ico multi-resolución para Windows
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
imgs = [img_square.resize(s, Image.LANCZOS).convert("RGBA") for s in ico_sizes]
imgs[0].save("assets/agasi_icon.ico", format="ICO", sizes=ico_sizes,
              append_images=imgs[1:])

print("Iconos regenerados")
PY
```

Después recompila (`build_linux.sh` o push a tag).

---

## ⚙️ Cómo funciona `build.spec`

El spec de PyInstaller está pensado para ser **cross-platform** (la misma config funciona en Linux y Windows):

| Sección | Qué hace |
|---------|----------|
| `datas` | Incluye `templates/`, `plantillas/`, `static/`, `firmas/`, `Logos agente capacitador/`, `assets/`, logos raíz |
| `hiddenimports` | Fuerza inclusión de `flask`, `openpyxl`, `playwright.sync_api` y submódulos que PyInstaller no detecta solo |
| `excludes` | Excluye cosas pesadas que no usamos: `numpy`, `pandas`, `matplotlib`, `tkinter`, Qt |
| `icon` | Auto-detecta: `.ico` en Windows, `.png` 256 en Linux/macOS |
| `console=True` | El ejecutable muestra la consola con logs (no es windowed/invisible) |
| Browser de Playwright | Se detecta dinámicamente desde `~/.cache/ms-playwright/` y se incluye en el bundle |

**Cambios comunes al spec:**

- **Agregaste una dependencia nueva en `requirements.txt`:** agrégala a `hiddenimports`
- **Agregaste una carpeta de assets:** agrégala a `datas`
- **Quieres un icono más reciente:** regenera los iconos y vuelve a compilar
- **Quieres un .exe sin consola (silent):** cambia `console=True` a `console=False`

---

## 📦 Optimización de tamaño del ejecutable

### Estado actual (sin optimizar)

| Componente | Tamaño aprox | Nota |
|------------|--------------|------|
| Python + Flask + openpyxl | ~30 MB | Runtime base |
| **Chromium** (versión usada) | ~70 MB | Playwright, para renderizar PDFs |
| **Chromium headless_shell** (versiones extra) | ~140 MB | **← duplicado, se pueden quitar** |
| ffmpeg + deps varias | ~50 MB | Codecs de Playwright |
| Plantillas + logos + assets | ~5 MB | Recursos de la app |
| **TOTAL .exe** | **~170-350 MB** | Varía según cuántas versiones de Chromium se metan |

**El problema:** cuando corres `playwright install`, deja **múltiples versiones** de Chromium en `~/.cache/ms-playwright/`. Mi `build.spec` actual agarra TODO lo que contenga "chromium" en el nombre, sin filtrar. Resultado: 2-3 versiones de Chromium empaquetadas = 200+ MB de puro browser engine.

### Plan de optimización por niveles

#### 🟢 Nivel 1: Empaquetar SOLO UNA versión de Chromium (~80-100 MB)

**Lo más fácil, sin tocar el código de la app.** Solo cambias el `build.spec` para que incluya solo la versión más reciente de Chromium, no todas.

**Modificación al `build.spec`:** reemplazar el bloque que itera sobre `playwright_dir.iterdir()` por esto:

```python
# Buscar solo la versión MÁS NUEVA de chromium
chromium_dirs = sorted([
    d for d in playwright_dir.iterdir()
    if d.is_dir() and d.name.startswith("chromium-")
], key=lambda d: int(d.name.split("-")[1]) if d.name.split("-")[1].isdigit() else 0, reverse=True)

# Tomar solo la primera (la más nueva)
if chromium_dirs:
    d = chromium_dirs[0]
    datas.append((str(d), f"_ms-playwright/{d.name}"))
    print(f"[build.spec] Solo la versión más nueva: {d.name}")
```

**Resultado esperado:** ~80-100 MB (en vez de 170-350 MB). El PDF sale idéntico porque todas las versiones de Chromium renderizan igual.

**Riesgo:** Bajo. Si por alguna razón la versión más nueva tiene un bug, podemos cambiar a la penúltima cambiando `chromium_dirs[0]` a `chromium_dirs[1]`.

---

#### 🟡 Nivel 2: Usar Chromium headless_shell en vez de Chromium completo (~50-70 MB)

Chromium headless_shell es el motor de renderizado SIN interfaz gráfica. Como nosotros solo necesitamos generar PDFs (no navegar visualmente), no necesitamos la UI de Chromium. headless_shell hace exactamente lo mismo pero pesa **la mitad**.

**Modificación al `build.spec`:** (igual que Nivel 1 pero filtrando `chromium_headless_shell-` en vez de `chromium-`)

```python
chromium_dirs = sorted([
    d for d in playwright_dir.iterdir()
    if d.is_dir() and d.name.startswith("chromium_headless_shell-")
], key=lambda d: int(d.name.split("-")[-1]) if d.name.split("-")[-1].isdigit() else 0, reverse=True)
```

Y en `app.py` (donde se llama Playwright):

```python
# Antes:
browser = p.chromium.launch(args=["--allow-file-access-from-files"])
# Después:
browser = p.chromium.launch(
    args=["--allow-file-access-from-files", "--headless=new"],
)
```

**Resultado esperado:** ~50-70 MB.

**Riesgo:** Medio. Algunas features muy específicas (poco probables que uses) podrían no funcionar. Para PDFs normales, no hay diferencia.

---

#### 🟠 Nivel 3: Usar el Chrome/Edge ya instalado del cliente (~30 MB)

**Cambio más radical.** En vez de empaquetar NADA de Chromium, el binario busca Chrome o Edge en la máquina del cliente y lo usa. El binario queda ligero como una pluma.

**Modificación en `app.py` — función `_generar_pdf_playwright`:**

```python
import platform
import os as os_mod

def _generar_pdf_playwright(html_content, output_path, single_page=False):
    system = platform.system()
    if system == "Windows":
        chrome_paths = [
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ]
    elif system == "Darwin":
        chrome_paths = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
    else:
        chrome_paths = [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/microsoft-edge",
            "/usr/bin/chromium-browser",
        ]

    chrome_path = None
    for path in chrome_paths:
        if os_mod.path.exists(path):
            chrome_path = path
            break

    if not chrome_path:
        raise FileNotFoundError(
            "No se encontró Chrome ni Edge. "
            "Por favor instala Google Chrome desde https://www.google.com/chrome"
        )

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=chrome_path,
            args=["--allow-file-access-from-files"]
        )
        # ... resto del código igual
```

**Resultado esperado:** ~30 MB total.

**Riesgo:** Alto.
- Si el cliente NO tiene Chrome ni Edge, la app falla con error claro (pero sí falla)
- Diferentes versiones de Chrome pueden dar PDFs ligeramente distintos
- El .exe ya no es 100% standalone

**Cuándo vale la pena:** Cuando distribuyas a muchos usuarios. **Para tu caso (3 usuarios + 1 cliente), NO vale la pena.**

---

#### 🔴 Nivel 4: Edge WebView2 (solo Windows, ~30 MB)

Similar al nivel 3 pero usando el motor de Edge embebido en Windows 10/11. NO funciona en Mac ni Linux.

**No lo recomiendo** porque rompe tu soporte multiplataforma.

---

### 🎯 ¿Cuál implementar?

| Si quieres... | Nivel | Tamaño | Esfuerzo |
|---------------|-------|--------|----------|
| Que siga funcionando en cualquier Windows sin nada extra | 0 (dejar así) | ~170 MB | 0 min |
| Bajar a 80-100 MB sin riesgo | **Nivel 1** ⭐ | ~80-100 MB | 15 min |
| Bajar a 50-70 MB, requiere probar | Nivel 2 | ~50-70 MB | 1-2 horas |
| Bajar a 30 MB, requiere que el cliente tenga Chrome | Nivel 3 | ~30 MB | 3-4 horas |
| Mínimo absoluto, solo Windows | Nivel 4 | ~30 MB | 5+ horas |

**Mi recomendación honesta: Nivel 1.** Bajo el .exe de 350 MB a ~80-100 MB, sin riesgo y sin cambios en el comportamiento.

---

## 🪟 Ventana propia vs consola

### Estado actual

Cuando ejecutas `GeneradorAGASI.exe` ahora mismo:
- ✅ Se abre la app en el navegador (`http://127.0.0.1:8765`)
- ✅ También se abre una **ventana de consola negra** (CMD) que muestra los logs del servidor

### ¿Por qué hay consola?

Es intencional en el `build.spec`:
```python
exe = EXE(
    ...
    console=True,  # ← esta línea hace que se abra la ventana negra
)
```

**Ventaja:** Si hay un error, el usuario puede ver QUÉ PASÓ y mandarte screenshot de los logs.

**Desventaja:** Se ve "poco pro" — el cliente espera solo una ventana limpia.

### ¿Cómo se quita?

**Cambio de 1 línea en `build.spec`:**

```python
console=False,  # ← cambia a False para ocultar la consola
```

### ¿Qué pasa si oculto la consola y hay un error?

- El .exe se abre, **el navegador SÍ se abre** (eso lo maneja Flask con `webbrowser.open()`)
- Si hay un error, **la ventana negra NO se ve** — el .exe se cierra silenciosamente
- El usuario ve "no pasó nada" y se queda con cara de WTF

### Solución: redirigir logs a un archivo

Si ocultas la consola, **escribe los logs a un archivo** para poder debuggear después:

```python
# En app.py, al inicio:
import logging
log_file = RUNTIME_DIR / "app.log"
logging.basicConfig(
    filename=str(log_file),
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
```

Así si el .exe falla, puedes pedirle al usuario que te mande el archivo `app.log` que está al lado del ejecutable.

### Mi recomendación

| Escenario | Recomendación |
|-----------|---------------|
| Lo usa tu equipo interno | Dejar la consola. Tú la necesitas para debuggear |
| Lo va a usar el cliente final | Ocultar la consola + logs a archivo. Se ve más profesional |
| Ambos | Ocultar la consola + logs a archivo. Tú puedes abrir el `app.log` cuando necesites debuggear |

**Si quieres que lo cambie ahora, dime:** "oculta la consola" y lo modifico en 30 segundos.

---

## 🛠️ Troubleshooting

### "ModuleNotFoundError: No module named 'X' al ejecutar el binario"
El módulo no se incluyó en el spec. Agrégalo a `hiddenimports` en `build.spec` y vuelve a compilar.

### "TemplateNotFound: index.html" al ejecutar el binario
Falta la carpeta `templates/` en `datas` del spec. Ya está incluida por default — si vuelve a pasar, revisa que `(str(BASE / "templates"), "templates")` siga en la lista.

### "Windows SmartScreen bloqueó la app"
Normal en `.exe` no firmados. El usuario debe hacer click en "Más información" → "Ejecutar de todas veces". No es un bug, es una advertencia genérica de Windows.

**Solución a largo plazo:** firmar el `.exe` con un certificado de code-signing (cuesta ~$200-400/año). Para uso interno con 3-5 personas no vale la pena.

### El .exe de Windows no abre el navegador
El `webbrowser.open()` puede fallar si el binario se corre como servicio o sin desktop. En ese caso el usuario puede abrir manualmente `http://127.0.0.1:8765`. La app sigue corriendo aunque no se abra el browser.

### El binario de Linux dice "libgobject-2.0.so not found" en otra distro
PyInstaller en Linux **no** incluye las libs del sistema. Si distribuyes a otras máquinas Linux, considera:
- Compilar en la distro más vieja posible (Debian 11 / Ubuntu 20.04 son buena base)
- O distribuir un `.tar.gz` con el ejecutable + instrucciones de instalar las deps
- O usar AppImage / Flatpak en el futuro (más complejo de setup)

### GitHub Actions falla con "no space left on device"
Los runners de GitHub tienen ~14 GB. PyInstaller + Playwright + Chromium caben pero justo. Si llega a fallar:
1. Verifica que `output/`, `weasyprint-samples/`, `build/`, `dist/` no se commiteen al repo
2. El workflow ya limpia antes de compilar

### El botón "Copiar" no copia nada
Verifica que la app esté sirviendo por `127.0.0.1` o `localhost` (no `0.0.0.0`). `navigator.clipboard.writeText()` requiere un **secure context** y `127.0.0.1` cuenta como tal. Si sirves por una IP de la LAN (ej: `192.168.1.5`), el browser no permite clipboard API y el código cae al fallback de `execCommand('copy')` (que sí funciona).

### El PDF generado sale con tipografía fea / sin imágenes
Playwright/Chromium embebido necesita acceso a las fuentes del sistema. En Windows debería estar bien. En Linux, si distribuyes el binario, las fuentes del sistema destino pueden no estar — el PDF caerá a tipografías default. Para una experiencia consistente, **incluye las fuentes en `assets/`** y cárgalas via `@font-face` en las plantillas.

---

## 🚀 Setup del primer release (de cero a .exe en GitHub)

Si es la primera vez que subes esto a GitHub, estos son todos los pasos en orden:

**1. Crear el repo en GitHub** (uno nuevo, vacío, sin README/LICENSE/.gitignore)

**2. Localmente, dentro de `Generador reconocimientos/`:**
```bash
git init
git add .
git commit -m "Initial commit: Generador de Certificados AGASI v1.0.0"

git remote add origin https://github.com/TU_USUARIO/generador-agasi.git
git branch -M main
git push -u origin main
```

**3. Verificar que los archivos del workflow llegaron:**
- Abre el repo en GitHub
- Debe haber `.github/workflows/build-windows.yml` listado en la raíz
- Si no aparece, es porque tu `.gitignore` lo excluyó (no debería, pero revisa)

**4. Disparar el primer build — opción A (recomendada la primera vez, para validar sin publicar Release):**
- Ve a la pestaña **Actions** del repo
- Click en "Build Windows .exe"
- Click en **Run workflow** → seleccionar rama `main` → botón verde **Run workflow**
- Espera 4-7 minutos
- Al terminar ✅, en la parte de abajo del run hay un artifact `GeneradorAGASI-windows-main` → descargarlo y probarlo

**5. Si el artifact funciona bien, crear el primer Release real:**
```bash
git tag -a v1.0.0 -m "Primera versión distribuible"
git push origin v1.0.0
```
- Espera 4-7 minutos
- El .exe aparece en la página de **Releases** del repo con link público

**6. Compartir el .exe con el equipo:**
- Link directo: `https://github.com/TU_USUARIO/generador-agasi/releases/tag/v1.0.0`
- O el link al archivo: `https://github.com/TU_USUARIO/generador-agasi/releases/download/v1.0.0/GeneradorAGASI.exe`

---

## 📌 Recordatorios rápidos

- **Compilar Linux:** `./build_linux.sh` → 3-5 min → `dist/GeneradorAGASI`
- **Compilar Windows local:** `build_windows.bat` (en una máquina Windows) → 5-7 min → `dist/GeneradorAGASI.exe`
- **Compilar Windows sin máquina Windows:** `git tag v1.0.0 && git push origin v1.0.0` → ver Actions → descargar artifact
- **Regenerar iconos:** ver bloque en sección "Iconos"
- **Cambiar versión del build:** solo crea un nuevo tag y push

¿Dudas? Revisa el log del build (en Actions si es GitHub, o en la terminal si es local). El error usualmente dice exactamente qué falta.

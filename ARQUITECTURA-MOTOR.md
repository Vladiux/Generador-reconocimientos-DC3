# Arquitectura del Motor de Composición

> Lecciones aprendidas replicando el formato DC-3 de la STPS.
> De "generador de PDFs" a "motor de composición de documentos".

---

## 🧠 La revelación: No son campos, es una retícula

Lo más difícil de replicar el DC-3 no fue el código, sino **entender cómo está construido visualmente**.

Al principio pensamos en "campos": un lugar para el nombre, otro para el CURP, otro para la fecha. Pero el ojo humano no percibe campos. Percibe una **malla de líneas** — una retícula donde cada elemento encaja en una celda.

El error clásico es ver las casillas de la fecha y pensar:

```
Año  Mes  Día
││││  ││   ││
```

Cuando en realidad la estructura es:

```
┌─────┬──┬──┬───┬─────┬──┬──┐
│ Año │  │  │ a │ Año │  │  │
││││  ││ ││ │   ││││  ││ ││ │
└─────┴──┴──┴───┴─────┴──┴──┘
```

Cada grupo es una **subcelda independiente**, con sus propias barras laterales que suben hasta el tope. Las divisiones internas de los caracteres son otro sistema visual dentro de cada subcelda.

---

## 🧩 Componentes identificados

Después de este análisis, podemos extraer componentes reutilizables:

### 1. `SectionHeader` — Barra negra

```
████████████████████████████████
  DATOS DEL TRABAJADOR
████████████████████████████████
```

| Propiedad | Valor |
|-----------|-------|
| Alto | 6.5mm |
| Fondo | Negro (#000) |
| Texto | Blanco, 8pt Bold, mayúsculas |
| Sin bordes | Sin border-radius |

---

### 2. `GridRow` — Fila de tabla con bordes

```
┌──────────────────────────────────────┐
│  Celda con borde 0.5pt interno      │
│  y 1pt exterior                     │
└──────────────────────────────────────┘
```

| Propiedad | Valor |
|-----------|-------|
| Borde interno | 0.5pt solid #000 |
| Borde exterior | 1pt solid #000 |
| Padding | 0.8mm top/bottom, 2mm left |
| Sin separación | celdas adyacentes comparten borde |

---

### 3. `LabeledCell` — Celda con label + valor

```
Nombre (Anotar apellido paterno...)
López Hernández María Fernanda
```

| Propiedad | Valor |
|-----------|-------|
| Label | 6.5pt, normal, top-left |
| Valor | 8.5pt, normal, abajo |
| Sin barra | No hay línea entre label y valor |
| Bordes | Solo los de la GridRow contenedora |

---

### 4. `CharacterField` — Cajas de caracteres individuales

```
 ──────────────
 ││││││││││││││
```

| Propiedad | Valor |
|-----------|-------|
| Borde superior | ❌ No existe |
| Borde inferior | 0.5pt solid #000 |
| Borde vertical | 0.5pt solid #000 (entre caracteres) |
| Altura | 5.5mm |
| Caracteres | Configurable (18 para CURP, 13 para RFC) |
| Alineación | Caracteres al fondo, pegados al borde inferior |

Ejemplos de uso:

| Campo | Caracteres |
|-------|-----------|
| CURP | 18 |
| RFC | 13 |
| Año | 4 |
| Mes | 2 |
| Día | 2 |

---

### 5. `GroupedCharacterField` — Subcelda con etiqueta + caracteres

```
┌──────────────┐
│     Año      │  ← Etiqueta arriba
│ │  │  │  │   │  ← Divisiones internas
└──────────────┘
```

| Propiedad | Valor |
|-----------|-------|
| Etiqueta | "Año", "Mes", "Día" — 5.5pt, centrada |
| Caracteres | 4 para Año, 2 para Mes/Día |
| Borde lateral izquierdo | 0.5pt (full-height) |
| Borde lateral derecho | 0.5pt (full-height) |
| Divisiones internas | 0.5pt, bottom-to-near-label |
| Chars pegados al fondo | ✅ |
| Etiqueta arriba | ✅, padding-top 0.2mm |

Este es el componente más importante. Es lo que diferencia una réplica exacta de un intento "parecido".

---

### 6. `SignatureBlock` — 3 columnas de firmas

| Propiedad | Valor |
|-----------|-------|
| Columnas | 3 iguales (flex: 1) |
| Línea de firma | 70% del ancho de la columna |
| "Nombre y firma" | Centrado debajo de la línea |
| Bordes | Bloque completo con 1pt |

---

### 7. `InstructionBlock` — Instrucciones + notas numeradas

```
INSTRUCCIONES
- Llenar a máquina o con letra de molde.
- Deberá entregarse...
1 Las áreas y subáreas...
2 Las áreas temáticas...
```

| Propiedad | Valor |
|-----------|-------|
| Alineación | Izquierda, sin justificar |
| Interlineado | Muy pequeño (1.05) |
| Tamaño | 6pt |
| Notas numeradas | 1-5 con superíndices |

---

### 8. `FooterCode` — Pie de página

```
DC-3
ANVERSO
```

| Propiedad | Valor |
|-----------|-------|
| Alineación | Derecha |
| Tamaño | 7pt Bold |
| Separación | ~4mm del borde inferior, `margin-top: auto` |

---

## 🏗️ Arquitectura propuesta

En lugar de programar cada formato como un HTML monolítico, se puede construir un **motor de composición**:

```
Document
├── HeaderNote
├── MainTitle
├── SectionBar (SectionHeader)
├── GridTable
│   ├── LabeledCell
│   ├── CharacterField (CURP)
│   ├── CharacterField (RFC)
│   └── GroupedCharacterField (Fechas)
├── SignatureArea (SignatureBlock)
├── InstructionBlock
└── FooterCode
```

### Ventajas

| Aspecto | HTML monolítico | Motor de componentes |
|---------|----------------|---------------------|
| **DC-4** | Reescribir todo | Reusar SectionBar + CharacterField + SignatureBlock |
| **DC-5** | Reescribir todo | Reusar componentes |
| **Constancias** | Nueva plantilla | SectionBar + LabeledCell + SignatureBlock |
| **Certificados** | Nueva plantilla | MainTitle + SectionBar + SignatureBlock |
| **Formatos SAT** | Desde cero | CharacterField + GroupedCharacterField |

### Con 7-8 componentes cubres todo

1. `SectionHeader`
2. `GridRow`
3. `LabeledCell`
4. `CharacterField`
5. `GroupedCharacterField`
6. `SignatureBlock`
7. `InstructionBlock`
8. `FooterCode`

---

## 📐 Especificaciones generales del ecosistema

| Propiedad | Valor |
|-----------|-------|
| Tamaño de página | Letter (215.9 × 279.4 mm) |
| Tipografía | Arial / Helvetica (sans-serif) |
| Colores | Negro (#000) y Blanco (#fff) — sin grises |
| Grosor líneas internas | 0.5 pt |
| Grosor bordes exteriores | 1 pt |
| Márgenes | Sup 13mm / Inf 8mm / Lat 6mm |

---

## 💡 Conclusión

El DC-3 no es un formulario con campos. Es un **sistema de layout basado en retícula** donde cada línea, cada división y cada espacio tienen una razón de ser.

Entender esto cambió el enfoque: de "rellenar plantillas" a **componer documentos con componentes precisos**.

Cuando llegue el DC-4, el DC-5, las constancias o los certificados, ya no empezarás desde cero. Simplemente combinarás los componentes que ya tienes validados — y el 99.9% de fidelidad visual será automático.

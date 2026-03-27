# Rinconcito narrativo

Aplicación web **offline-first** para planificar, estructurar y escribir libros en el navegador. Usa **HTML**, **JavaScript (ES modules)**, **Vite**, **Tailwind CSS** (compilado) y **PWA** (service worker), sin frameworks de UI ni backend.

## Requisitos

- [Node.js](https://nodejs.org/) 18+ (solo para desarrollo y build).
- Navegador moderno (Chrome, Firefox, Safari, Edge).

## Cómo ejecutarla (desarrollo)

```bash
npm install
npm run dev
```

Abre la URL que indique Vite (normalmente `http://localhost:5173`). Las plantillas se cargan desde `public/data/templates.json` (en build se copia a `dist/data/`).

## Build de producción

```bash
npm run build
npm run preview
```

El resultado queda en **`dist/`**; despliega esa carpeta en cualquier hosting estático. `base` está configurado como `./` para que funcione también en subcarpetas.

## Calidad de código

- `npm run lint` — ESLint
- `npm test` — Vitest (lógica pura / datos)

## Accesibilidad

Los modales usan foco atrapado, `aria-modal`, cierre con Escape y retorno de foco al elemento que abrió el diálogo. Convención: botones que abren modales llevan `data-modal-opener="id-del-modal"`.

## Interfaz: cabecera, barras laterales y paneles

- **Barra superior**: marca, búsqueda global, estado de guardado, accesos a **Ajustes**, **Perfil de autor**, **Guardar snapshot** (con libro abierto) y botón **Panel** para mostrar u ocultar el panel derecho en pantallas grandes.
- **Barra lateral izquierda** (`aside` de navegación):
  - En **biblioteca**: inicio, nuevo libro, plantillas, lista de libros con miniatura de carátula, exportar/importar workspace, guía de escritura y ajustes. Puedes **contraerla** a iconos para ganar espacio.
  - Con **libro abierto**: navegación por secciones (ver listado abajo), volver a biblioteca, eliminar libro. Muestra avisos de copia de seguridad si hace tiempo que no registras una exportación.
- **Panel central**: la vista activa (editor, listas, grafo, etc.).
- **Panel derecho** (escritorio, `lg+`): **progreso** de palabras respecto a la meta, desglose por capítulo, acceso al **análisis**, **métricas en tiempo real** del fragmento que editas (párrafos, proporción de diálogo, repeticiones frecuentes) y **relaciones recientes**. En textos muy largos las métricas del editor se desactivan para mantener fluidez.

## Biblioteca y workspace

- **Inicio / biblioteca**: panel de **resumen del workspace** con totales (libros, palabras, páginas estimadas, capítulos, escenas, personajes, eventos), gráfico **donut** del reparto de palabras entre libros, barras por **estado** y por **categoría**, comparativa de **palabras por libro** y rejilla de **tarjetas** con carátula.
- **Perfil de autor**: datos del workspace (accesible desde la cabecera), independientes de cada libro.
- **Nuevo libro** abre primero los metadatos y, al guardar, pasa a la sinopsis (flujo existente).

## Navegación por libro (barra lateral)

Agrupada en secciones:

| Sección | Contenido |
|--------|-----------|
| **Plan** | Prólogo, capítulos y escenas, actos, epílogo |
| **Notas del autor** | Sinopsis, contexto histórico, reglas del mundo, personajes, línea de tiempo, **Kanban**, extras, notas |
| **Herramientas** | Frases destacadas, **análisis** (con contador de avisos en el menú), **mapa / grafo**, historial de snapshots, relaciones, exportar libro, metadatos del libro |
| **Guía** | Guía de escritura integrada |

## Funciones destacadas por área

### Escritura y estructura

- Metadatos del libro (nombre, autor, fecha, categoría, narrador, estado, meta de palabras, carátula).
- Sinopsis, prólogo, epílogo, **extras** como bloques listables; **notas**; capítulos con **objetivo del capítulo**; escenas con **arrastrar y soltar**; **actos** que agrupan capítulos.
- **Contexto histórico** y **reglas del mundo** como vistas dedicadas.
- Editor enriquecido con barra de herramientas y atajos (Ctrl/Cmd+B, I, U; guión largo — con **Ctrl/Cmd+Shift+-** u **Opción+M** (Mac) / **Alt+M** (Windows)). Comentarios y **frases destacadas** enlazadas al texto.
- **Búsqueda global** desde la cabecera.

### Personajes, tiempo y relaciones

- Fichas de personajes con imagen (data URL).
- **Línea de tiempo** unificada con eventos (crear, editar, ordenar, eliminar) y vista cronológica.
- **Relaciones** entre personajes, capítulos, escenas y entre eventos; gestión en vista dedicada.
- **Mapa / grafo de relaciones**:
  - **Solo personajes**: elige un **personaje raíz** para ver su **subred conexa** con trazado **ortogonal** (solo líneas horizontales/verticales) y **leyenda por tipo de vínculo** (p. ej. familiar, pareja), útil para visualizar redes y lecturas tipo **árbol genealógico** según los vínculos que definas.
  - **Personajes + capítulos** y **Todo**: vistas más amplias; el modo «Todo» incluye la **vista clásica por anillos** además de la red cuando aplica.

### Kanban (por libro)

- Uno o varios **tableros** por libro; cada tablero tiene **columnas** y **tareas**.
- **Arrastrar y soltar** tareas entre columnas y para reordenar; **reordenar columnas** por arrastre.
- Color de fondo por tablero para diferenciarlos visualmente.

### Análisis y calidad

- Vista **Análisis del libro**: puntuación de **salud narrativa**, resumen estadístico, lista de **problemas narrativos** (avisos e informativos), **conflictos en la línea de tiempo**. El icono de avisos en la barra lateral refleja solo incidencias de severidad alta.

### Versiones y exportación

- **Snapshots** del libro (historial); creación manual desde la cabecera y **snapshots automáticos** configurables en **Ajustes** (intervalo en minutos o desactivado).
- Exportación del libro: Markdown, TXT, PDF (vía impresión del navegador), DOCX, EPUB mínimo (JSZip).

## Datos, copias de seguridad y ajustes

- Los datos se guardan en **IndexedDB** en este origen (dominio/puerto).
- **Exportar workspace (JSON)** en la barra lateral para una copia completa (libros, relaciones, tableros Kanban, snapshots, etc.).
- **Importar** ese JSON con opciones de reemplazar todo o fusionar.
- En **Ajustes** (barra lateral o cabecera): corrector ortográfico nativo del navegador, intervalo de **guardado automático**, **snapshots automáticos**, modo del **panel de progreso** (actualizar al espacio/punto o mientras escribes), recordatorio de exportación y **pie de página** con copyright y **versión de la app** (alineada con `package.json` en el build).

## Limitaciones

- `document.execCommand` está obsoleto pero sigue siendo la opción más compatible para un editor ligero sin dependencias pesadas.
- El EPUB generado es **mínimo**; algunos lectores pueden ser exigentes con la estructura OPF/NCX.

## Estructura del proyecto

```
index.html
vite.config.js
tailwind.config.js
assets/css/app.css
assets/js/*.js
assets/js/ui/views/*.js   (vistas por dominio; reexportadas desde ui-views.js)
components/shell.js
public/data/templates.json
```

## Licencia

Uso libre para tus proyectos personales y educativos.

# Narrative Lab

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

## Datos y copias de seguridad

- Los datos se guardan en **IndexedDB** en este origen (dominio/puerto).
- Usa **Exportar workspace (JSON)** en la barra lateral para una copia completa (libros, relaciones, snapshots, etc.).
- Puedes **importar** ese JSON con opciones de reemplazar todo o fusionar.
- En **Ajustes** puedes ver recordatorios si hace tiempo que no exportas (solo en este dispositivo).

## Funciones principales

- Libros con metadatos (nombre, autor, fecha, categoría, narrador, estado, meta de palabras). **Nuevo libro** abre primero los metadatos y, al guardar, pasa a la sinopsis.
- Sinopsis, prólogo, epílogo, **extras** como bloques listables (crear, editar, guardar, eliminar), notas, capítulos con **objetivo del capítulo**, escenas (drag-and-drop; eliminar escena o capítulo).
- **Actos**: agrupa capítulos por acto (un capítulo solo en un acto).
- Personajes con ficha extendida e imagen (data URL); al guardar vuelve a la lista.
- **Línea de tiempo** unificada con eventos: crear, editar, ordenar y eliminar en la misma pantalla, más vista cronológica.
- **Relaciones** entre personajes y capítulos/escenas, y entre eventos.
- Editor enriquecido con barra de herramientas y atajos (Ctrl/Cmd+B, I, U; guión largo — con **Ctrl/Cmd+Shift+-** o **Opción+M** (Mac) / **Alt+M** (Windows)).
- **Ajustes** (barra lateral): intervalo de guardado automático, modo de actualización del panel de palabras (al espacio/punto o mientras escribes) y **subrayado ortográfico nativo** del navegador (activar/desactivar; depende del idioma del sistema).
- **Frases destacadas**, búsqueda global, snapshots de versión, plantillas (novela, cuento, guion).
- Exportación del libro: Markdown, TXT, PDF (vía impresión del navegador), DOCX (bundled), EPUB mínimo (JSZip).

## Limitaciones

- `document.execCommand` está obsoleto pero sigue siendo la opción más compatible para un editor ligero sin dependencias pesadas.
- EPUB generado es **mínimo**; algunos lectores pueden ser exigentes con la estructura OPF/NCX.

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

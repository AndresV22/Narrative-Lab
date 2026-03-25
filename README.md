# Narrative Lab

Aplicación web **offline** para planificar, estructurar y escribir libros en el navegador. Usa **HTML**, **JavaScript (ES modules)** y **Tailwind CSS** (CDN), sin frameworks de UI ni backend.

## Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge).
- Servidor HTTP local para módulos ES y `fetch` de plantillas (`data/templates.json`). Abrir el archivo `index.html` directamente desde el disco (`file://`) puede fallar por CORS.

## Cómo ejecutarla

En la carpeta del proyecto:

```bash
python3 -m http.server 8765
```

Abre en el navegador: `http://localhost:8765`

(O usa cualquier servidor estático equivalente: `npx serve`, VS Code Live Server, etc.)

## Datos y copias de seguridad

- Los datos se guardan en **IndexedDB** en este origen (dominio/puerto).
- Usa **Exportar workspace (JSON)** en la barra lateral para una copia completa (libros, relaciones, snapshots, etc.).
- Puedes **importar** ese JSON con opciones de reemplazar todo o fusionar.

## Funciones principales

- Libros con metadatos (nombre, autor, fecha, categoría, narrador, estado, meta de palabras). **Nuevo libro** abre primero los metadatos y, al guardar, pasa a la sinopsis.
- Sinopsis, prólogo, epílogo, **extras** como bloques listables (crear, editar, guardar, eliminar), notas, capítulos con **objetivo del capítulo**, escenas (drag-and-drop; eliminar escena o capítulo).
- **Actos**: agrupa capítulos por acto (un capítulo solo en un acto).
- Personajes con ficha extendida e imagen (data URL); al guardar vuelve a la lista.
- **Línea de tiempo** unificada con eventos: crear, editar, ordenar y eliminar en la misma pantalla, más vista cronológica.
- **Relaciones** entre personajes y capítulos/escenas, y entre eventos.
- Editor enriquecido con barra de herramientas y atajos (Ctrl/Cmd+B, I, U; guión largo — con **Ctrl/Cmd+Shift+-** o **Opción+M** (Mac) / **Alt+M** (Windows)).
- **Ajustes** (barra lateral): intervalo de guardado automático y modo de actualización del panel de palabras (al espacio/punto o mientras escribes).
- **Frases destacadas**, búsqueda global, snapshots de versión, plantillas (novela, cuento, guion).
- Exportación del libro: Markdown, TXT, PDF (vía impresión del navegador), DOCX (CDN), EPUB mínimo (JSZip).

## Limitaciones

- `document.execCommand` está obsoleto pero sigue siendo la opción más compatible para un editor ligero sin dependencias.
- DOCX depende de la librería cargada por CDN; si falla, usa Markdown o PDF.
- EPUB generado es **mínimo**; algunos lectores pueden ser exigentes con la estructura OPF/NCX.

## Estructura del proyecto

```
index.html
assets/css/app.css
assets/js/*.js   (incluye prefs.js para ajustes locales)
components/shell.js
data/templates.json
```

## Licencia

Uso libre para tus proyectos personales y educativos.

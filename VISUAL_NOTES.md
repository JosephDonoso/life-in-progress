# Ajuste visual a la referencia

La imagen del usuario es la referencia de composición, no una especificación de contenido. Se conservaron la identidad Life in Progress y las funciones existentes.

Medidas comprobadas a 1536 × 1024: encabezado 66 px, búsqueda y acceso Google 38 px, márgenes principales 52 px, inicio de la panorámica en y=160, panorámica de 246 px y tira del carrusel de 101 px. El catálogo empieza en y=584 y presenta tres columnas. Las flechas recorren las seis escenas y vuelven al comienzo. En pantallas menores se ajusta la cantidad visible de miniaturas.

Se eliminaron el subtítulo del título, la etiqueta de acceso anticipado, el mini banner de la descripción, los textos añadidos dentro de la panorámica, la frase de la barra de acciones y el panel de cita. El aviso de demostración se movió al pie. El filtro de estado permanece al pie del catálogo. No se añadieron controles sin función para reproducir la referencia.

## Organización

- `src/App.tsx`: composición de la página.
- `src/sections/`: encabezado, presentación y carrusel, acciones, catálogo, estadísticas, barra lateral y diálogos de cuenta.
- `src/components/`: marca, acceso Google, buscador, barra de progreso, panel y tarjeta de logro reutilizables.
- `src/hooks/useCatalog.ts`: catálogo, filtros, orden y paginación.
- `src/hooks/useLifeProgress.ts`: sesión, perfil y operaciones de progreso.
- `src/hooks/useDialogFocus.ts`: teclado y foco de los diálogos.
- `src/styles/`: estilos separados por sección y controles compartidos.

## Recurso generado

Herramienta: image_gen integrada, sin CLI. Archivo final: `public/images/life-adventure.png`.

Prompt utilizado:

> Create a cinematic photorealistic panoramic website hero background, aspect ratio 3.8:1, no text no logos no UI. A lone young adult hiker with backpack standing on rocky cliff at the right third, looking over a sprawling European-style city and lake in a valley surrounded by mountains at sunset. Glowing warm orange sunset at center-right with dramatic clouds, cool dark navy blue shadows on the left half leaving negative space for a website title. Detailed realistic photography, cinematic game key art finish, atmospheric dusk. Match the wide photographic scenery seen on a dark PC videogame storefront. No lettering whatsoever.

La marca y los textos de la panorámica se construyen en HTML/SVG y permanecen independientes de la fotografía. Las escenas secundarias y el fondo de bosque utilizan fotografías de Unsplash. Se mantiene una marca propia con un mando de videojuegos, sin copiar el logotipo de Steam.

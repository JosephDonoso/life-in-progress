# Editar el catálogo

El archivo [catalogo.json](../catalogo.json) contiene los logros, las categorías y los umbrales de rareza. Puedes editarlo desde GitHub con el botón del lápiz. Los textos se escriben con lenguaje normal dentro de los campos; conserva las comillas, las comas y los corchetes propios del JSON. No es un intérprete de instrucciones libres.

## Qué puedes cambiar

| Campo                                  | Uso                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| `categorias[].clave`                   | Identificador interno. No cambies el de una categoría existente.                      |
| `categorias[].nombre`                  | Nombre visible de la categoría en español.                                            |
| `categorias[].ingles`                  | Nombre visible al elegir inglés.                                                      |
| `logros[].clave`                       | Identificador estable. No cambies el de un logro existente.                           |
| `nombre` y `descripcion`               | Título y explicación del logro.                                                       |
| `icono`                                | Emoji con imagen local o ruta/URL de una imagen, compartida entre catálogo y vitrina. |
| `categoria`                            | Clave de una de las categorías del archivo.                                           |
| `activo`                               | `true` para mostrarlo; `false` para retirarlo y conservar su historial.               |
| `fecha`                                | Fecha usada para ordenar: formato `2026-10-16T00:00:00.000Z`.                         |
| `porcentaje_demostracion`              | Porcentaje ilustrativo de 0 a 100, usado únicamente sin Supabase.                     |
| `ingles.nombre` y `ingles.descripcion` | Traducciones. Si omites el objeto `ingles`, se conserva el español como alternativa.  |
| `rarezas[].porcentaje_minimo`          | Porcentaje global de obtención a partir del cual corresponde esa rareza.              |

Las claves admiten letras minúsculas sin tildes, números y guiones. Cada clave y cada nombre deben ser únicos dentro de su lista. Las claves `vida-…` identifican las nuevas experiencias; algunas claves `demo-…` se conservan para mantener el progreso de experiencias equivalentes del catálogo anterior. Conserva todas estas claves aunque cambies los textos.

Para añadir un logro, copia un bloque de la lista `logros` y usa una clave y nombre nuevos. Ejemplo, para una categoría existente:

```json
{
  "clave": "mi-primer-proyecto",
  "nombre": "De la idea a la realidad",
  "descripcion": "Has creado y compartido un proyecto personal.",
  "icono": "🛠️",
  "categoria": "categoria-9",
  "activo": true,
  "fecha": "2026-10-16T00:00:00.000Z",
  "porcentaje_demostracion": 12,
  "ingles": {
    "nombre": "From idea to reality",
    "descripcion": "You have created and shared a personal project."
  }
}
```

Para crear una categoría, añade su clave, nombre e inglés a `categorias`, y usa esa clave en los logros correspondientes. No elimines una categoría que todavía esté referenciada. Las categorías antiguas de Supabase se conservan aunque dejen de figurar en el JSON.

### Imágenes de los logros

Los emojis del catálogo se muestran como imágenes SVG locales para que no dependan de las fuentes ni de la versión del sistema del visitante. Las 164 imágenes de Twemoji cubren los 206 logros actuales. Si añades un emoji nuevo, ejecuta `npm run icons:sync` y guarda los archivos generados junto con el catálogo. Esta descarga solo se hace al editar; los visitantes reciben las imágenes desde el propio sitio.

También puedes guardar una imagen propia en `public/images/` y usar, por ejemplo, `"icono": "images/mi-logro.png"`, o indicar una URL HTTPS. Las rutas locales respetan la carpeta del proyecto en GitHub Pages. El catálogo, «Mi aventura» y las vitrinas usan la misma imagen; si falla su carga se muestra una medalla como alternativa.

Los créditos y la licencia de las ilustraciones están en `public/images/achievements/ATTRIBUTION.txt` y `LICENSE-GRAPHICS.txt`.

## Rarezas y totales

Las cuatro rarezas siguen siendo **Común, Raro, Épico y Legendario**. Se evalúan de arriba hacia abajo: el primer umbral que alcanza el porcentaje de obtención determina la rareza. Conserva ese orden, con porcentajes mínimos estrictamente descendentes, entre 0 y 100; Legendario debe comenzar en 0.

Con los valores iniciales, un 50 % o más es Común; de 5 % a menos de 50 % es Raro; de 1 % a menos de 5 % es Épico; por debajo de 1 % es Legendario. La rareza de cada logro cambia con la actividad de los jugadores; no se asigna manualmente a cada entrada.

El total de logros se obtiene contando las entradas activas. Los jugadores, los desbloqueos, los porcentajes y los totales por categoría se calculan con los datos reales de Supabase. No hay campos para inventar esas estadísticas. `porcentaje_demostracion` permite diseñar y probar estados visuales en la demo.

## Aplicar cambios desde GitHub

1. Edita `catalogo.json` y guarda el cambio en `main`.
2. Abre **Actions → Deploy to GitHub Pages** y espera a que se genere el artefacto **catalogo-supabase**. Se prepara antes del despliegue del sitio, así que puede estar disponible aunque Pages falle después.
3. Descarga y descomprime el artefacto. Contiene `seed.sql`, `migrations/007_catalog_keys.sql` y `migrations/008_bilingual_search_index.sql`.
4. **Solo la primera vez:** ejecuta `007_catalog_keys.sql` en el SQL Editor de Supabase. Las migraciones 001–006 ya deben estar aplicadas. Esta migración vincula las entradas iniciales existentes a sus claves, conservando los UUID y desbloqueos.
5. Ejecuta el `seed.sql` del artefacto correspondiente a ese cambio. Puedes repetirlo: actualiza el catálogo sin crear usuarios ni borrar desbloqueos. Recarga la página para consultar los datos actualizados.

La migración 008 optimiza las búsquedas en español e inglés. Ejecútala una sola vez, después de la 007; no necesitas repetirla cada vez que cambies el catálogo.

El despliegue del frontend no modifica Supabase automáticamente. No se necesita añadir la contraseña de la base de datos ni una clave administrativa a GitHub para este flujo.

Si un dato es inválido, el workflow muestra un error indicando el campo. Corrige el JSON y vuelve a guardar.

## Aplicar cambios desde tu computador

```sh
npm run catalog:check
npm run catalog:generate
```

El primer comando valida el archivo. El segundo genera `supabase/seed.sql`. Aplica la migración 007 una sola vez y luego el SQL generado en el SQL Editor, como en los pasos anteriores. No edites `seed.sql` a mano: se regenera desde el JSON.

La demo consume el JSON directamente y el proceso de compilación lo valida. El modo conectado consulta el catálogo de Supabase: necesita que apliques el SQL generado.

## Renombrar y retirar logros

### Sustitución por la lista de ideas

El catálogo actual contiene los 206 logros y las 16 categorías de `ideas_logros.txt`, con sus títulos y descripciones exactos en español y traducciones completas al inglés. El archivo de texto es el borrador editorial; la página y el generador SQL usan `catalogo.json`.

Para actualizar una instalación existente, ejecuta `supabase/seed.sql` después de haber aplicado la migración 007. No hace falta vaciar tablas ni borrar jugadores. Las experiencias equivalentes conservan su clave anterior y sus desbloqueos; las entradas anteriores que ya no forman parte de la lista se desactivan conservando su historial. Las categorías sin logros activos dejan de aparecer en los filtros y estadísticas.

Los porcentajes ilustrativos del catálogo solo se utilizan en la demostración. En Supabase los porcentajes y rarezas se siguen calculando a partir de los jugadores reales.

Cambia `nombre`, `descripcion` o `categoria` manteniendo la misma `clave`. El UUID de Supabase y las relaciones con jugadores se conservan. Usa `activo: false` para retirar una experiencia; el historial queda almacenado y reaparece al reactivarla. Si quitas una entrada del JSON, la sincronización también la desactiva, siempre que haya sido vinculada previamente mediante su clave.

Los registros creados manualmente en Supabase sin clave editorial se conservan. Evita crear otros logros con el mismo nombre que una entrada administrada: los nombres son únicos y un conflicto detiene la actualización completa mediante una transacción.

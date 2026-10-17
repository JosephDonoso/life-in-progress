# Life in Progress

Una colección de logros para tu vida real. Descubre experiencias, registra las que has vivido y construye una vitrina con tus momentos favoritos.

Soy Joseph Donoso y creé Life in Progress como un pasatiempo para experimentar con el desarrollo web y explorar una idea: cómo serían los logros de un videojuego si hablaran de nuestras experiencias reales.

El proyecto está en su primer MVP. Las funciones, el diseño y el alcance pueden cambiar a medida que evolucione. Su estética se inspira en tiendas de videojuegos, con identidad propia e independiente de Steam.

## Funciones disponibles

- Catálogo inicial de 24 logros, con búsqueda, categorías y filtros por rareza y estado. El orden por rareza, porcentaje de jugadores, nombre o fecha se invierte al seleccionar de nuevo el mismo criterio.
- Logros pendientes atenuados y logros obtenidos a color, con marcos y brillo según su rareza.
- «Mi aventura»: listado personal y global, proporciones de obtención, orden del más al menos conseguido y carga progresiva mediante «Ver más».
- Registro, acceso y recuperación de contraseña por correo; integración de Google preparada para configurar su proveedor.
- Perfil editable con nombre, foto, privacidad y vitrina de hasta tres logros.
- Comunidad de perfiles públicos y solicitudes de amistad, sin chat.
- Interfaz en español e inglés, detección del idioma del sistema y diseño adaptable a móvil y escritorio.
- Modo de demostración sin backend y modo conectado con persistencia en Supabase.

## Tecnologías y organización

| Tecnología          | Uso                                                          |
| ------------------- | ------------------------------------------------------------ |
| React y TypeScript  | Interfaz, componentes y estados                              |
| Vite                | Desarrollo local y compilación                               |
| Supabase            | Auth, PostgreSQL, políticas RLS y almacenamiento de avatares |
| CSS y Lucide        | Estilo visual e iconos de controles                          |
| Playwright y PGlite | Pruebas de interfaz y base de datos                          |
| GitHub Actions      | Compilación y publicación en GitHub Pages                    |

```text
src/
  components/     Controles y elementos reutilizables
  sections/       Secciones de la página y diálogos
  hooks/          Sesión, catálogo, progreso y comunidad
  i18n/           Idioma del sistema y traducciones
  styles/         Estilos por sección
  App.tsx         Composición de la aplicación
  service.ts      Cliente de Supabase y tipos de progreso
  config.ts       Enlaces del proyecto y del autor
public/           Recursos estáticos
supabase/
  migrations/     Esquema, funciones, permisos y evolución de la base
  seed.sql        Categorías y catálogo inicial bilingüe
tests/            Pruebas de interfaz y PostgreSQL
```

Las medidas de la referencia, decisiones de composición y recursos gráficos se documentan en [VISUAL_NOTES.md](VISUAL_NOTES.md).

## Ejecutar

Requiere Node.js 24 y npm.

```sh
npm ci
npm run dev
```

Sin variables de entorno se activa una demostración claramente identificada: 24 experiencias, porcentajes ilustrativos y progreso en localStorage. No simula una autenticación real de Google. Pulsa «Entrar en la demostración» para probar el marcado, los favoritos y el perfil. El progreso local permanece entre visitas, pero no se sincroniza con otras cuentas ni dispositivos.

### Variables de entorno

Para conectar el backend, crea `.env.local` a partir de [.env.example](.env.example). En PowerShell:

```powershell
Copy-Item .env.example .env.local
```

| Variable                        | Propósito                                      |
| ------------------------------- | ---------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL del proyecto de Supabase                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública publishable del mismo proyecto   |
| `VITE_KOFI_URL`                 | Opcional: reemplaza el enlace de apoyo a Ko-fi |

Completa los dos valores de Supabase antes de iniciar el servidor. Los valores de ejemplo son marcadores y no conectan a un proyecto real. Para usar la demo, deja ambas variables de Supabase vacías o no crees `.env.local`. La demo y las cuentas reales mantienen progresos separados; no hay importación automática entre ambos modos.

Todo valor `VITE_*` se incorpora al código del navegador. `.env.local` está excluido de Git: no agregues allí ni a las variables del cliente contraseñas de PostgreSQL, claves secret/service_role o el secreto OAuth de Google.

## Conectar Supabase

1. Crea un proyecto de Supabase y ejecuta todas las migraciones de `supabase/migrations` en orden: `001_initial.sql`, `002_community_profiles.sql`, `003_avatar_storage.sql`, `004_catalog_languages.sql`, `005_achievement_showcases.sql` y `006_catalog_sort_directions.sql`. Ejecuta cada migración una sola vez. En un proyecto existente aplica solo las que falten.
2. Ejecuta `supabase/seed.sql` para cargar categorías, 24 logros iniciales y sus traducciones inglesas. No contiene usuarios ni porcentajes ficticios. Puede repetirse para completar traducciones después de una actualización.
3. Copia `.env.example` como `.env.local`. Completa la URL y la clave **publishable** del proyecto. Nunca utilices una clave secret/service_role en el cliente.
4. En Authentication / Sign In / Providers verifica que **Email** y la creación de cuentas estén habilitados. Google es opcional.
5. Configura Site URL y las Redirect URLs permitidas: `http://127.0.0.1:5173/`, `http://localhost:5173/` si lo usas, y la dirección final de GitHub Pages, incluida la ruta del repositorio y su barra final.
6. Reinicia el servidor. La demo se desactiva por completo cuando existen las dos variables. Un fallo de conexión muestra un error y nunca vuelve silenciosamente a datos ficticios.

### Acceso por correo y contraseña

Pulsa «Iniciar sesión» y luego «Crear cuenta». Introduce nombre visible, correo y una contraseña de al menos 8 caracteres, repetida para evitar errores. Si Supabase exige confirmación, abre el enlace recibido antes de entrar. Al crear la cuenta, el trigger existente prepara el perfil privado; no hay migraciones adicionales para este acceso. Los logros, favoritos, nombre, foto y privacidad usan las mismas tablas y políticas que Google.

«Olvidé mi contraseña» solicita un correo de recuperación. Su enlace vuelve a la aplicación y abre el formulario para elegir una nueva contraseña. El cliente de Supabase conserva la sesión entre recargas; la aplicación no guarda la contraseña. La confirmación y recuperación requieren que la URL de retorno esté autorizada en Supabase.

Sin SMTP personalizado, el servicio de correo de Supabase solo entrega a direcciones del equipo del proyecto y tiene un límite reducido (actualmente dos mensajes por hora). Para probar usa el correo con el que administras Supabase. Para otros destinatarios configura SMTP. Consulta las guías oficiales de [contraseñas](https://supabase.com/docs/guides/auth/passwords) y [envío de correos](https://supabase.com/docs/guides/auth/auth-smtp).

Para comprobar el guardado real: entra, marca un logro, modifica tu perfil, recarga la página y vuelve a entrar después de cerrar sesión. En Supabase puedes verificar la cuenta en Authentication / Users, el perfil en `profiles` y los desbloqueos en `user_achievements`.

### Google (opcional)

En Google Cloud configura un cliente OAuth web y su pantalla de consentimiento. Usa la URL de callback indicada por Supabase como URI de redirección autorizada. Activa Google en Authentication / Providers e introduce allí el client ID y el client secret. El secreto solo se configura en Supabase. El botón «Continuar con Google» del diálogo estará operativo cuando completes esa configuración.

Una cuenta de correo confirmado se enlaza automáticamente al entrar con Google usando exactamente la misma dirección. Se conserva el usuario de Supabase y, por tanto, el perfil y los logros asociados. Para direcciones diferentes Supabase ofrece vinculación manual mediante `linkIdentity`, que requiere habilitar esa opción y añadir su control a la interfaz; este MVP todavía no incluye ese control. [Guía oficial de vinculación](https://supabase.com/docs/guides/auth/auth-identity-linking).

Supabase Auth administra usuarios, identidades externas y sesiones. Un trigger crea el perfil privado. RLS restringe el progreso a su propietario. Los desbloqueos usan una clave primaria compuesta y upsert idempotente. Los favoritos referencian únicamente desbloqueos existentes y se eliminan en cascada al desmarcar. Las estadísticas públicas se exponen mediante funciones que devuelven agregados, sin identidades individuales. Los umbrales se administran en `rarity_thresholds`.

Las rarezas actuales son común (50–100 %), raro (5–menos de 50 %), épico (1–menos de 5 %) y legendario (menos de 1 %). La migración 002 reemplaza la clasificación anterior.

## Perfiles, comunidad e idioma

«Ver tu perfil» permite editar nombre y foto (JPG, PNG o WebP, hasta 2 MB). El navegador prepara una imagen cuadrada WebP de 256 px. La demo guarda los cambios localmente; con Supabase se guardan en `profiles` y en el bucket `avatars`. Solo el propietario puede subir o modificar su archivo. Las fotos del bucket son públicas mediante su URL; la visibilidad del perfil controla el directorio y la información de la comunidad.

Comunidad permite explorar perfiles públicos, ver su progreso total y vitrina elegida, enviar y cancelar solicitudes de amistad, aceptarlas o rechazarlas y eliminar amistades. Los perfiles son privados por defecto. Las experiencias individuales permanecen privadas, incluso en perfiles públicos. Las solicitudes y amistades solo son visibles para sus participantes. Si un amigo vuelve privado su perfil, se ocultan su nombre, foto y progreso del listado; la relación se puede eliminar. No hay chat.

Las vitrinas del propietario y de otros jugadores usan miniaturas con el mismo icono, marco y rareza dinámica del catálogo. El nombre y la descripción se muestran al pasar el cursor o enfocar la miniatura con el teclado. El interruptor público/privado está al comienzo de «Ver tu perfil» y guarda la preferencia inmediatamente.

«Mi aventura» abre un listado independiente con progreso personal, búsqueda y pestañas de logros propios/globales. Carga 12 filas al inicio y el botón pequeño «Ver más» añade otras 12 desde el servidor, conservando las anteriores; desaparece al completar los resultados. La búsqueda y el cambio de pestaña reinician la lista. Ordena siempre del más al menos conseguido. El fondo de cada fila ocupa exactamente el porcentaje global de jugadores que lo desbloquearon. Los pendientes se muestran atenuados; se pueden marcar o desmarcar desde la misma lista.

La demo incluye tres perfiles de ejemplo y una solicitud entrante para probar el recorrido, identificados expresamente como demostración. La base de datos de producción no recibe esos perfiles ni amistades ficticias.

El selector del encabezado permite Auto, ES o EN. Auto usa inglés o español según el idioma principal del sistema y español para otros idiomas; la selección manual se guarda en este dispositivo. El catálogo inicial tiene traducciones completas. Para nuevos logros agrega `translations.en.name` y `translations.en.description` al JSON de `achievements`; si faltan, se conserva el texto español. La búsqueda del servidor encuentra textos en ambos idiomas.

El botón «Seguir» abre el repositorio del proyecto y el botón oficial de Ko-fi, enlazado a `https://ko-fi.com/jdevshowcase`. Puedes cambiar el destino mediante `VITE_KOFI_URL` en `.env.local` o como variable del repositorio antes de compilar. Los enlaces se centralizan en `src/config.ts`.

## Catálogo y administración

Las categorías residen en PostgreSQL. El catálogo se consulta desde el servidor en páginas de 12 con búsqueda, categoría, rareza, estado y orden. Hay índices para búsqueda y relaciones. Las agregaciones se calculan al consultar: para un volumen elevado de jugadores convendrá medir y añadir contadores o una vista materializada.

Los porcentajes conectados se calculan a partir de los jugadores y desbloqueos registrados; los valores ilustrativos solo existen en la demo. La rareza cambia con el porcentaje global de obtención.

Para este MVP, administra el catálogo en el Table Editor de Supabase con una cuenta administrativa: permite crear, editar, desactivar e importar CSV sin cambiar el código. Importa categorías primero; el CSV de logros debe incluir `name,description,icon,category_id,active`. Omite `id` para generar UUID automáticamente. Los nombres tienen restricción única. No concedas permisos de escritura del catálogo a clientes anónimos o autenticados. `image_url` queda disponible para ilustraciones futuras; la interfaz inicial utiliza iconos emoji.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila y publica al recibir cambios en `main` o al ejecutarse manualmente. En Settings / Pages elige GitHub Actions. Si tu rama principal tiene otro nombre, modifica el filtro del workflow. Configura las variables del repositorio `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` antes de compilar para producción. Sin ellas se publicará la demo. La aplicación utiliza rutas relativas y navegación interna sin rutas de servidor.

Agrega esas variables en Settings / Secrets and variables / Actions / Variables. `VITE_KOFI_URL` es opcional: el enlace de JDevShowcase ya está definido como valor predeterminado. Reinicia el workflow después de cambiar variables, porque se incorporan durante la compilación.

Si publicas con la dirección estándar del repositorio, autoriza también `https://josephdonoso.github.io/life-in-progress/` como URL de retorno en Supabase. El workflow despliega el frontend; las migraciones y la configuración de Auth se aplican por separado en Supabase.

## Verificar

```sh
npm run build
npm run lint
npm run test:db
npx playwright install chromium
npm test
```

Las pruebas cubren el recorrido local, persistencia, favoritos, búsqueda, estados vacíos, galería, medidas de la referencia, desbordamiento móvil, edición de perfil y foto, amistades, enlaces e idioma del sistema y manual. El acceso por correo se prueba con respuestas aisladas de Auth y PostgREST: registro pendiente de confirmación, credenciales incorrectas, sesión tras recargar, solicitudes de guardado de logros/perfil, cierre de sesión y recuperación de contraseña. Los servidores de prueba usan los puertos 5174 (demo) y 5175 (Auth simulado), sin usar las credenciales reales de `.env.local` ni enviar correos. Las capturas se generan en `test-results`. Las pruebas de PostgreSQL embebido validan migraciones, semillas, aislamiento RLS entre usuarios, idempotencia, porcentajes reales, favoritos, edición de perfil, privacidad del directorio, autorización de solicitudes, acceso a avatares y búsquedas inglesas. El motor embebido usa un esquema simulado de Storage y no incluye pg_trgm; la extensión y su índice se excluyen de esta prueba. El envío de correo, la autenticación y las subidas de fotos reales requieren una comprobación manual con tu cuenta.

## Alcance actual y límites

Incluye catálogo bilingüe, registro y acceso por correo, recuperación de contraseña, perfil editable, vitrina de hasta tres favoritos, guardado optimista con reversión de errores, estadísticas generales y personales, comunidad con perfiles públicos y amistades, y adaptaciones móvil/escritorio. Los perfiles públicos se consultan desde Comunidad; todavía no cuentan con una URL individual compartible. No se incluyen chat, Steam ni noticias. Google requiere configurar su proveedor OAuth; el acceso por correo permite probar Supabase de forma independiente.

Fotografías remotas de Unsplash y tipografías de Google Fonts: requieren conexión; la composición conserva colores y fuentes alternativas si no cargan.

## Autor y apoyo

Desarrollado por [JosephDonoso](https://github.com/JosephDonoso), bajo [JDevShowcase](https://jdevshowcase.github.io/showcase/).

Puedes seguir el [repositorio](https://github.com/JosephDonoso/life-in-progress), compartir ideas mediante sus [issues](https://github.com/JosephDonoso/life-in-progress/issues) o apoyar el proyecto en [Ko-fi](https://ko-fi.com/jdevshowcase).

Proyecto independiente, sin afiliación con Steam o Valve. La panorámica principal es un recurso generado para este proyecto; las fotografías secundarias son ilustrativas de Unsplash.

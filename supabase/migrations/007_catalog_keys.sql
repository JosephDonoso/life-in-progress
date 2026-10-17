-- Stable editorial keys preserve achievement IDs and player progress on rename.
alter table public.categories add column catalog_key text unique;
alter table public.achievements add column catalog_key text unique;

-- Adopt pre-existing MVP entries before any editorial renames.
update public.categories as existing set catalog_key=initial.clave from (values
('categoria-1','Infancia y crecimiento'),
('categoria-2','Salud y cuerpo'),
('categoria-3','Educación'),
('categoria-4','Trabajo y profesión'),
('categoria-5','Amor y relaciones'),
('categoria-6','Familia y amistades'),
('categoria-7','Viajes y exploración'),
('categoria-8','Naturaleza y animales'),
('categoria-9','Tecnología e Internet'),
('categoria-10','Deportes y actividades'),
('categoria-11','Cultura y entretenimiento'),
('categoria-12','Experiencias extraordinarias'),
('categoria-13','Situaciones desafortunadas'),
('categoria-14','Acontecimientos cotidianos')) as initial(clave,nombre) where existing.catalog_key is null and existing.name=initial.nombre;
update public.achievements as existing set catalog_key=initial.clave from (values
('demo-0','¡Rómpete una pierna!'),
('demo-1','Mi primer vuelo'),
('demo-2','Corazón roto'),
('demo-3','Bajo las estrellas'),
('demo-4','Vuelta al mundo'),
('demo-5','Un año más'),
('demo-6','Primera sangre'),
('demo-7','Sin conexión'),
('demo-8','El primer capítulo'),
('demo-9','Día de pago'),
('demo-10','Tu propia cima'),
('demo-11','En primera fila'),
('demo-12','Un nuevo hogar'),
('demo-13','Compañero de aventuras'),
('demo-14','Mesa para todos'),
('demo-15','Salto de fe'),
('demo-16','A contracorriente'),
('demo-17','Pequeñas victorias'),
('demo-18','Pantalla azul'),
('demo-19','Sobre dos ruedas'),
('demo-20','Otro idioma'),
('demo-21','El gran estreno'),
('demo-22','Kilómetro cero'),
('demo-23','Un amanecer distinto')) as initial(clave,nombre) where existing.catalog_key is null and existing.name=initial.nombre;

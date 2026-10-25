# Supabase · Plan para la web IsiVoltPro

## Objetivo

Supabase será el backend de las funciones dinámicas de la web corporativa, no del contenido visual estático.

Astro seguirá renderizando:
- marca;
- ecosistema;
- aplicaciones;
- recursos públicos;
- páginas legales;
- contenido editorial.

Supabase gestionará:
- autenticación;
- perfiles;
- organizaciones;
- contactos;
- futuras empresas/publicaciones;
- leads;
- almacenamiento controlado;
- permisos.

## Variables del frontend

Permitidas en navegador:

`PUBLIC_SUPABASE_URL`

`PUBLIC_SUPABASE_ANON_KEY`

Nunca exponer:

`SUPABASE_SERVICE_ROLE_KEY`

La service role solo puede vivir en funciones de servidor/Edge Functions o secretos del entorno.

## Modelo inicial

### profiles
Perfil ligado a `auth.users`.

Campos base:
- id;
- display_name;
- avatar_url;
- phone;
- created_at;
- updated_at.

### organizations
Empresas/organizaciones que utilizan o participan en el ecosistema.

Campos base:
- id;
- name;
- slug;
- status;
- website;
- logo_path;
- created_at.

### organization_members
Relación usuario-organización.

Roles iniciales:
- owner;
- admin;
- member.

### contact_requests
Consultas comerciales y técnicas.

Campos:
- id;
- name;
- email;
- company;
- phone opcional;
- subject;
- message;
- source_page;
- status;
- created_at.

Estados:
- new;
- reviewing;
- contacted;
- closed;
- spam.

### company_profiles
Base para la futura sección de empresas/profesionales.

Campos:
- id;
- organization_id;
- public_name;
- description;
- province;
- municipality;
- website;
- phone;
- email_public;
- logo_path;
- cover_path;
- status;
- published_at.

Estados:
- draft;
- pending_review;
- published;
- suspended.

### company_services
Servicios/categorías que ofrece cada empresa.

### company_media
Imágenes y documentos públicos aprobados.

### leads
Solicitudes generadas desde una ficha de empresa.

### sponsorships
Preparación para publicidad/promoción futura.

No implementar cobros hasta definir producto, fiscalidad, precios y moderación.

## Contacto

El formulario actual solo prepara un correo. La evolución recomendada:

Navegador
→ Cloudflare Turnstile
→ Supabase Edge Function `submit-contact`
→ validación
→ inserción en `contact_requests`
→ notificación por correo opcional.

La web no debe insertar contactos directamente con privilegios elevados desde el navegador.

## Perfil

Ruta futura:

`/perfil`

Funciones por fases:

### Fase 1
- iniciar/cerrar sesión;
- nombre y avatar;
- organización;
- preferencias.

### Fase 2
- acceso a aplicaciones vinculadas;
- solicitudes/demos;
- empresa o perfil profesional.

### Fase 3
- administración de publicación comercial;
- leads;
- plan contratado;
- métricas básicas.

## Publicación de empresas

Una empresa nunca pasa directamente de edición a publicación pública.

Flujo:

`draft → pending_review → published`

IsiVoltPro conserva moderación.

Esto permite más adelante:
- directorio profesional;
- patrocinio;
- fichas destacadas;
- solicitudes comerciales;
- publicidad local/sectorial.

## Seguridad

Obligatorio:
- RLS activado en todas las tablas expuestas;
- políticas por usuario y organización;
- ninguna service role en JavaScript público;
- validación en Edge Functions;
- rate limit/contact anti-spam;
- Turnstile en formularios públicos;
- buckets privados por defecto;
- URLs firmadas cuando corresponda;
- auditoría de cambios sensibles.

## Contenido técnico

Los artículos, documentación pública y textos editoriales permanecerán inicialmente en GitHub.

Ventajas:
- revisión por PR;
- historial;
- SEO estático;
- velocidad;
- no depender de una base de datos para cargar contenido público.

Un CMS podrá añadirse más adelante si el volumen lo justifica.

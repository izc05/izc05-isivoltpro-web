# Despliegue del acceso único IsiVoltPro

Este documento fija el orden para montar la identidad central sin interrumpir OT, Herramientas QR/NFC ni los servicios existentes del mini PC.

## Principio de despliegue

La identidad central se instala primero en paralelo. Las aplicaciones actuales siguen funcionando hasta completar su migración y pruebas. No se cambia un dominio de producción ni se elimina un sistema de acceso antiguo en el mismo paso en que se estrena el nuevo.

## Fase 0 — Inventario y copia verificable

Antes de aplicar migraciones:

- identificar el proyecto Supabase de producción y sus puertos;
- registrar versión de Supabase, PostgreSQL y Auth;
- exportar esquema y datos;
- verificar restauración en un entorno de prueba;
- guardar configuración de Cloudflare Tunnel;
- inventariar usuarios actuales de OT;
- inventariar cuentas Firebase de Preinspecciones sin copiar contraseñas;
- inventariar cuentas y datos de Herramientas QR/NFC;
- documentar dominios, contenedores y servicios systemd.

Criterio de salida: una restauración de prueba completa y documentada.

## Fase 1 — Esquema central

Aplicar la migración `20260805220000_platform_identity_foundation.sql` primero en staging.

Validaciones mínimas:

1. Las tablas existen y tienen RLS activo.
2. Un usuario sin perfil activo no obtiene aplicaciones.
3. Una cuenta activa sin membresía no obtiene aplicaciones.
4. Una membresía activa sin permiso no abre módulos.
5. Un permiso caducado queda bloqueado.
6. Un permiso activo sin consentimiento exige aceptación.
7. Un usuario suspendido queda bloqueado en todas las organizaciones.
8. Una organización suspendida bloquea a todos sus miembros.
9. Un administrador de una organización no puede leer otra organización.
10. El rol `service_role` puede ejecutar el flujo administrativo desde servidor.

## Fase 2 — Propietario inicial

Crear la cuenta propietaria mediante un procedimiento administrativo de servidor.

- correo verificado;
- `platform_role = owner`;
- `account_status = active`;
- MFA configurado;
- códigos de recuperación custodiados fuera del mini PC;
- sesión de navegador comprobada;
- evento de bootstrap registrado en auditoría.

No se inserta una contraseña en SQL ni en el repositorio.

## Fase 3 — Configuración de Auth

- desactivar registro público;
- configurar URL pública del portal;
- configurar redirecciones permitidas exactas;
- configurar SMTP;
- limitar intentos y frecuencia;
- definir duración de sesión y renovación;
- impedir redirecciones abiertas;
- revisar plantillas de invitación y recuperación;
- habilitar MFA;
- confirmar que la clave `service_role` solo existe en el servidor.

## Fase 4 — Portal `app.isivoltpro.com`

Desplegar como servicio independiente detrás del gateway existente.

Rutas iniciales:

- `/login`
- `/recover`
- `/mfa`
- `/apps`
- `/profile`
- `/privacy/:applicationCode`
- `/admin/requests`
- `/admin/organizations`
- `/admin/users`
- `/admin/audit`

La interfaz no concede permisos directamente. Toda aprobación llama a una función de servidor que:

1. valida que el actor es propietario o administrador autorizado;
2. invita o recupera el usuario;
3. crea perfil, membresía y permisos en una transacción;
4. registra auditoría;
5. devuelve un resultado sin secretos.

## Fase 5 — Solicitud pública

El formulario público no llama directamente a funciones administrativas.

Controles obligatorios:

- validación de campos en servidor;
- limitación por IP y correo;
- protección antispam;
- campo trampa invisible;
- tamaño máximo de texto;
- aceptación explícita de privacidad;
- respuesta neutra para evitar enumeración de usuarios;
- notificación administrativa sin incluir datos sensibles innecesarios.

## Fase 6 — Migración de OT

OT será la primera aplicación integrada porque ya utiliza Supabase Auth y RLS.

Pasos:

1. relacionar los usuarios existentes con `platform_profiles`;
2. crear organización y membresías sin cambiar sus contraseñas;
3. conceder `application_code = ot` y mapear roles;
4. añadir guardia central antes de cargar el módulo;
5. conservar las políticas RLS propias de OT;
6. probar administrador, coordinador, técnico, consulta, suspendido y sin permiso;
7. activar acceso desde el portal;
8. mantener una ventana de reversión documentada.

## Fase 7 — Migración de Preinspecciones BT

Preinspecciones se prueba primero como beta separada.

- no fusionar la PR principal antes de adaptar identidad;
- sustituir Firebase por el cliente Supabase compartido;
- conservar PocketBase temporalmente como motor de sincronización;
- validar el JWT de Supabase en servidor antes de aceptar sincronización;
- usar el `sub` del token como identificador de usuario;
- impedir que el cliente envíe un `user_id` arbitrario;
- conservar aislamiento por empresa, asignación, evidencias y cierre GPS;
- compilar una APK beta con identidad y almacenamiento separados;
- ejecutar la prueba E2E completa.

## Fase 8 — Herramientas QR/NFC

La migración debe conservar inventario, fotografías e historial.

- exportación y copia previa;
- asignación de propietario de datos;
- permiso central `herramientas_qr`;
- sincronización autorizada por usuario y empresa;
- prueba específica de cámara, galería, QR, NFC y creación de herramientas en Android.

## Pruebas de aceptación globales

### Seguridad

- acceso sin sesión: bloqueado;
- sesión válida sin permiso: bloqueado;
- permiso de otra empresa: bloqueado;
- usuario suspendido: bloqueado;
- permiso caducado: bloqueado;
- consentimiento antiguo: bloqueado hasta nueva aceptación;
- cambio de rol: efectivo sin reiniciar el servidor;
- cierre de sesiones: invalida los clientes;
- secretos: ausentes de HTML, JavaScript, APK y repositorio.

### Operación

- solicitud → aprobación → invitación → alta → aplicación;
- rechazo de solicitud;
- suspensión y reactivación;
- concesión y retirada de una sola aplicación;
- varios roles en aplicaciones distintas;
- auditoría completa;
- copia y restauración.

## Reversión

Cada despliegue debe registrar:

- commit publicado;
- migraciones aplicadas;
- copia de base de datos;
- imagen o archivos anteriores;
- comandos de reversión;
- comprobaciones HTTP y de salud;
- responsable y hora.

Nunca se revierte eliminando usuarios o expedientes. Se revierte código/configuración y se preserva la trazabilidad.

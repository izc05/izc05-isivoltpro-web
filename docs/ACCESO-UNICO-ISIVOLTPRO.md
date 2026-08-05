# Acceso único de IsiVoltPro

## Decisión cerrada

IsiVoltPro tendrá una identidad única para todo el ecosistema. Ninguna aplicación nueva podrá crear su propio sistema independiente de usuarios.

- Proveedor central de identidad: **Supabase Auth autohospedado**.
- Portal privado: `app.isivoltpro.com`.
- Web pública y solicitud de acceso: `isivoltpro.com/acceso`.
- Aplicaciones actuales:
  - `ot.isivoltpro.com`
  - `bt.isivoltpro.com`
  - `qr.isivoltpro.com`
- La autenticación responde **quién es el usuario**.
- La autorización responde **a qué empresa, aplicación y función puede acceder**.
- Tener una cuenta no concede acceso automático a ninguna aplicación.

## Flujo de alta

1. La persona completa una solicitud de acceso pública.
2. La solicitud queda en estado `pending`; todavía no existe una cuenta activa.
3. El propietario de IsiVoltPro revisa identidad, empresa, motivo y aplicaciones solicitadas.
4. El propietario aprueba o rechaza.
5. Una función de servidor crea o invita al usuario mediante Supabase Admin API.
6. El usuario define su propia contraseña y verifica el correo.
7. El propietario concede una membresía de empresa y permisos por aplicación.
8. En el primer acceso a cada aplicación, el usuario revisa qué datos utiliza y acepta su versión de privacidad.
9. El portal muestra únicamente las aplicaciones autorizadas.

Las claves `service_role`, SMTP y secretos de invitación no pueden aparecer en el navegador, repositorio, APK ni variables públicas de Vite.

## Roles

### Plataforma

- `owner`: control del ecosistema, solicitudes, organizaciones, aplicaciones, auditoría y suspensiones.
- `user`: cuenta normal; sus capacidades proceden de las membresías y permisos.

### Organización

- `owner`: propietario de la empresa.
- `admin`: administra usuarios y permisos de su empresa dentro de los límites concedidos.
- `coordinator`: coordina trabajo, sin administrar la plataforma.
- `member`: usuario operativo.
- `read_only`: consulta sin modificación.

### Aplicación

Cada aplicación conserva sus funciones propias mediante `role_code`:

| Aplicación | Funciones iniciales |
|---|---|
| OT | `admin_cliente`, `coordinador`, `tecnico`, `solo_consulta` |
| Preinspecciones BT | `administrador`, `coordinador`, `tecnico`, `solo_consulta` |
| Herramientas QR/NFC | `administrador`, `gestor`, `tecnico`, `solo_consulta` |

El rol general de una organización no sustituye el permiso específico de aplicación.

## Estados y bloqueo

Una sesión solo puede abrir una aplicación cuando se cumplen simultáneamente estas condiciones:

- cuenta `active`;
- organización `active`;
- membresía `active`;
- permiso de aplicación `active` y no caducado;
- aplicación en `beta` o `active`;
- consentimiento vigente para la versión de privacidad de esa aplicación;
- nivel MFA requerido por la aplicación y función sensible.

Una suspensión central debe bloquear todas las aplicaciones sin borrar expedientes, fotografías, informes ni auditoría.

## MFA

Fase beta:

- obligatorio para el propietario de la plataforma;
- obligatorio para administradores de empresa;
- recomendado para coordinadores y técnicos.

Antes de producción:

- obligatorio para todos los perfiles con capacidad de modificar, asignar, cerrar, exportar o administrar;
- recuperación de cuenta documentada;
- cierre de todas las sesiones disponible desde administración.

## Datos y transparencia

Cada aplicación declara en `platform_applications`:

- resumen de uso de datos;
- categorías de datos;
- versión de privacidad;
- dirección de acceso;
- nivel mínimo de autenticación.

El usuario acepta por aplicación y versión. Un cambio material incrementa `privacy_version` y fuerza una nueva aceptación antes de abrir el módulo.

## Reglas de seguridad obligatorias

1. Registro público de Supabase desactivado.
2. Alta exclusivamente por aprobación e invitación administrativa.
3. RLS habilitado en todas las tablas con datos de usuario o empresa.
4. El frontend nunca decide por sí solo permisos efectivos.
5. Archivos en buckets privados y descargas con URL temporal.
6. Ningún secreto en variables `VITE_*` salvo claves públicas anónimas.
7. Auditoría de aprobaciones, invitaciones, permisos, suspensiones, accesos denegados y cambios de rol.
8. Separación estricta por organización.
9. Copias de seguridad verificadas antes de migrar usuarios existentes.
10. Entornos de prueba y producción separados.

## Componentes que se construirán

```text
isivoltpro.com/acceso
  Formulario público y explicación de datos

app.isivoltpro.com
  Inicio de sesión
  Recuperación y MFA
  Mis aplicaciones
  Mi perfil y sesiones
  Aceptación de privacidad

app.isivoltpro.com/admin
  Solicitudes pendientes
  Organizaciones
  Usuarios
  Permisos por aplicación
  Invitaciones
  Suspensiones
  Auditoría
```

## Integración de aplicaciones

Cada aplicación debe implementar un adaptador común:

1. Leer la sesión de Supabase Auth.
2. Consultar `platform_my_applications()` o `platform_can_launch_app(code)`.
3. Bloquear antes de cargar datos cuando no exista autorización.
4. Usar el mismo `auth.uid()` como identificador estable.
5. Mantener sus permisos de negocio en servidor/RLS.
6. Volver al portal al cerrar sesión.
7. No crear usuarios locales independientes.

## Orden de ejecución

### Fase 1 — Base de identidad

- Migración central de tablas, RLS, funciones y catálogo.
- Propietario inicial de plataforma.
- Desactivación del registro público.
- SMTP e invitaciones administrativas.

### Fase 2 — Portal

- Solicitud pública con protección antispam y limitación de frecuencia.
- Inicio de sesión y recuperación.
- Panel `Mis aplicaciones`.
- Panel administrativo de aprobación y permisos.
- Consentimientos y MFA.

### Fase 3 — OT

- Mapear usuarios actuales con `auth.users`.
- Añadir comprobación central `ot`.
- Mantener RLS y roles de OT.
- Verificar que la suspensión central bloquea la aplicación.

### Fase 4 — Preinspecciones BT

- Conservar la rama funcional y la sincronización existente.
- Sustituir Firebase Auth por Supabase Auth central.
- Usar `auth.uid()` en asignaciones, archivos, cierre GPS y auditoría.
- Desplegar la beta solo después de la prueba E2E.

### Fase 5 — Herramientas QR/NFC

- Migrar identidad sin perder inventario ni fotografías locales.
- Separar claramente datos locales, sincronizados y permisos de servidor.

## Criterio para añadir nuevas aplicaciones

Una nueva aplicación no entra en el ecosistema hasta que:

- figure en `platform_applications`;
- describa sus datos y versión de privacidad;
- valide el permiso central;
- aplique autorización de servidor;
- tenga auditoría y procedimiento de suspensión;
- haya superado una prueba con usuario sin permiso, usuario permitido y usuario suspendido.

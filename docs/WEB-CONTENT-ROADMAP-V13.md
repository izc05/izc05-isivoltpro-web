# IsiVoltPro Web · Mapa de contenidos V13

## Objetivo

La web debe hacer tres cosas con claridad:

1. explicar qué es IsiVoltPro;
2. demostrar que ya existen productos reales;
3. convertir interés en contacto, demo, registro o relación comercial.

## Inicio

Debe ser la página más visual.

Bloques:
- hero premium;
- propuesta de valor;
- Herramientas QR/NFC y OT visibles como aplicaciones publicadas;
- cuatro pilares del ecosistema;
- flujo Detectar → Gestionar → Optimizar → Evolucionar;
- aplicaciones;
- seguridad/infraestructura;
- recursos;
- CTA.

Movimiento:
- parallax por capas;
- scroll reveal;
- microanimaciones;
- sin bloquear lectura ni rendimiento.

## Ecosistema

Debe responder:
- qué conecta IsiVoltPro;
- qué funciona hoy;
- qué viene después;
- cómo comparten contexto las aplicaciones.

No presentar todas las piezas futuras como terminadas.

## Aplicaciones

### Publicadas
- Herramientas QR/NFC.
- IsiVoltPro OT.

Cada una debe tener:
- explicación;
- capturas reales;
- flujo;
- estados;
- ventajas;
- botón Abrir aplicación;
- botón Contactar/Solicitar demo.

### En desarrollo / roadmap
- Inspecciones BT;
- activos;
- inventario;
- RITE;
- PCI;
- legionella;
- refrigeración;
- documentación;
- utilidades.

## Información técnica / Recursos

Debe crecer como biblioteca técnica:
- mantenimiento;
- electricidad;
- climatización;
- PCI;
- agua;
- digitalización;
- inspecciones;
- buenas prácticas.

Fase inicial: contenido estático versionado en GitHub.

## Sobre IsiVoltPro

Ya existe.

Debe seguir explicando:
- origen;
- propósito;
- misión;
- visión;
- principios de producto;
- estados reales de cada aplicación.

## Infraestructura y seguridad

Ya existe.

Debe explicar sin revelar secretos:
- opción cloud;
- opción servidor propio;
- control de datos;
- copias;
- aislamiento;
- seguridad y privacidad.

## Contacto

Estado actual:
- prepara un correo en el dispositivo;
- no almacena información.

Siguiente fase:
- formulario real mediante Supabase Edge Function;
- Turnstile;
- registro de solicitudes;
- aviso por correo;
- panel de seguimiento.

## Perfil

Nueva ruta futura:
- `/perfil`.

No publicar hasta tener Supabase Auth y RLS preparados.

## Empresas / Profesionales

Ruta futura recomendada:
- `/empresas`.

Finalidad:
- directorio;
- proveedores;
- profesionales;
- colaboradores;
- patrocinio/publicidad futura.

La publicación debe ser moderada.

## Privacidad y legal

Ya existen:
- privacidad;
- cookies;
- aviso legal.

Revisar antes de recopilar datos mediante Supabase:
- responsable;
- finalidad;
- base jurídica;
- conservación;
- destinatarios;
- derechos;
- cookies/Turnstile;
- comunicaciones comerciales.

## Assets

Crear biblioteca propia:

`public/media/brand/`

`public/media/apps/qr/`

`public/media/apps/ot/`

`public/media/ecosystem/`

`public/media/resources/`

Cada imagen debe tener:
- nombre descriptivo;
- origen;
- fecha;
- permiso/licencia cuando proceda;
- versión WebP/AVIF;
- texto alternativo documentado.

## Definition of Done visual

Una página está terminada cuando:
- se entiende sin animación;
- móvil no pierde contenido;
- no hay solapes;
- animaciones son suaves;
- las capturas corresponden a la aplicación real;
- carga rápido;
- tiene CTA claro;
- tiene metadata;
- tiene navegación de retorno;
- pasa la CI.

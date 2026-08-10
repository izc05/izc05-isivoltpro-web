# Seguridad de IsiVoltPro

IsiVoltPro se encuentra en desarrollo activo. La web pública es actualmente un sitio estático y no debe utilizarse para enviar contraseñas, historiales clínicos, documentación confidencial ni información sensible de instalaciones.

## Comunicar una vulnerabilidad

Envía los detalles de forma privada a **isivoltpro@gmail.com** con el asunto `Seguridad IsiVoltPro`.

Incluye, cuando sea posible:

- URL o componente afectado.
- Pasos para reproducir el problema.
- Impacto observado o posible.
- Capturas o evidencias sin datos personales de terceros.
- Una forma de contacto para solicitar aclaraciones.

No publiques información explotable en una incidencia pública de GitHub antes de que el problema haya sido revisado.

## Alcance actual

Esta política cubre específicamente:

- La web corporativa pública de IsiVoltPro.
- La configuración de despliegue incluida en este repositorio.
- Los componentes estáticos y scripts propios del sitio.

Las aplicaciones operativas y beta del ecosistema —como Herramientas QR/NFC, IsiVoltPro OT o Preinspecciones BT— tienen ciclos de desarrollo y despliegue propios. Sus incidencias de seguridad deben revisarse también en el repositorio o servicio correspondiente, sin asumir que una corrección de la web pública modifica automáticamente esas aplicaciones.

## Principios

- Mínimo tratamiento de datos.
- Sin analítica ni publicidad activa en la web actual.
- Dependencias revisadas y actualizadas.
- Cabeceras seguras en el despliegue propio.
- Separación entre desarrollo, validación y producción.
- Cambios pequeños, verificables y reversibles antes de publicar.

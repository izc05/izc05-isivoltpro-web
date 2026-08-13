# Sesión única web mediante un solo origen

## Problema

Usar el mismo Supabase Auth en varios subdominios no garantiza por sí solo una sesión compartida. El almacenamiento del navegador está aislado por origen, por lo que una sesión guardada en `app.isivoltpro.com` no puede leerse directamente desde `ot.isivoltpro.com` o `bt.isivoltpro.com`.

No se pasarán `access_token` ni `refresh_token` por URL. Tampoco se guardarán tokens de renovación en cookies accesibles por JavaScript para todos los subdominios.

## Decisión

Las aplicaciones web privadas se publicarán bajo un único origen:

```text
https://app.isivoltpro.com/
https://app.isivoltpro.com/ot/
https://app.isivoltpro.com/preinspecciones/
https://app.isivoltpro.com/herramientas/
```

Los dominios actuales podrán mantenerse como accesos compatibles:

```text
https://ot.isivoltpro.com/  →  https://app.isivoltpro.com/ot/
https://bt.isivoltpro.com/  →  https://app.isivoltpro.com/preinspecciones/
https://qr.isivoltpro.com/  →  https://app.isivoltpro.com/herramientas/
```

## Resultado

- Una sola sesión de navegador.
- Un solo cierre de sesión.
- Un único flujo MFA.
- Un portal común para elegir aplicaciones.
- Menos intercambio de tokens y menor superficie de ataque.
- Los módulos siguen siendo compilaciones y contenedores separados.

## Requisitos para cada módulo

Cada aplicación web debe poder compilarse con una ruta base:

| Módulo | Base |
|---|---|
| Portal | `/` |
| OT | `/ot/` |
| Preinspecciones | `/preinspecciones/` |
| Herramientas | `/herramientas/` |

También debe:

- usar rutas relativas a su base;
- ajustar `manifest.webmanifest`, iconos y `service worker`;
- no interceptar rutas de otros módulos;
- limpiar únicamente sus cachés;
- validar el permiso central antes de consultar datos;
- permitir que el portal cierre la sesión común.

## Aplicaciones Android

La APK no comparte almacenamiento con el navegador. Iniciará sesión con la misma cuenta de Supabase, mantendrá su propia sesión cifrada y aplicará los mismos permisos centrales.

Esto sigue siendo identidad única aunque el dispositivo necesite iniciar sesión una vez en la APK.

## Alternativa futura

Si en el futuro se exige conservar aplicaciones completas en subdominios sin redirección, deberá construirse un broker OAuth/OIDC o BFF con códigos de un solo uso y cookies HttpOnly. Esa complejidad no se introduce en la primera versión.

## Gateway

El gateway será responsable de:

1. servir el portal en `/`;
2. enviar `/ot/*` al contenedor OT;
3. enviar `/preinspecciones/*` al contenedor BT;
4. enviar `/herramientas/*` al contenedor QR;
5. redirigir los subdominios antiguos;
6. aplicar cabeceras de seguridad coherentes;
7. no registrar tokens ni cabeceras de autorización.

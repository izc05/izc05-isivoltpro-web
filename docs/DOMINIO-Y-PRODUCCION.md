# Publicación de www.isivoltpro.com

Esta guía prepara el cambio desde la URL temporal de GitHub Pages a `https://www.isivoltpro.com` sin modificar el código en cada despliegue.

> Flujo acordado: GitHub es la fuente de verdad del código. Los cambios se validan primero en una rama/PR, se revisan en la publicación web cuando se autorice y el mini PC se actualiza únicamente después de aprobar esa versión. El procedimiento detallado está en `docs/PUBLIC-WEB-RELEASE-CHECKLIST.md`.

## 1. Verificar el dominio en GitHub

Antes de enlazarlo, verifica `isivoltpro.com` desde la configuración de tu cuenta de GitHub. Esto reduce el riesgo de que otro repositorio intente reclamar un subdominio.

## 2. Configurar GitHub Pages

En el repositorio:

1. Abre **Settings → Pages**.
2. En **Custom domain**, escribe `www.isivoltpro.com`.
3. Guarda el cambio.
4. Cuando GitHub termine de emitir el certificado, activa **Enforce HTTPS**.

La publicación se realiza mediante GitHub Actions. En este modo, un archivo `CNAME` dentro del repositorio se ignora y no es necesario.

GitHub Pages puede utilizarse como publicación pública o como mecanismo de revisión/recuperación durante la transición al servidor propio. No debe actualizarse el mini PC automáticamente por el mero hecho de fusionar una PR de la web.

## 3. Configurar DNS

En el proveedor del dominio crea:

- Tipo: `CNAME`
- Nombre/host: `www`
- Destino: `izc05.github.io`

El destino no debe incluir `/izc05-isivoltpro-web`.

Para `isivoltpro.com` sin `www`, utiliza la redirección web del registrador hacia `https://www.isivoltpro.com` o configura el dominio raíz siguiendo los registros vigentes publicados por GitHub Pages. Evita registros comodín `*`.

## 4. Cambiar las variables del repositorio

En **Settings → Secrets and variables → Actions → Variables**, crea:

- `PUBLIC_SITE_URL` = `https://www.isivoltpro.com`
- `PUBLIC_BASE_PATH` = `/`

Mientras estas variables no existan, la compilación seguirá usando:

- `https://izc05.github.io`
- `/izc05-isivoltpro-web`

De esta forma la URL pública actual no se rompe durante la preparación del DNS.

## 5. Comprobaciones posteriores

- `https://www.isivoltpro.com` carga con HTTPS.
- `http://www.isivoltpro.com` redirige a HTTPS.
- `https://isivoltpro.com` redirige a `https://www.isivoltpro.com`.
- No hay errores de certificado.
- Los enlaces internos, imágenes, favicon, sitemap y robots usan el dominio correcto.
- El dominio está verificado en GitHub.
- No existen registros DNS comodín.

## 6. Despliegue propio posterior

Solo después de aprobar la versión pública correspondiente:

- Identificar el commit exacto de `main` aprobado.
- Mantener `PUBLIC_SITE_URL=https://www.isivoltpro.com`.
- Mantener `PUBLIC_BASE_PATH=/`.
- Actualizar únicamente el servicio de la web pública en el mini PC.
- Conectar el dominio mediante Cloudflare Tunnel o proxy inverso cuando corresponda.
- Verificar las cabeceras de seguridad definidas en `Caddyfile`.
- Confirmar que OT, Herramientas, Preinspecciones y otros subdominios continúan funcionando.
- Mantener GitHub Pages temporalmente como mecanismo de recuperación durante la transición cuando resulte útil.

## 7. Rollback

Si una publicación falla, revertir el commit/merge de forma controlada en GitHub y volver al commit del mini PC previamente registrado. No corregir producción mediante cambios manuales que no queden reflejados en el repositorio.

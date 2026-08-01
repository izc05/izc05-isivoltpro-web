# Publicación de www.isivoltpro.com

Esta guía prepara el cambio desde la URL temporal de GitHub Pages a `https://www.isivoltpro.com` sin modificar el código en cada despliegue.

## 1. Verificar el dominio en GitHub

Antes de enlazarlo, verifica `isivoltpro.com` desde la configuración de tu cuenta de GitHub. Esto reduce el riesgo de que otro repositorio intente reclamar un subdominio.

## 2. Configurar GitHub Pages

En el repositorio:

1. Abre **Settings → Pages**.
2. En **Custom domain**, escribe `www.isivoltpro.com`.
3. Guarda el cambio.
4. Cuando GitHub termine de emitir el certificado, activa **Enforce HTTPS**.

La publicación se realiza mediante GitHub Actions. En este modo, un archivo `CNAME` dentro del repositorio se ignora y no es necesario.

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

Cuando la web pase al mini PC:

- Mantener `PUBLIC_SITE_URL=https://www.isivoltpro.com`.
- Mantener `PUBLIC_BASE_PATH=/`.
- Conectar el dominio mediante Cloudflare Tunnel o proxy inverso.
- Verificar las cabeceras de seguridad definidas en `Caddyfile`.
- Mantener GitHub Pages temporalmente como mecanismo de recuperación durante la transición.

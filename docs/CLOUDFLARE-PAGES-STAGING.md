# Staging de IsiVoltPro en Cloudflare Pages

## Recomendación

Usar Cloudflare Pages para una versión de revisión permanente:

`https://beta.isivoltpro.com`

Ventajas frente a usar el mini PC durante el desarrollo:
- no depende de que el mini PC esté encendido;
- HTTPS gestionado;
- despliegue desde GitHub;
- previews por Pull Request;
- rollback sencillo;
- no toca QR, OT ni PocketBase.

GitHub Pages se mantiene como publicación/fallback adicional.

## Configuración del proyecto Pages

Repositorio:

`izc05/izc05-isivoltpro-web`

Framework:
- Astro

Build command:

`npm run check`

Output directory:

`dist`

Node:
- 22 o superior compatible con `package.json`.

Variables de staging:

`PUBLIC_SITE_URL=https://beta.isivoltpro.com`

`PUBLIC_BASE_PATH=/`

Cuando se conecte Supabase se añadirán:

`PUBLIC_SUPABASE_URL`

`PUBLIC_SUPABASE_ANON_KEY`

La service role key **no se añade al frontend**.

## Rama

Recomendado:
- producción del proyecto Pages: `staging`;
- previews: cualquier Pull Request;
- `main`: versión estable del repositorio.

Si se quiere simplificar al máximo durante la primera fase, Cloudflare Pages puede usar temporalmente `main` y `beta.isivoltpro.com` como dominio, pero la separación `staging/main` es preferible cuando empiecen perfil, formularios y datos.

## DNS

Dentro de Cloudflare Pages:
1. añadir dominio personalizado `beta.isivoltpro.com`;
2. Cloudflare creará/gestionará el registro correspondiente;
3. no reutilizar `qr.isivoltpro.com` ni `ot.isivoltpro.com`.

## Qué revisar en cada preview

- Inicio.
- Ecosistema.
- Catálogo de aplicaciones.
- Herramientas QR/NFC.
- IsiVoltPro OT.
- Sobre IsiVoltPro.
- Contacto.
- Recursos.
- Privacidad, cookies y aviso legal.
- 404.
- móvil 360–430 px;
- tablet;
- escritorio 1366–1920 px.

## Producción posterior

Una vez aprobada la web en staging hay dos opciones válidas.

### Opción A · Cloudflare Pages
`www.isivoltpro.com` apunta a Pages.

Ventaja: mantenimiento mínimo.

### Opción B · mini PC
`www.isivoltpro.com` apunta mediante Cloudflare Tunnel a Caddy en el mini PC.

Ventaja: control propio de infraestructura.

El backend Supabase funciona igual con cualquiera de las dos opciones.

## Rollback

No editar archivos directamente en el servidor.

Rollback:
1. identificar el último commit estable;
2. revertir o promover dicho commit en GitHub;
3. volver a desplegar;
4. verificar web, QR y OT.

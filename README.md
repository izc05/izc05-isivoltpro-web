# IsiVoltPro Web

Web principal de **IsiVoltPro**, marca y ecosistema de aplicaciones, herramientas y conocimiento para mantenimiento técnico.

## Alcance actual

- Portada moderna con navegación por scroll.
- Explorador interactivo del ecosistema.
- Catálogo de aplicaciones y herramientas.
- Fichas dinámicas para cada área.
- Centro de conocimiento con artículos iniciales.
- Página de contacto.
- SEO básico, sitemap y robots.
- Diseño responsive y navegación accesible.
- Despliegue preparado con Docker y Caddy.

## Familias del ecosistema

- Mantenimiento y órdenes de trabajo.
- Inventario, almacén, herramientas y maletines.
- Activos QR/NFC.
- Inspecciones y cálculos eléctricos.
- Refrigeración y climatización / RITE.
- PCI y Legionella.
- Documentación técnica.
- Utilidades y asistentes.

## Desarrollo local

Requisitos: Node.js 22 o superior.

```bash
npm install
npm run dev
```

La web quedará disponible normalmente en `http://localhost:4321`.

## Construcción de producción

```bash
npm run build
npm run preview
```

Astro genera el sitio estático en la carpeta `dist`.

## Despliegue en el mini PC

```bash
git clone https://github.com/izc05/izc05-isivoltpro-web.git
cd izc05-isivoltpro-web
docker compose up -d --build
```

El contenedor publica la web solamente en:

```text
http://127.0.0.1:8080
```

Cloudflare Tunnel deberá dirigir el dominio público a `http://localhost:8080`. No es necesario abrir el puerto 8080 en el router.

Para actualizar:

```bash
git pull
docker compose up -d --build
```

## Validación

GitHub Actions ejecuta `npm install` y `npm run build` en cada cambio del PR y en cada actualización de `main`.

## Contenido técnico

Los artículos actuales son una base editorial inicial. Antes de publicarse como guías definitivas deberán incorporar fuentes, referencias normativas y revisión técnica especializada.

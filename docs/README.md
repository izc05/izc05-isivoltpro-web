# Documentación web IsiVoltPro

## Arquitectura y publicación

- [Arquitectura V13](./WEB-PLATFORM-ARCHITECTURE-V13.md)
- [Staging con Cloudflare Pages](./CLOUDFLARE-PAGES-STAGING.md)
- [Dominio y producción](./DOMINIO-Y-PRODUCCION.md)
- [Checklist de publicación](./PUBLIC-WEB-RELEASE-CHECKLIST.md)

## Backend y funciones dinámicas

- [Plan Supabase para la web](./SUPABASE-WEB-PLAN.md)

## Contenido y diseño

- [Mapa de contenidos V13](./WEB-CONTENT-ROADMAP-V13.md)

## Decisión vigente

- GitHub es la fuente de verdad.
- GitHub Pages permanece como fallback/publicación técnica.
- Cloudflare Pages será el staging recomendado en `beta.isivoltpro.com`.
- La producción podrá permanecer en Cloudflare Pages o trasladarse al mini PC sin cambiar el backend.
- Supabase se utilizará para autenticación, perfiles, contacto, organizaciones y futuras fichas de empresas.
- Herramientas QR/NFC y OT se mantienen como aplicaciones independientes enlazadas desde la web.

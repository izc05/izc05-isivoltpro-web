# IsiVoltPro Web · Arquitectura V13

## Decisión

GitHub será la **fuente de verdad** del código y de la documentación. La web se separa en tres capas:

1. **Frontend público**: Astro.
2. **Backend de producto web**: Supabase.
3. **Infraestructura de publicación**: Cloudflare Pages para staging/preview y, cuando se decida, Cloudflare Pages o mini PC para producción.

La elección de hosting no debe condicionar el contenido ni el backend. La misma compilación de Astro debe poder desplegarse en GitHub Pages, Cloudflare Pages o el mini PC.

## Entornos

### Desarrollo local
- Rama de trabajo o feature branch.
- `npm run dev`.
- Variables locales en un archivo no versionado.
- Nunca usar datos reales sensibles.

### Preview de PR
- Cloudflare Pages conectado a GitHub.
- Cada Pull Request genera una URL de preview.
- Sirve para revisar responsive, parallax, imágenes y contenido antes de fusionar.

### Staging fijo
Dominio recomendado:

`https://beta.isivoltpro.com`

Fuente recomendada:
- rama `staging`, o
- un proyecto Cloudflare Pages separado cuyo branch de producción sea `staging`.

Aquí se valida la web completa antes de promoverla a producción.

### Producción
Dominio principal:

`https://www.isivoltpro.com`

La producción podrá vivir en:

- **Cloudflare Pages**, si se quiere máxima simplicidad y cero mantenimiento del servidor.
- **Mini PC + Caddy + Cloudflare Tunnel**, si se quiere control total de infraestructura.

La decisión se puede posponer. El código será el mismo.

## Dominios del ecosistema

- `www.isivoltpro.com` — web corporativa.
- `beta.isivoltpro.com` — staging de la web.
- `qr.isivoltpro.com` — Herramientas QR/NFC.
- `ot.isivoltpro.com` — IsiVoltPro OT.
- futuros subdominios — aplicaciones especializadas.

La web corporativa debe enlazar las aplicaciones, no absorberlas dentro del mismo bundle.

## Flujo de ramas

1. `feature/*` o `agent/*`: desarrollo aislado.
2. Pull Request: CI + preview de Cloudflare Pages.
3. `staging`: revisión integrada en `beta.isivoltpro.com`.
4. `main`: versión aprobada y estable.
5. Producción: se despliega el commit exacto aprobado de `main`.

No se corrige producción a mano. Todo cambio debe quedar en GitHub.

## Estado actual

El repositorio ya dispone de:
- GitHub Pages mediante `.github/workflows/pages.yml`.
- CI de validación.
- Inicio.
- Ecosistema.
- Aplicaciones.
- Mantenimiento.
- Recursos.
- Infraestructura.
- Contacto.
- Sobre IsiVoltPro.
- Privacidad.
- Cookies.
- Aviso legal.
- Sitemap y robots.

GitHub Pages puede mantenerse como **fallback técnico y URL de recuperación**, aunque el staging principal pase a Cloudflare Pages.

## Arquitectura visual

La web debe mantener la línea V12/V13:
- acabado SaaS premium;
- hero cinematográfico y claro;
- composición portátil/móvil/aplicaciones;
- movimiento por capas;
- parallax suave;
- animaciones de entrada escalonadas;
- tarjetas con poco ruido;
- fotografías y capturas reales del producto;
- identidad IsiVoltPro coherente en todas las páginas.

Toda animación deberá respetar `prefers-reduced-motion`.

## Imágenes y media

Prioridad:
1. capturas reales de Herramientas QR/NFC y OT;
2. fotografías reales cuando existan;
3. imágenes creadas específicamente para IsiVoltPro;
4. stock solo cuando aporte contexto y no represente falsamente instalaciones propias.

Formatos:
- AVIF/WebP para fotografía;
- SVG para iconos y diagramas;
- PNG únicamente cuando haga falta conservar una captura exacta.

No cargar imágenes de 4K si la superficie visible es pequeña.

## Criterio de publicación

Una versión no pasa a producción hasta superar:
- build Astro;
- enlaces internos;
- responsive móvil/tablet/escritorio;
- accesibilidad básica;
- SEO y metadatos;
- política de privacidad/cookies;
- carga de imágenes;
- revisión visual;
- comprobación de accesos a `qr.isivoltpro.com` y `ot.isivoltpro.com`.

## Principio de producto

La web no debe presentar IsiVoltPro como una sola aplicación.

Debe explicar:

> IsiVoltPro es un ecosistema modular para mantenimiento técnico. Herramientas QR/NFC y OT son las primeras piezas publicadas; inspecciones, activos, inventario y especialidades irán incorporándose sin rehacer el núcleo.

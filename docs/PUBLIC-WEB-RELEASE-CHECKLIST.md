# IsiVoltPro · Checklist de publicación de la web pública

Este documento define el procedimiento para publicar cambios de la web pública de IsiVoltPro sin mezclar desarrollo, GitHub Pages y el servidor del mini PC.

## 1. Fuente de verdad

Repositorio público:

- `izc05/izc05-isivoltpro-web`
- rama de producción: `main`
- GitHub Pages publica únicamente desde `main`

El mini PC no se actualiza durante el desarrollo visual. Solo se sincroniza cuando la versión publicada ha sido revisada y aprobada.

## 2. Antes de fusionar una PR visual

- [ ] PR abierta y fusionable.
- [ ] Rama 0 commits por detrás de `main` o conflictos resueltos de forma explícita.
- [ ] `npm audit` sin incidencias bloqueantes.
- [ ] `npm run check` correcto.
- [ ] `robots.txt` generado.
- [ ] `sitemap.xml` generado.
- [ ] Enlaces internos compatibles con `BASE_URL`.
- [ ] Canonical y meta description presentes.
- [ ] Sin IDs duplicados.
- [ ] Enlaces externos con `target="_blank"` protegidos con `noopener` o `noreferrer`.
- [ ] Revisión visual de Home, Ecosistema, Mantenimiento y Aplicaciones en escritorio.
- [ ] Revisión visual de Home y navegación principal en móvil.
- [ ] Menú accesible con teclado y Escape.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Estados de producto coherentes en Home, catálogo, roadmap y footer.
- [ ] Claims de productos beta diferenciados de funciones todavía no desplegadas.
- [ ] Privacidad, cookies y aviso legal coherentes con la carga técnica real de la web.

## 3. Publicación en GitHub Pages

Solo después de una aprobación explícita:

1. Comprobar el SHA final de la PR.
2. Confirmar que la última ejecución de `Validar web` está en verde.
3. Fusionar la PR en `main` con el método acordado.
4. Esperar a que el workflow `Publicar GitHub Pages` termine correctamente.
5. Abrir la URL publicada.
6. Verificar Home y navegación principal.
7. Verificar `/ecosistema`, `/mantenimiento`, `/aplicaciones` y `/recursos`.
8. Verificar las fichas de Herramientas QR/NFC, IsiVoltPro OT y Preinspecciones BT.
9. Revisar escritorio y móvil.
10. No actualizar todavía el mini PC hasta aprobar esta revisión pública.

## 4. Revisión posterior a la publicación

Comprobar especialmente:

- [ ] Hero y CTA principal.
- [ ] Recorrido inmersivo completo.
- [ ] Scroll y sticky scenes.
- [ ] Navegación móvil.
- [ ] 404.
- [ ] Contacto y `mailto:`.
- [ ] Aplicaciones externas operativas.
- [ ] `robots.txt`.
- [ ] `sitemap.xml`.
- [ ] Consola del navegador sin errores relevantes.
- [ ] Sin cortes o solapamientos en 390 px.

## 5. Actualización del mini PC

Solo cuando la versión de GitHub Pages esté aprobada:

- [ ] Identificar el commit exacto de `main` aprobado.
- [ ] Guardar el estado actual del despliegue del mini PC.
- [ ] Actualizar el repositorio del servidor sin cambios destructivos.
- [ ] Reconstruir únicamente el servicio de la web pública.
- [ ] Comprobar el proxy/dominio existente sin modificar Cloudflare si no es necesario.
- [ ] Verificar la web desde fuera de la red local.
- [ ] Confirmar que aplicaciones y subdominios existentes continúan accesibles.

## 6. Rollback

Si la publicación presenta un problema serio:

1. No intentar arreglar producción directamente sobre el servidor.
2. Identificar el commit de `main` anterior a la publicación.
3. Revertir el merge mediante GitHub para conservar historial.
4. Dejar que GitHub Pages publique el estado anterior.
5. Si el mini PC ya se había actualizado, volver al commit previamente registrado y reconstruir el servicio.
6. Corregir el problema en una rama nueva o en la PR correspondiente.

## 7. Regla de seguridad del proyecto

Nunca mezclar en una misma acción sin necesidad explícita:

- rediseño web;
- identidad/portal;
- cambios de aplicaciones operativas;
- servidor del mini PC;
- Cloudflare/DNS.

Cada capa se valida y publica por separado para que cualquier cambio pueda revertirse con claridad.

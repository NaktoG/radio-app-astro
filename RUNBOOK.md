# Runbook

Guía operativa mínima para mantener Radio App en desarrollo y producción.

## Producción

- Hosting: Vercel
- Rama de deploy: `main`
- Build command: `npm run build`
- Publish directory: `dist`
- Node: `22.x` configurado en `package.json`

## Deploy

1. Hacer cambios en una rama o en `main` según el flujo definido.
2. Verificar build local con Node 22:

```bash
npx -y node@22 node_modules/astro/bin/astro.mjs build
```

3. Commit y push a `main`.
4. Vercel dispara el deploy automáticamente.

## Health Checks Manuales

- Abrir `/` y verificar landing.
- Abrir `/player` y cargar estaciones.
- Abrir `/search` y buscar una radio.
- Abrir menú móvil en iPhone/Android.
- Instalar como PWA desde el navegador.
- Probar offline: la app debe mostrar `offline.html` si no hay conexión para navegación no cacheada.

## Errores Comunes

### No cargan estaciones

Síntoma: lista vacía o mensaje de error temporal.

Acciones:

1. Verificar consola para `/api/stations`.
2. Probar otro país/límite.
3. Confirmar que Radio Browser esté disponible.
4. Revisar logs de Vercel Functions si falla el proxy.

### El menú móvil no aparece

Acciones:

1. Confirmar que el deploy más reciente esté publicado.
2. Cerrar pestaña en Safari móvil y abrir de nuevo.
3. Limpiar caché del sitio si hay service worker anterior.
4. Verificar que el botón cambie de `Menú` a `Cerrar`.

### Cambios de PWA no aparecen

Los service workers pueden quedar cacheados.

Acciones:

1. Cerrar y reabrir la app instalada.
2. En Safari, eliminar la app de pantalla de inicio y reinstalar.
3. En Chrome DevTools, Application → Service Workers → unregister.

## Autenticación

La auth usa endpoints server-side, cookies `HttpOnly` y Supabase PostgreSQL. Verificar que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas en Vercel.

## Rollback

Desde Vercel:

1. Ir a Deployments.
2. Seleccionar un deploy estable anterior.
3. Usar **Promote to Production**.

Desde Git:

```bash
git revert <commit>
git push
```

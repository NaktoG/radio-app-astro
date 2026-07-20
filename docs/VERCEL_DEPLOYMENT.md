# Despliegue en Vercel

## Proyecto

`radio-app-astro`

## Estado

- [x] Preview desplegada
- [x] Producción desplegada
- [x] Variables configuradas
- [ ] Dominio configurado
- [x] Pruebas completadas

## Configuración

| Campo | Valor |
|---|---|
| Framework | Astro |
| Root Directory | `./` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Dejar vacío / autodetectado por Vercel |
| Node.js | `22.x` |
| Gestor de paquetes | npm |
| Adapter | `@astrojs/vercel` |

`vercel.json` define headers de seguridad básicos y redirección de `/favicon.ico` a `/favicon.svg`.

## URL de Producción

```txt
https://radio-app-astro.vercel.app
```

## Variables de entorno

Se requieren `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para auth y favoritos persistentes.

## Servicios externos

- Radio Browser API mediante `/api/stations`.
- Favicons remotos mediante `/api/image-proxy`.
- Streams de radio reproducidos directamente por el navegador.
- Supabase PostgreSQL para usuarios, sesiones y favoritos.

## Pruebas realizadas

Comandos ejecutados:

```bash
npm run lint
npm run test
npx tsc --noEmit
```

Resultado:

- `npm run lint` completó sin errores y con warnings preexistentes.
- `npm run test` completó 20 tests unitarios correctamente.
- `npx tsc --noEmit` completó correctamente.

## Limitaciones

- No se configura dominio propio en esta etapa.
- Requiere ejecutar `docs/supabase-setup.sql` antes del primer deploy productivo.
- Requiere configurar variables de Supabase en Vercel.
- La caché server-side en memoria no es persistente en Vercel serverless.
- Los streams externos pueden no reproducirse si la estación está caída, usa HTTP no seguro o bloquea reproducción en navegador.

## Rollback

Revertir la Pull Request de migración y redeployar el último commit estable en Vercel.

Para rollback desde CLI:

```bash
vercel rollback
```

## Última revisión

2026-07-20

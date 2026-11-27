# Despliegue en Vercel

## Estado actual de LuVal Radio — 27 de noviembre de 2026

- Repositorio: https://github.com/NaktoG/radio-app-astro
- Rama del código nuevo: `preview/mobile-radio-dial`.
- Demo pública para compartir: https://luval-radio.vercel.app/
- Commit de la aplicación que sirve ese enlace al verificarlo: `5fea17ed002d6e98a1654efe55b9e5e6b3af3d72`.
- Despliegue asociado: `dpl_3dfv7yGeZ2c8H1Aoskw3goJ75hzy`, en entorno Preview. Hacer pública esta URL no promueve el código a producción ni lo integra en la rama principal.
- El alias estaba sujeto a Vercel Authentication. El 27 de noviembre se creó una excepción pública para `luval-radio.vercel.app` (`alias-protection-override`). Se volvió a consultar la configuración y Gastón confirmó que el enlace funciona sin pedir autorización.
- La protección general del proyecto sigue activa. La excepción se aplica a este alias.
- Este permiso se guarda en Vercel, no en el código ni en `vercel.json`. Clonar el repositorio no reproduce esa configuración.
- Al publicar una versión nueva, comprobar a qué despliegue apunta el alias y verificar su acceso desde una ventana privada. No asumir que un nuevo despliegue de la rama actualiza automáticamente este alias.
- Documentación de los cambios: [Rediseño](REDESIGN_2026-11-26.md) y [Fiabilidad y validación técnica](RELIABILITY_2026-11-26.md).
- La raíz local está en una rama anterior; `radio-dial-preview/` es una copia local del código nuevo y no tiene un repositorio Git independiente. Para trabajar con historial y seguimiento remoto, clonar el repo y seleccionar `preview/mobile-radio-dial`.

## Referencia histórica de configuración — 20 de julio de 2026

La información siguiente corresponde a la configuración anterior; sus URLs, versiones y resultados de pruebas no describen por sí solos la demo actual. Para la validación del código del 26 de noviembre, consultar el informe de fiabilidad enlazado arriba.

## Proyecto

`radio-app-astro`

## Estado

- [x] Preview desplegada
- [x] Producción desplegada
- [x] Variables configuradas
- [ ] Dominio configurado
- [x] Pruebas completadas

## Configuración

| Campo              | Valor                                  |
| ------------------ | -------------------------------------- |
| Framework          | Astro                                  |
| Root Directory     | `./`                                   |
| Install Command    | `npm ci`                               |
| Build Command      | `npm run build`                        |
| Output Directory   | Dejar vacío / autodetectado por Vercel |
| Node.js            | `22.x`                                 |
| Gestor de paquetes | npm                                    |
| Adapter            | `@astrojs/vercel`                      |

`vercel.json` define headers de seguridad básicos y redirección de `/favicon.ico` a `/favicon.svg`.

## URL de Producción

```txt
https://radio-app-astro.vercel.app
```

## Variables de entorno

Se requieren `SUPABASE_URL` y `SUPABASE_ANON_KEY` para auth anónimo SSR y favoritos persistentes bajo RLS. `SUPABASE_SERVICE_ROLE_KEY` no es requerido para rutas de usuario de auth/favoritos y nunca debe exponerse al navegador.

## Servicios externos

- Radio Browser API mediante `/api/stations`.
- Favicons remotos mediante `/api/image-proxy`.
- Streams de radio reproducidos directamente por el navegador.
- Supabase PostgreSQL para usuarios, sesiones y favoritos.

## Pruebas realizadas

Comandos ejecutados localmente con Node.js `v22.23.1`:

```bash
npm ci
npm run lint
npm run test
npx tsc --noEmit
npm run build
```

Resultado:

- `npm ci` completó correctamente.
- `npm run lint` completó sin errores y con warnings preexistentes.
- `npm run test` completó 20 tests unitarios correctamente.
- `npx tsc --noEmit` completó correctamente.
- `npm run build` completó correctamente con adaptador `@astrojs/vercel`.

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

## Última revisión de esta referencia histórica

2026-07-20

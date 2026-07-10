<div align="center">

# 🎙️ Radio App

### Streaming de radio mundial en tiempo real

[![Astro](https://img.shields.io/badge/Astro-7.0-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Preact](https://img.shields.io/badge/Preact-10.25-673AB8?logo=preact&logoColor=white)](https://preactjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Netlify Status](https://api.netlify.com/api/v1/badges/PLACEHOLDER/deploy-status)](https://app.netlify.com/sites/radio-app/deploys)

</div>

---

## Descripción

**Radio App** es una aplicación web moderna para escuchar miles de emisoras de radio en vivo desde todo el mundo. Construida con un stack tecnológico de vanguardia, ofrece una experiencia de usuario fluida, accesible y responsiva.

Las estaciones se obtienen de la API pública de [Radio Browser](https://www.radio-browser.info/), con proxy server-side para garantizar fiabilidad, caché inteligente y protección contra SSRF.

## Características

| Funcionalidad | Descripción |
|---|---|
| 🎵 **Reproductor en vivo** | Streaming de audio con controles de play/pausa, volumen, mute y salto automático entre estaciones |
| 🔍 **Búsqueda avanzada** | Filtrar por nombre, país y género/con标签 con resultados en tiempo real |
| ❤️ **Favoritos** | Guardar estaciones favoritas con persistencia en localStorage |
| 🔐 **Autenticación** | Login y registro con bcrypt (client-side, demostrativo) |
| 🌐 **Internacionalización** | Soporte bilingüe español/inglés con detección automática por cookie |
| 🖼️ **Proxy de imágenes** | Server-side image proxy con protección SSRF y límites de tamaño |
| 🌙 **Modo oscuro** | Diseño dark-first nativo (sin toggle) |
| 📱 **Responsive** | Mobile-first con menú hamburger y breakpoints adaptables |
| ♿ **Accesibilidad** | WCAG 2.1 AA: targets 44px, focus visible, reduced motion, ARIA |
| ⚡ **Performance** | Islands architecture de Astro: JavaScript solo donde se necesita |
| 🐳 **Docker** | Multi-stage build (dev/build/prod) con Node 22 Alpine |
| 🧪 **Testing** | 19 tests unitarios (Vitest) + 8 tests E2E (Playwright) |

## Demo

> 🔗 **[Demo en vivo](https://radio-app.example.com)** *(próximamente)*

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Meta-framework | [Astro](https://astro.build/) | 7.0 (SSR con Node adapter) |
| UI Framework | [Preact](https://preactjs.com/) | 10.25 (islands con signals) |
| Estado global | [@preact/signals](https://github.com/preactjs/signals) | 2.0 |
| CSS | [Tailwind CSS](https://tailwindcss.com/) | 4.0 (CSS-first config) |
| Iconos | [Lucide Preact](https://lucide.dev/) | 0.460 |
| Tipografía | [Space Grotesk](https://fonts.google.com/specimen/Space-Grotesk) | @fontsource |
| Auth | [bcryptjs](https://github.com/nicolo-ribaudo/bcryptjs) | 3.0 |
| Tests unitarios | [Vitest](https://vitest.dev/) | 2.1 |
| Tests E2E | [Playwright](https://playwright.dev/) | 1.49 |
| Linting | [ESLint](https://eslint.org/) | 9.17 |
| Formateo | [Prettier](https://prettier.io/) | 3.4 |

## Instalación

### Requisitos previos

- [Node.js](https://nodejs.org/) ≥ 22
- [Docker](https://www.docker.com/) (opcional, recomendado)

### Con Docker (recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/NaktoG/radio-app-astro.git
cd radio-app-astro

# Iniciar en modo desarrollo
docker compose up -d

# Ver logs
docker compose logs -f
```

La aplicación estará disponible en `http://localhost:4321`.

### Sin Docker

```bash
# Clonar el repositorio
git clone https://github.com/NaktoG/radio-app-astro.git
cd radio-app-astro

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Scripts de desarrollo

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción (SSR) |
| `npm run preview` | Previsualizar build de producción |
| `npm test` | Ejecutar tests unitarios (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:ui` | Interfaz visual de Vitest |
| `npm run test:e2e` | Ejecutar tests E2E (Playwright) |
| `npm run lint` | Linting con ESLint |
| `npm run format` | Formatear código con Prettier |
| `npm run format:check` | Verificar formato sin modificar |

## Estructura del proyecto

```
src/
├── ui/                    # Sistema de diseño (primitivas UI)
│   ├── Button.tsx         # Botón reutilizable
│   ├── Input.tsx          # Campo de entrada
│   ├── Select.tsx         # Selector desplegable
│   ├── Card.tsx           # Tarjeta de contenido
│   ├── Spinner.tsx        # Indicador de carga
│   ├── EmptyState.tsx     # Estado vacío
│   ├── ErrorAlert.tsx     # Alerta de error
│   ├── Image.tsx          # Imagen con proxy y fallback
│   ├── Slider.tsx         # Control deslizante (volumen)
│   ├── Badge.tsx          # Etiqueta/insignia
│   ├── Tooltip.tsx        # Tooltip informativo
│   └── IconButton.tsx     # Botón de solo icono
│
├── components/            # Componentes de funcionalidad
│   ├── Nav.tsx            # Navegación principal (responsive)
│   ├── AudioPlayer.tsx    # Reproductor de audio completo
│   ├── RadioPlayer.tsx    # Orquestación de la página del jugador
│   ├── StationList.tsx    # Lista scrollable de estaciones
│   ├── SearchContainer.tsx# Orquestación de la página de búsqueda
│   ├── SearchForm.tsx     # Formulario de búsqueda
│   ├── Filter.tsx         # Filtros por país y límite
│   └── AuthForm.tsx       # Formulario de login/registro
│
├── stores/                # Estado global (Preact signals)
│   ├── player.ts          # Estado del reproductor
│   └── favorites.ts       # Gestión de favoritos
│
├── lib/                   # Lógica pura y utilidades
│   ├── api.ts             # Cliente de Radio Browser API
│   ├── auth.ts            # Autenticación client-side
│   ├── countries.ts       # Lista de países
│   ├── image.ts           # Helper de proxy de imágenes
│   ├── storage.ts         # Wrapper de localStorage
│   ├── types.ts           # Definiciones TypeScript
│   └── useAudio.ts        # Hook de manejo de audio
│
├── i18n/                  # Internacionalización
│   ├── index.ts           # Helper server-side
│   ├── client.ts          # Hook client-side con signals
│   ├── es.json            # Traducciones español
│   └── en.json            # Traducciones inglés
│
├── styles/                # Estilos globales
│   ├── global.css         # Tailwind v4 + tokens @theme
│   └── animations.css     # Keyframes y animaciones
│
├── layouts/
│   └── BaseLayout.astro   # Shell HTML (SEO, nav, footer)
│
├── pages/                 # Rutas Astro + endpoints API
│   ├── index.astro        # Landing page
│   ├── player.astro       # Página del reproductor
│   ├── search.astro       # Página de búsqueda
│   ├── 404.astro          # Página 404 personalizada
│   ├── auth/
│   │   ├── login.astro    # Login
│   │   └── register.astro # Registro
│   ├── legal/
│   │   ├── terms.astro    # Términos y condiciones
│   │   ├── privacy.astro  # Política de privacidad
│   │   └── faq.astro      # Preguntas frecuentes
│   └── api/
│       ├── stations.ts    # Proxy a Radio Browser API
│       └── image-proxy.ts # Proxy de imágenes server-side
│
└── middleware.ts           # Middleware de detección de idioma
```

## Testing

### Tests unitarios (Vitest)

```bash
npm test                    # Ejecutar una vez
npm run test:watch          # Modo observador
npm run test:ui             # Interfaz visual
```

**Cobertura:**
- `src/lib/__tests__/` — Tests de utilidades (image, countries)
- `src/stores/__tests__/` — Tests de estado (player, favorites)

### Tests E2E (Playwright)

```bash
npm run test:e2e
```

**Navegadores:** Chromium, Firefox, iPhone 15 (mobile)

**Specs:**
- `e2e/auth.spec.ts` — Flujos de autenticación
- `e2e/player.spec.ts` — Página del reproductor
- `e2e/search.spec.ts` — Funcionalidad de búsqueda

## Arquitectura y decisiones de diseño

### Islands Architecture

Astro renderiza HTML estático por defecto. Los componentes interactivos (Preact) se hidratan selectivamente como "islands", resultando en bundles mínimos y carga ultrarrápida.

### Estado con Signals

El estado global se gestiona con `@preact/signals`, ofreciendo reactividad granular sin la sobrecarga de un state manager completo. Cada signal se actualiza de forma independiente, optimizando re-renders.

### Proxy server-side

Las peticiones a la API de Radio Browser y las imágenes se proxean a través de endpoints server-side de Astro, proporcionando:
- **Caché** en memoria (60s para estaciones, 24h para imágenes)
- **Failover** automático entre mirrors de la API
- **Protección SSRF** contra hostnames internos/LAN
- **Límites de tamaño** (5MB para imágenes)

### i18n con cookie + signals

La detección de idioma sigue una cadena: cookie `radio_lang` → localStorage → español por defecto. El hook `useI18n()` usa signals para reactividad instantánea.

## Docker

### Desarrollo

```bash
docker compose up -d       # Iniciar
docker compose down        # Detener
docker compose logs -f     # Ver logs
```

### Producción

```bash
docker build --target prod -t radio-app:prod .
docker run -p 4321:4321 radio-app:prod
```

**Características del Dockerfile multi-stage:**
- **base**: Node 22 Alpine
- **dev**: Instalación completa + hot-reload
- **build**: `npm ci` + `astro build` optimizado
- **prod**: Usuario non-root, healthcheck habilitado, solo archivos de producción

## Deploy en Netlify

### Requisitos

- Repositorio en GitHub
- Cuenta en [Netlify](https://www.netlify.com/)

### Pasos

1. Ir a [app.netlify.com](https://app.netlify.com/) → **Add new site** → **Import an existing project**
2. Conectar con GitHub y seleccionar `NaktoG/radio-app-astro`
3. En **Build settings**, Netlify detecta automáticamente:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. En **Advanced** → **Environment variables**, agregar:
   - `NODE_VERSION = 22`
5. Click en **Deploy**

### Verificar deploy

- Visitar `https://<nombre-app>.netlify.app`
- El build tarda ~2 minutos en primera ejecución
- Los endpoints API y el proxy de imágenes funcionan out-of-the-box

> ⚠️ **Nota**: Si migraste desde `@astrojs/node`, asegúrate de que tu `astro.config.mjs` use `@astrojs/netlify`. Este proyecto ya está configurado correctamente.

## Contribución

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convenciones

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
- **Código**: ESLint + Prettier (ejecutar `npm run lint` y `npm run format` antes de commitear)
- **Tests**: Añadir tests para nuevas funcionalidades

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](./LICENSE) para detalles.

## Agradecimientos

- [Radio Browser API](https://www.radio-browser.info/) — API gratuita para miles de emisoras de radio mundial
- [Astro](https://astro.build/) — El framework web para sitios centrados en contenido
- [Preact](https://preactjs.com/) — Alternativa ligera a React
- [Tailwind CSS](https://tailwindcss.com/) — Framework CSS utility-first
- [Lucide](https://lucide.dev/) — Iconos SVG hermosos y consistentes

---

<div align="center">

Hecho con ❤️ por [NaktoG](https://github.com/NaktoG)

</div>

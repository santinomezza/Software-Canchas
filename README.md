# cancha — software de gestión para complejos deportivos

Landing de producto + onboarding funcional para una SaaS que gestiona
complejos de pádel, fútbol y tenis en Argentina y LATAM.

El repositorio contiene **dos cosas que funcionan juntas**:

1. **El sitio de producto** (`/`) — landing premium de 14 secciones con demos
   interactivos del producto, SEO técnico, i18n en 5 idiomas y modo claro/oscuro.
2. **El producto** (`/registro`, `/panel`, `/c/[slug]`) — alta de cuenta, creación
   del complejo, carga de canchas y horarios, página pública de reservas y
   gestión de reservas con la regla de cancelación por anticipación.

---

## Instalación

```bash
npm install
cp .env.example .env.local   # opcional: todo funciona sin variables
npm run dev                  # http://localhost:3000
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` / `npm start` | Build y serving de producción |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run qa:capture` | Capturas de pantalla en 1440 / 768 / 390 px |
| `npm run qa:e2e` | Test end-to-end del flujo de onboarding |

### Variables de entorno

Todas son opcionales — ver `.env.example` para el detalle.

| Variable | Efecto si falta |
|---|---|
| `DATABASE_PATH` | SQLite en `./data/cancha.db` |
| `MERCADO_PAGO_ACCESS_TOKEN` | El checkout corre en **sandbox**: la reserva queda aprobada pero no se cobra nada (y la UI lo avisa) |
| `RESEND_API_KEY` | Los leads se registran en los logs del servidor en vez de llegar al inbox |
| `NEXT_PUBLIC_SITE_URL` | Canonical y OG apuntan a `http://localhost:3000` |
| `NEXT_PUBLIC_BRAND_NAME` | La marca por defecto es `cancha` |

---

## Rutas

```
/                      Landing de producto (es-AR)
/es-MX /es-CL /es-CO /pt-BR   Variantes regionales
/registro              Crear cuenta
/acceder               Iniciar sesión
/panel                 Dashboard del complejo
/panel/canchas         CRUD de canchas
/panel/horarios        Horarios de atención
/panel/reservas        Reservas y cancelaciones
/panel/configuracion   Datos del complejo y reglas
/c/[slug]              Página pública de reservas del complejo
/privacidad            Políticas de privacidad
```

---

## Stack

- **Next.js 16** (App Router) + **TypeScript estricto** + **React 19**
- **Tailwind CSS v4** vía `@tailwindcss/turbopack` (tokens como CSS variables)
- **Radix UI** (primitivas accesibles) + **CVA** para variantes
- **Framer Motion** solo donde aporta (tilt, contador, demos)
- **next-intl 4** — es-AR por defecto; es-MX / es-CL / es-CO / pt-BR
- **React Hook Form + Zod** (mismo schema en cliente y servidor)
- **node:sqlite** — driver nativo de Node, sin compilación nativa
- **Resend** para emails · **Plausible** para analítica sin cookies

---

## Arquitectura

```
src/
  app/
    [locale]/
      layout.tsx        raíz: html/body, fuentes, tema, i18n
      (marketing)/      landing + navbar + footer
      (app)/            producto: auth, panel, página pública
      actions/          server actions (auth, panel, booking)
  components/
    ui/                 primitivas (button, card, input, select, slider…)
    sections/           secciones de la landing
    interactive/        demos: slider de cancelación, grilla de turnos, charts
    app/                formularios del panel y de la reserva
    motion/             reveal, count-up, tilt, stat-value
    mockups/            dashboard y teléfono (markup real, no bitmaps)
  content/messages/     es-AR.json + variantes derivadas + pt-BR completo
  design-system/        tokens.ts (fuente de verdad) + tokens.json
  i18n/                 routing, request, navigation
  lib/
    db/                 schema, conexión y repositorios
    auth.ts             scrypt + sesiones en cookie
    scheduling.ts       motor de horarios, solapamiento y cancelación (puro)
    payments/           seam de Mercado Pago
```

### Decisiones técnicas relevantes

- **SQLite con `node:sqlite`** en vez de un ORM: cero compilación nativa, cero
  binarios y un solo archivo. En producción se puede migrar a Postgres
  reemplazando `src/lib/db/index.ts` — el resto del código habla con el
  repositorio, no con SQL.
- **Dinero en centavos** (`INTEGER`). Nunca floats.
- **Horarios como `(date, start_min)`** en la zona horaria del complejo: la
  aritmética de slots no depende del servidor ni de DST.
- **Doble control de disponibilidad**: la reserva se re-valida dentro de una
  transacción `BEGIN IMMEDIATE`, así que dos visitantes no pueden tomar el
  mismo horario.
- **Reveals con CSS, no con framer-motion**: `IntersectionObserver` + transiciones
  CSS garantizan que el contenido se vea siempre con `prefers-reduced-motion` y
  también sin JavaScript.
- **Pago en sandbox explícito**: sin `MERCADO_PAGO_ACCESS_TOKEN` la reserva se
  aprueba pero la UI dice que no se cobró nada. Nunca se simula un cobro real.

---

## Diseño

La fuente de verdad del sistema de diseño es `src/design-system/tokens.ts`; se
espeja en `src/app/globals.css` (variables CSS + `@theme` de Tailwind) y en
`src/design-system/tokens.json` para importar a Figma.

- **Modo claro y oscuro** con el mismo markup: sólo cambia `data-theme` en `<html>`.
  El tema por defecto es oscuro (identidad de marca); el script inline evita
  el parpadeo.
- **Contraste AA verificado** en todos los pares texto/fondo (ver `docs/QA.md`).
- **Tipografía**: `Fraunces` (display, variable con `opsz`) + `Inter Tight` (UI).

Guía completa: [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).

---

## QA

```bash
npm test                    # 19 unit tests (scheduling + auth)
npm run qa:e2e              # flujo completo: alta → complejo → cancha → reserva
npm run qa:capture          # capturas en 3 viewports + conteo de errores de consola
```

El E2E usa Playwright contra el servidor ya levantado. Cubre: registro, alta
del complejo, carga de canchas, horarios, página pública, reserva y su
aparición en el panel.

---

## Pendiente

- `[DATO_REAL]` — número de clientes, testimonios y logos reales.
- Webhook de Mercado Pago (hoy el pago se aprueba en el sandbox o queda
  `pending` esperando el webhook).
- Envío de la confirmación de reserva por email.
- Multiempresa: hoy un usuario administra un complejo.

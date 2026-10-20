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
/panel                 Dashboard: próximos turnos y KPIs
/panel/agenda          Agenda de turnos (columnas = canchas) + vista por cancha
/panel/canchas         CRUD de canchas
/panel/horarios        Horarios de atención
/panel/reservas        Reservas y cancelaciones
/panel/caja            Reporte de caja con totales por medio de pago
/panel/empleados       Equipo, roles y permisos
/panel/mi-cuenta       Cambio de contraseña y datos del usuario
/panel/configuracion   Datos del complejo, reglas e integraciones
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
    db/                 schema + migraciones, conexión y repositorios
    auth.ts             scrypt + sesiones en cookie + guardas de permiso
    permissions.ts      matriz de roles y permisos
    scheduling.ts       motor de horarios, solapamiento y cancelación (puro)
    payments/           seam de Mercado Pago
```

### Decisiones técnicas relevantes

- **SQLite con `node:sqlite`** en vez de un ORM: cero compilación nativa, cero
  binarios y un solo archivo. En producción se puede migrar a Postgres
  reemplazando `src/lib/db/index.ts` — el resto del código habla con el
  repositorio, no con SQL.
- **Migraciones versionadas** con `PRAGMA user_version`: el esquema evoluciona
  en sitio sin perder datos (v2 agregó equipo, libro de caja y los campos de
  edición manual de los turnos).
- **Dinero en centavos** (`INTEGER`). Nunca floats.
- **Horarios como `(date, start_min)`** en la zona horaria del complejo: la
  aritmética de slots no depende del servidor ni de DST.
- **Doble control de disponibilidad**: la reserva se re-valida dentro de una
  transacción `BEGIN IMMEDIATE`, así que dos visitantes no pueden tomar el
  mismo horario.
- **Permisos por rol, aplicados en el servidor**: `src/lib/permissions.ts`
  define la matriz; cada server action pide un permiso explícito con
  `requireMemberAction`. Ocultar un botón nunca alcanza para proteger un dato.
- **Reveals con CSS, no con framer-motion**: `IntersectionObserver` + transiciones
  CSS garantizan que el contenido se vea siempre con `prefers-reduced-motion` y
  también sin JavaScript.
- **Pago en sandbox explícito**: sin `MERCADO_PAGO_ACCESS_TOKEN` la reserva se
  aprueba pero la UI dice que no se cobró nada. Nunca se simula un cobro real.
- **`experimental.cpus: 2`**: el build lanza un worker por CPU y en máquinas
  con poca memoria eso agota el heap. Ajustá el valor según el equipo.

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
npm run qa:e2e              # flujo de onboarding: alta → complejo → cancha → reserva
node scripts/qa/e2e-panel.mjs   # agenda, edición de turno, caja y equipo
npm run qa:capture          # capturas en 3 viewports + conteo de errores de consola
node scripts/qa/lighthouse.mjs  # Lighthouse + axe-core
```

Los E2E usan Playwright contra el servidor ya levantado.

| Suite | Pasos | Cubre |
|---|---|---|
| `qa/e2e.mjs` | 10 | registro, complejo, canchas, horarios, página pública, reserva, conflicto de horario |
| `qa/e2e-panel.mjs` | 8 | agenda, alta y edición de un turno, reporte de caja, movimiento manual, alta de empleado, permisos del rol |

## Roles

| Rol | Puede |
|---|---|
| **Dueño** | Todo, incluida la facturación y el equipo |
| **Administrador** | Opera el complejo completo, menos la propiedad de la cuenta |
| **Encargado** | Crea y edita turnos, canchas y horarios. No ve la caja |
| **Bar** | Carga consumos y movimientos de caja. Ve los turnos |
| **Sólo lectura** | Consulta el panel sin modificar nada |

Los permisos se aplican en el servidor (`src/lib/permissions.ts`): una URL de
panel sin permiso redirige al dashboard con un aviso, y una server action sin
permiso falla.

## Ingreso de los empleados

1. El dueño o un administrador va a **Equipo** y agrega a la persona (nombre,
   email, WhatsApp y rol).
2. El sistema crea la cuenta con una **contraseña temporal** y la muestra una
   sola vez para que la comparta.
3. Al primer ingreso, la contraseña temporal **deja de servir**: la persona
   es enviada a **Mi cuenta** y tiene que elegir una propia.
4. Desde ese momento entra con su email y su clave, y ve el complejo del
   dueño con los permisos de su rol.

## Integraciones (por complejo)

Cada complejo configura sus propias cuentas desde **Configuración →
Integraciones**, sin depender de la configuración de la plataforma:

- **Mercado Pago** — access token propio (opcionalmente public key y modo
  sandbox). El token se valida contra la API antes de guardarse y queda
  **cifrado** en la base (AES-256-GCM).
- **WhatsApp** — número del administrador (con prefijo internacional),
  `phone_number_id` y el token permanente de Meta.

Cuando entra una reserva, el complejo **se avisa a sí mismo por WhatsApp**: el
mensaje va desde el número del negocio hacia el propio número del
administrador, con el detalle del turno (cancha, fecha, horario, jugador,
contacto, total, seña, método de pago y el link de la página pública). El
panel guarda una bitácora de los avisos enviados.

Si el complejo no configuró WhatsApp, la reserva se guarda igual y no se
envía ningún aviso: una notificación fallida nunca rompe una reserva.

> En el modo de desarrollo de Meta el destinatario tiene que ser un número
> verificado; en producción alcanza con que el número esté dado de alta.

---

## Pendiente

- `[DATO_REAL]` — número de clientes, testimonios y logos reales.
- Webhook de Mercado Pago (hoy el pago se aprueba en el sandbox o queda
  `pending` esperando el webhook).
- Envío de la confirmación de reserva por email.
- Multiempresa: hoy un usuario administra un complejo.

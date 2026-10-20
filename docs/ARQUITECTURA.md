# Arquitectura del bot y camino a la pila pedida

## Lo que hay hoy

| Capa | Implementación | Por qué |
|---|---|---|
| Transporte HTTP | Next.js 16 (App Router) | Next **es** Node + TypeScript estricto: el requisito de "Node + TS estricto" se cumple sin reescribir nada |
| Núcleo del bot | `src/lib/bot/**` | TypeScript puro, cero imports de React/Next/DB |
| Canales | `src/lib/bot/channels/whatsapp.ts` | WhatsApp es un adaptador, no el núcleo |
| Persistencia | SQLite con `node:sqlite` | Driver nativo de Node: sin compilación nativa ni binarios |
| Cola | Tabla `jobs` con reintentos y backoff | Reemplaza a Redis/BullMQ sin agregar un broker |
| LLM | Opcional, sólo para interpretar texto libre | Sin API key manda el parser por reglas |

### La regla que sostiene todo

El núcleo se comunica con el mundo **sólo** por `BotPorts` (`src/lib/bot/types.ts`):

```ts
export interface BotPorts {
  now(): Date;
  listCourts(complexId: number): CourtSummary[];
  listOpeningHours(complexId: number): OpeningHour[];
  listBookings(complexId: number, date: string): BookingLike[];
  listBlockedSlots(complexId: number, date: string): BlockedSlot[];
  listCustomerBookings(complexId: number, phone: string, fromDate: string): BookingLike[];
  getBooking(complexId: number, bookingId: number): BookingLike | undefined;
  createHold(input: {...}): { id: number };
  transitionBooking(bookingId: number, state: BookingState): void;
  createPaymentLink(input: {...}): Promise<{ url: string | null; ... }>;
  getConversation(phone: string): Conversation | undefined;
  saveConversation(phone: string, complexId: number, state: string, context: Record<string, unknown>): void;
  isStaff(complexId: number, phone: string): boolean;
  audit(input: {...}): void;
  expireStaleHolds(): number[];
}
```

`src/lib/bot/ports-db.ts` es el **único** archivo que sabe de SQL. Cambiar de
motor es reemplazar ese archivo. Y como el núcleo no importa nada del
framework, se levanta sin cambios en Fastify o NestJS:

```ts
// routes/whatsapp.ts en Fastify
app.post("/api/whatsapp/webhook", async (request, reply) => {
  const body = parseInbound(request.body);
  for (const message of body.messages) {
    const complex = resolveComplex(message.phoneNumberId);
    const outcome = await handleMessage(toBotInput(message, complex), createDbPorts());
    for (const r of outcome.replies) await sendReply(config, message.from, r);
  }
  return reply.code(200).send({ ok: true });
});
```

## El anti-doble-reserva

### Lo que hay en SQLite

```sql
-- Un único turno activo por cancha, fecha y hora.
CREATE UNIQUE INDEX idx_bookings_active_slot
  ON bookings(court_id, date, start_min)
  WHERE state IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED');
```

Combinado con la transacción `BEGIN IMMEDIATE` del motor de horarios (que
recalcula la disponibilidad dentro de la transacción) y el chequeo de solapamiento
por duración.

El índice es un **índice único parcial**: el motor lo usa como una restricción,
no como un filtro. Si dos clientes intentan tomar el mismo horario, el segundo
recibe un `UNIQUE constraint failed` y el motor le ofrece otro.

### El equivalente en PostgreSQL

Para solapamientos que no arrancan en el mismo minuto (un turno de 90 min y otro
de 60 min que se pisan), PostgreSQL ofrece la exclusión con `gist`:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (state IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED'));
```

En PostgreSQL los horarios se guardan como `tstzrange` en la zona del complejo.
En SQLite, con `date` + `start_min` + `duration_min`, porque el motor de
horarios ya trabaja con minutos desde medianoche y eso hace la aritmética
independiente del DST.

**La migración es de dos archivos** (`schema.ts` y el repositorio), no de
lógica: el motor de horarios (`src/lib/scheduling.ts`) ya es puro y no cambia.

## La cola

`jobs` con `status`, `attempts`, `run_at` y `last_error`. El `drainJobs()`:

1. toma hasta 10 trabajos pendientes y vencidos (`BEGIN IMMEDIATE`),
2. los ejecuta,
3. los marca como hechos o los reprograma con backoff exponencial (2^intentos
   minutos, tope 60).

Para migrar a BullMQ o pg-boss alcanza con reimplementar `enqueue()` y
`drainJobs()` en `src/lib/bot/queue.ts`; los manejadores de trabajos no cambian.

Los tipos de trabajo actuales:

| Tipo | Qué hace |
|---|---|
| `whatsapp:inbound` | Procesa un mensaje entrante |
| `booking:notify` | Avisa al staff de una reserva nueva |
| `payment:confirm` | Consulta el pago por API y actualiza el turno |

El barrido de HOLD vencidos corre en cada pasada de la cola. En una
instalación con mucho tráfico conviene además un cron que llame a
`drainJobs()` cada minuto.

## El LLM

Opcional y acotado a una sola cosa: **interpretar texto libre**.

```
"mañana a la noche pádel"  →  { sport: "padel", date: "2026-03-03", time: "19:00" }
```

- La salida se valida con Zod (`llmExtractionSchema`).
- Si falla la validación, la llamada o no hay API key → mandan las reglas.
- El modelo **nunca** escribe en la base ni decide precios ni disponibilidad.
- El prompt y el esquema están en `src/lib/bot/llm.ts`.

Para leer texto libre sin LLM, el parser por reglas ya cubre "hoy", "mañana",
"12/03", "lunes", "19:00", "a las 19", "7pm", "quiero reservar", "quiero
cancelar", "turnos hoy", "disponibles", "horarios" y "asesor".

## Lo que falta para la pila pedida

| Pedido | Estado | Qué falta |
|---|---|---|
| NestJS o Fastify | Parcial | Next.js cumple Node + TS estricto. Para Fastify: un archivo de rutas con el ejemplo de arriba y mover los actions a `POST /api/*` |
| PostgreSQL | Parcial | El esquema de la migración v6 y el `EXCLUDE USING gist` están documentados; falta el DDL definitivo y cambiar `ports-db.ts` |
| BullMQ o pg-boss | Parcial | La cola durable ya existe con reintentos; falta el adaptador si se quiere Redis |
| LLM opcional | Completo | Implementado y acotado |
| Mensajes interactivos | Completo | Botones y listas con paginación de 10 filas |
| Plantillas de Meta | Completo | Textos listos para enviar a aprobación en `docs/WHATSAPP-BOT.md` |
| Cola de expiración de HOLD | Completo | Barrido en cada pasada + `expires_at` en el turno |
| Preferencias por staff y resumen diario | Pendiente | `staff_phones.events` ya está en el esquema |
| `blocked_slots` | Parcial | La tabla y la consulta existen; falta la acción de admin y el comando `bloquear` |
| Métricas y alertas | Pendiente | Hoy hay logs estructurados en la tabla `message_log` |

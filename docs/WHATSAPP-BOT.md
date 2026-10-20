# Bot de WhatsApp — guía de configuración

El bot atiende a los clientes y al equipo del complejo **desde el mismo número
de WhatsApp**. Corre sobre la **Cloud API oficial de Meta** (nada de librerías
no oficiales tipo Baileys o whatsapp-web.js: violan los términos de uso y
exponen el número a un bloqueo).

---

## 1. Qué hace

| Función | Quién la usa | Cómo |
|---|---|---|
| **Reservas por WhatsApp** | El cliente | Escribe "quiero reservar una cancha" y el bot lo guía: deporte → fecha → horario → cancha → resumen → link de pago |
| **Confirmación al cliente** | El cliente | Al registrarse el turno, recibe por WhatsApp todos los datos y el link para pagar la seña |
| **Avisos al administrador** | El dueño | Cada reserva nueva y cada pago acreditado le llegan a **su propio chat** |
| **Administración** | El equipo | "turnos hoy", "disponibles", "horarios", "cancelar" — siempre con confirmación antes de cancelar |
| **Pagos** | Sistema | Cuando Mercado Pago acredita la seña, el turno queda confirmado y se avisa a los dos |

### Flujo del cliente

```
"hola"                     → menú (botones)
"quiero reservar"          → "¿de qué sport?"
"pádel"                    → "¿qué día?" (lista de 7 días)
"lunes"                    → "¿qué horario?" (lista paginada de 10)
"19:00"                    → "¿qué cancha?" (sólo las libres a esa hora)
"Pádel Norte"              → resumen con precio, seña y saldo + confirmar
"confirmar"                → turno reservado (HOLD de 10 min) + link de pago
```

Cuando el cliente paga, el turno pasa de `HOLD` a `CONFIRMED`. Si no paga en
10 minutos, el turno se libera solo y se avisa a los dos.

### Comandos del staff

| Comando | Resultado |
|---|---|
| `turnos hoy` / `turnos mañana` | Agenda del día por cancha |
| `disponibles` / `libres` | Horarios libres de hoy |
| `horarios` | Horarios de atención |
| `cancelar` | Lista sus reservas → confirmar → elegir devolver o retener la seña |

Sólo los números cargados en **Configuración → Integraciones → Números del
equipo** pueden usar esos comandos. Cada cancelación pide confirmación y queda
registrada en la auditoría.

---

## 1.5 El dominio que te pide

Meta y Mercado Pago exigen una **URL HTTPS pública** para registrar los
webhooks. No alcanza con `localhost`.

### Opción rápida (para ahora): túnel

> **Importante:** para el túnel usá siempre el **build de producción**
> (`npm run serve`). El dev server **no hidrata a través del túnel**: el
> websocket de HMR falla con 502 y React queda sin hidratar, así que la página
> se ve perfecta pero **ningún botón responde**. Es un problema del dev server
> detrás de un proxy, no de la app: en `localhost` y en el build de producción
> funciona perfecto.

El repo trae un script que levanta un túnel HTTPS, actualiza el `.env.local`
con la URL generada y te imprime los valores exactos para pegar:

```bash
# 1. Descargar cloudflared (una sola vez)
powershell -c "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '.tools/cloudflared.exe'"

# 2. En una terminal: el build de producción
npm run serve

# 3. En otra: el túnel
npm run tunnel
```

Salida:

```
  Dominio público: https://link-sleeps-congress-typing.trycloudflare.com

  Meta for Developers → Webhooks:
    URL de callback:  https://.../api/whatsapp/webhook
    Token:            1cd8ccb09cb9d56e6da7e7134385d992

  Mercado Pago → notificación de pago:
    https://.../api/mercadopago/webhook?complex=<ID_DEL_COMPLEJO>
```

Después de cambiar la URL, **reiniciá el server**: `APP_URL` se lee en
runtime, pero el `.env.local` se carga al arrancar.

> El dominio del túnel rápido cambia cada vez que lo levantás. Sirve para
> **obtener las credenciales y probar**, no para producción: si el dominio
> cambia, hay que volver a actualizar la URL del webhook en Meta.

### Opción de producción: dominio propio

1. Comprá o usá un dominio (por ejemplo `cancha.app`).
2. Apuntá el DNS a tu hosting (Vercel, Railway, un VPS con Docker).
3. Poné en el entorno:

```bash
APP_URL=https://cancha.app
NEXT_PUBLIC_SITE_URL=https://cancha.app
```

`APP_URL` se lee **en runtime**: es la que se usa en la `notification_url` de
Mercado Pago y en los links de los WhatsApp. `NEXT_PUBLIC_SITE_URL` sí se
compila (canonical y Open Graph). Las dos tienen que coincidir.

4. En Meta: `https://cancha.app/api/whatsapp/webhook`
5. En Mercado Pago: `https://cancha.app/api/mercadopago/webhook?complex=<id>`

> **Ojo con la base de datos en Vercel:** el filesystem es efímero, así que
> SQLite no sirve. Hay que migrar a Postgres (el DDL con `EXCLUDE USING gist`
> está en `docs/ARQUITECTURA.md`) o usar Turso. `docker-compose.yml` levanta
> Postgres y Redis para desarrollo.

### Cómo ver el `complex` id

Es el número que aparece en la URL del panel y en la base:

```bash
node -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('./data/cancha.db');console.log(db.prepare('SELECT id,name FROM complexes').all())"
```

---

1. Creá una cuenta en [developers.facebook.com](https://developers.facebook.com)
   y una app de tipo **Business**.
2. En **WhatsApp → API Setup**:
   - Creá un **número de prueba** (o vinculá tu número comercial).
   - Copiá el **Phone Number ID** y el **WhatsApp Business Account ID**.
   - Generá un **token permanente** (System User → WhatsApp Business Account →
     `whatsapp_business_messaging`). El token temporal de 24 h no sirve.
   - Copiá el **App Secret** (Configuración → Básico) para verificar la firma
     de los webhooks.
3. En **Configuración → Webhooks**, agregá:
   - **URL**: `https://TU-DOMINIO/api/whatsapp/webhook`
   - **Token de verificación**: el mismo que pongas en
     `WHATSAPP_VERIFY_TOKEN` (en el `.env`).
   - Suscribite al campo **messages**.
4. En **Configuración → Herramientas del desarrollador →-plantillas de
   mensajes**, creá las plantillas de abajo (categoría **Utility**).

> En el modo de desarrollo de Meta sólo se puede escribir al número de prueba y
> a los destinatarios verificados. Para producción hay que pasar la app a
> revisión y verificar el número.

---

## 3. Configuración en el panel

**Configuración → Integraciones → WhatsApp**:

| Campo | Dónde se saca |
|---|---|
| Tu número de WhatsApp | El número del complejo, con prefijo internacional (`+54 9 351 000 0000`) |
| `phone_number_id` | Meta → WhatsApp → API Setup |
| Token permanente | Meta → WhatsApp → API Setup |
| App secret (opcional) | Meta → Configuración → Básico |

El número que pongas es **también el que recibe los avisos** y el que queda
autorizado como dueño. Para sumar más gente, usá **Números del equipo**.

**Configuración → Integraciones → Mercado Pago**:

| Campo | Dónde se saca |
|---|---|
| Access token | Mercado Pago → Tus negocios → tu integración |
| Public key (opcional) | idem |
| Modo sandbox | Para pruebas |

---

## 4. Variables de entorno

```bash
# Verificación del webhook de WhatsApp
WHATSAPP_VERIFY_TOKEN=un-token-que-inventes

# Token por defecto de la plataforma (opcional: cada complejo puede pegar el suyo)
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ADMIN_PHONE=

# Cifrado de los secretos que guarda cada complejo
INTEGRATION_ENCRYPTION_KEY=una-clave-larga-y-aleatoria

# LLM opcional para interpretar texto libre (sólo extrae intención y datos)
ANTHROPIC_API_KEY=
BOT_LLM_MODEL=claude-haiku-4-5-20251001
```

Sin `ANTHROPIC_API_KEY` el bot funciona igual: manda el parser por reglas.

---

## 5. Plantillas de Meta

Fuera de la ventana de 24 horas desde el último mensaje del usuario, Meta
**obliga** a usar plantillas aprobadas. Se pueden mandar desde
**Configuración → Integraciones** una vez que estén aprobadas.

### `nueva_reserva` (Utility)

```
Hola {{1}}, te avisamos de una reserva nueva en {{2}}.

Cliente: {{3}}
Cancha: {{4}}
Fecha y hora: {{5}}
Seña a cobrar: {{6}}

Ingresá a tu panel para gestionarla.
```

### `pago_recibido` (Utility)

```
Hola {{1}}, recibimos el pago de la seña de {{2}}.

Turno: {{3}} el {{4}} a las {{5}}
Seña: {{6}}

La reserva quedó confirmada.
```

### `reserva_cancelada` (Utility)

```
Hola {{1}}, tu turno del {{2}} a las {{3}} fue cancelado.

{{4}}
```

### `reserva_por_vencer` (Utility)

```
Hola {{1}}, tu turno del {{2}} a las {{3}} vence en {{4}} minutos.

Completá el pago de la seña para confirmarlo: {{5}}
```

### `reserva_expirada` (Utility)

```
Hola {{1}}, tu turno del {{2}} a las {{3}} se liberó porque no se pagó la seña.

Escribinos y te buscamos otro horario.
```

**Cómo mandarlas desde el sistema:** el bot detecta si el mensaje es parte de una
conversación activa de 24 h. Si no lo es y hay una plantilla cargada, la usa;
si no, manda texto y Meta lo rechaza (por eso hay que tenerlas aprobadas).

---

## 6. Mercado Pago

1. En Mercado Pago → **Tus negocios → integraciones**, generá las
   **credenciales de producción** (access token + public key).
2. Pegalos en **Configuración → Integraciones → Mercado Pago**.
3. El sistema crea la preferencia con:
   - `external_ref` = id del turno (así el webhook lo encuentra),
   - `notification_url` = `https://TU-DOMINIO/api/mercadopago/webhook?complex=<id>`,
   - `expiration_date_from` = el vencimiento del HOLD (10 minutos),
   - `auto_return: approved`.
4. Si querés validar la firma del webhook, guardá el **secreto de la
   aplicación** de Mercado Pago en la integración: el sistema valida el header
   `x-signature` con el algoritmo de Mercado Pago.

**El webhook nunca se toma como verdad:** cuando entra una notificación, el
sistema consulta el pago con `GET /v1/payments/{id}` y recién ahí actualiza el
turno. Un webhook duplicado o falsificado no cambia nada (el `mp_payment_id` es
único y los pagos se registran una sola vez).

---

## 7. Seguridad y cumplimiento

- **Firma del webhook**: si el complejo tiene app secret, cada mensaje entrante
  se valida con `X-Hub-Signature-256`. Sin app secret, el webhook acepta
  mensajes sin verificar: configurá el secret.
- **Idempotencia**: los mensajes se deduplican por `wamid` y los pagos por
  `mp_payment_id`.
- **Datos personales**: se guarda el teléfono y el nombre del cliente. Nada de
  tarjetas: las maneja Mercado Pago.
- **Opt-out**: el cliente escribe `BAJA` y deja de recibir avisos.
- **Auditoría**: toda acción administrativa queda en `audit_log` con quién, qué
  y cuándo.
- **Rate limiting**: el webhook ignora los mensajes repetidos del mismo
  `wamid`, y los comandos de administración sólo los acepta el staff.

---

## 8. Probarlo sin Meta

```bash
# Verificación del webhook
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=1234"

# Simular un mensaje entrante
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{
        "metadata":{"phone_number_id":"123"},
        "contacts":[{"profile":{"name":"María"},"wa_id":"5493512345678"}],
        "messages":[{"id":"wamid.1","from":"5493512345678","type":"text","text":{"body":"hola"}}]
      }}]}]}'
```

La colección de pruebas está en `docs/bruno/` (compatible con Bruno y con
Postman: importá el JSON).

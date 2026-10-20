import type { BotLocale, BotReply } from "./types";

/**
 * Catálogo de mensajes del bot.
 *
 * Tono: voseo argentino, cordial, mensajes cortos. Todo el texto que ve el
 * cliente final vive acá, en un solo lugar, para poder revisarlo de un tirón.
 */

type Vars = Record<string, string | number>;

const es: Record<string, (vars?: Vars) => string> = {
  welcome: (v) =>
    `¡Hola${v?.name ? ` ${v.name}` : ""}! Soy el bot de ${v?.complex}. Te puedo ayudar a reservar, consultar disponibilidad o administrar los turnos.\n\nElegí una opción:`,
  menu: () =>
    "¿Qué necesitás?\n\n1️⃣ Reservar una cancha\n2️⃣ Ver turnos disponibles\n3️⃣ Mis reservas\n4️⃣ Cancelar una reserva\n5️⃣ Horarios de atención\n\nEscribí el número o la opción.",
  optionBooking: () => "1️⃣ *Reservar una cancha*\n\n¿De qué sport es?",
  optionAvailability: () => "2️⃣ *Turnos disponibles*",
  optionMyBookings: () => "3️⃣ *Mis reservas*",
  optionCancel: () => "4️⃣ *Cancelar una reserva*",
  optionHours: () => "5️⃣ *Horarios de atención*",
  pickDate: (v) =>
    `Perfecto, ${v?.sport}. ¿Qué día te viene bien?\n\n${v?.options ?? ""}`,
  pickSlot: (v) =>
    `¿Qué horario te sirve? (${v?.court ?? ""}, ${v?.date ?? ""})\n\n${v?.options ?? ""}`,
  pickCourt: (v) =>
    `Elegí la cancha para el ${v?.date ?? ""}:\n\n${v?.options ?? ""}`,
  summary: (v) =>
    `Revisemos la reserva:\n\n🏟️ ${v?.court ?? ""}\n📅 ${v?.date ?? ""}\n🕐 ${v?.time ?? ""} (${v?.duration ?? ""} min)\n\n💰 Turno: ${v?.total ?? ""}\n💳 Seña a pagar: ${v?.deposit ?? ""}\n🏷️ Saldo en la cancha: ${v?.balance ?? ""}\n\n¿Confirmás?`,
  confirmed: (v) =>
    `✅ ¡Listo, ${v?.name ?? ""}! Tu turno quedó reservado.\n\n🏟️ ${v?.court ?? ""}\n📅 ${v?.date ?? ""}\n🕐 ${v?.time ?? ""}\n\nTe enviamos el link para pagar la seña (${v?.deposit ?? ""}):\n${v?.paymentUrl ?? ""}\n\nTenés ${v?.hold ?? ""} minutos para pagar. Si no, el turno se libera.`,
  holdCreated: (v) =>
    `⏳ Te guardé el horario ${v?.time ?? ""} por ${v?.hold ?? ""} minutos.\n\n${v?.paymentUrl ?? ""}`,
  noSlots: (v) => `No hay horarios libres para ${v?.date ?? ""}. Probá con otro día.`,
  noBookings: () => "No tenés reservas registradas con este número.",
  myBookings: (v) => `Tus reservas:\n\n${v?.options ?? ""}`,
  cancelPrompt: (v) =>
    `¿Cuál reserva querés cancelar?\n\n${v?.options ?? ""}`,
  cancelConfirm: (v) =>
    `⚠️ Vas a cancelar:\n\n${v?.options ?? ""}\n\nLa seña es de ${v?.deposit ?? ""}. ¿Querés que se la devolvamos o la retenemos?`,
  cancelDone: (v) =>
    `Listo, cancelé el turno.\n\n${v?.refund ?? ""}\n\nTe enviamos el detalle por WhatsApp.`,
  availability: (v) => `Turnos libres hoy:\n\n${v?.options ?? ""}`,
  todayBookings: (v) => `Turnos de hoy:\n\n${v?.options ?? ""}`,
  hours: (v) => `Atendemos:\n\n${v?.options ?? ""}`,
  notAdmin: () => "Ese comando es sólo para el equipo del complejo.",
  unknown: () =>
    "No te entendí. Probá con un número:\n\n1️⃣ Reservar\n2️⃣ Disponibles\n3️⃣ Mis reservas\n4️⃣ Cancelar\n5️⃣ Horarios",
  human: () =>
    "Te paso con un asesor del complejo. Te van a escribir en un momento. 👋",
  unsubscribe: () =>
    "Listo, te sacamos de los avisos. Para volver a recibir mensajes escribinos al complejo.",
  textOnly: () => "Por ahora sólo proceso mensajes de texto. Escribinos tu consulta y te ayudamos. 👋",
  invalidDate: () => "No entendí la fecha. Escribí algo como \"mañana\" o \"el viernes\".",
  invalidSport: () => "¿Qué sport? Pádel, tenis o fútbol.",
  expired: (v) =>
    `Se te venció el turno ${v?.time ?? ""} porque no se pagó la seña. ¿Querés buscar otro horario?`,
};

const pt: Record<string, (vars?: Vars) => string> = {
  welcome: (v) =>
    `Olá${v?.name ? ` ${v.name}` : ""}! Sou o bot do ${v?.complex}. Posso te ajudar a reservar, consultar disponibilidade ou administrar os turnos.\n\nEscolha uma opção:`,
  menu: () =>
    "O que você precisa?\n\n1️⃣ Reservar uma quadra\n2️⃣ Ver horários disponíveis\n3️⃣ Minhas reservas\n4️⃣ Cancelar uma reserva\n5️⃣ Horários de funcionamento\n\nEscreva o número ou a opção.",
  optionBooking: () => "1️⃣ *Reservar uma quadra*\n\nDe qual esporte é?",
  optionAvailability: () => "2️⃣ *Horários disponíveis*",
  optionMyBookings: () => "3️⃣ *Minhas reservas*",
  optionCancel: () => "4️⃣ *Cancelar uma reserva*",
  optionHours: () => "5️⃣ *Horários de funcionamento*",
  pickDate: (v) =>
    `Perfeito, ${v?.sport}. Que dia fica bom?\n\n${v?.options ?? ""}`,
  pickSlot: (v) =>
    `Que horário serve? (${v?.court ?? ""}, ${v?.date ?? ""})\n\n${v?.options ?? ""}`,
  pickCourt: (v) =>
    `Escolha a quadra para ${v?.date ?? ""}:\n\n${v?.options ?? ""}`,
  summary: (v) =>
    `Vamos revisar a reserva:\n\n🏟️ ${v?.court ?? ""}\n📅 ${v?.date ?? ""}\n🕐 ${v?.time ?? ""} (${v?.duration ?? ""} min)\n\n💰 Sessão: ${v?.total ?? ""}\n💳 Sinal a pagar: ${v?.deposit ?? ""}\n🏷️ Saldo na quadra: ${v?.balance ?? ""}\n\nConfirma?`,
  confirmed: (v) =>
    `✅ Pronto, ${v?.name ?? ""}! Sua reserva ficou registrada.\n\n🏟️ ${v?.court ?? ""}\n📅 ${v?.date ?? ""}\n🕐 ${v?.time ?? ""}\n\nEnviamos o link para pagar o sinal (${v?.deposit ?? ""}):\n${v?.paymentUrl ?? ""}\n\nVocê tem ${v?.hold ?? ""} minutos para pagar. Depois disso, o horário é liberado.`,
  holdCreated: (v) =>
    `⏳ Guardei o horário ${v?.time ?? ""} por ${v?.hold ?? ""} minutos.\n\n${v?.paymentUrl ?? ""}`,
  noSlots: (v) => `Não há horários livres para ${v?.date ?? ""}. Tente outro dia.`,
  noBookings: () => "Você não tem reservas registradas com este número.",
  myBookings: (v) => `Suas reservas:\n\n${v?.options ?? ""}`,
  cancelPrompt: (v) => `Qual reserva você quer cancelar?\n\n${v?.options ?? ""}`,
  cancelConfirm: (v) =>
    `⚠️ Você vai cancelar:\n\n${v?.options ?? ""}\n\nO sinal é de ${v?.deposit ?? ""}. Quer que devolvamos ou fica com o complexo?`,
  cancelDone: (v) => `Pronto, cancelei a reserva.\n\n${v?.refund ?? ""}\n\nEnviamos o detalhe por WhatsApp.`,
  availability: (v) => `Horários livres hoje:\n\n${v?.options ?? ""}`,
  todayBookings: (v) => `Reservas de hoje:\n\n${v?.options ?? ""}`,
  hours: (v) => `Atendemos:\n\n${v?.options ?? ""}`,
  notAdmin: () => "Esse comando é só para a equipe do complexo.",
  unknown: () =>
    "Não entendi. Tente com um número:\n\n1️⃣ Reservar\n2️⃣ Disponíveis\n3️⃣ Minhas reservas\n4️⃣ Cancelar\n5️⃣ Horários",
  human: () => "Vou te passar para um assessor do complexo. Te chamam já. 👋",
  unsubscribe: () =>
    "Pronto, tiramos você dos avisos. Para voltar a receber mensagens fale com o complexo.",
  textOnly: () =>
    "Por enquanto só processo mensagens de texto. Escreva sua dúvida e ajudamos. 👋",
  invalidDate: () => "Não entendi a data. Escreva algo como \"amanhã\" ou \"sexta\".",
  invalidSport: () => "Qual esporte? Padel, tênis ou futebol.",
  expired: (v) =>
    `Sua reserva ${v?.time ?? ""} expirou porque o sinal não foi pago. Quer buscar outro horário?`,
};

const CATALOGS: Record<BotLocale, Record<string, (vars?: Vars) => string>> = {
  "es-AR": es,
  "pt-BR": pt,
};

export function t(locale: BotLocale, key: string, vars?: Vars): string {
  const catalog = CATALOGS[locale] ?? es;
  const message = catalog[key] ?? es[key];
  return message ? message(vars) : key;
}

export function reply(
  locale: BotLocale,
  key: string,
  vars?: Vars,
  extra?: Partial<BotReply>,
): BotReply {
  return { text: t(locale, key, vars), ...extra };
}

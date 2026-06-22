export type ChatMode = "bot" | "human"
export type MessageRole = "incoming" | "outgoing"
export type ConnectionStatus = "connected" | "disconnected" | "scanning"

export interface ChatMessage {
  id: string
  role: MessageRole
  text: string
  timestamp: string
  sentByBot?: boolean
  isNote?: boolean
  tokens?: { input: number; output: number }
}

export interface Chat {
  id: string
  name: string
  phone: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  mode: ChatMode
  messages: ChatMessage[]
  hasAlert?: boolean
  csat?: number
}

export interface ContactDetail {
  email?: string
  empresa?: string
  interes?: string
  origen?: string
  primerContacto: string
}

export interface PromptVariable {
  key: string
  label: string
  value: string
  placeholder: string
}

export interface DaySchedule {
  day: string
  label: string
  active: boolean
  from: string
  to: string
}

export const DEFAULT_VARIABLES: PromptVariable[] = [
  { key: "nombre_empresa", label: "Nombre de la empresa", value: "Chemi Agency", placeholder: "Ej: Mi Empresa S.A." },
  { key: "servicios", label: "Servicios principales", value: "diseño web, marketing digital, branding", placeholder: "Ej: servicio1, servicio2" },
  { key: "horario", label: "Horario de atención", value: "lunes a viernes de 9 a 18hs", placeholder: "Ej: lun-vie 9-18" },
  { key: "telefono", label: "Teléfono de contacto", value: "+54 11 1234-5678", placeholder: "Ej: +54 11 0000-0000" },
  { key: "email", label: "Email de contacto", value: "hola@chemi.com.ar", placeholder: "Ej: info@empresa.com" },
]

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "mon", label: "Lunes",     active: true,  from: "09:00", to: "18:00" },
  { day: "tue", label: "Martes",    active: true,  from: "09:00", to: "18:00" },
  { day: "wed", label: "Miércoles", active: true,  from: "09:00", to: "18:00" },
  { day: "thu", label: "Jueves",    active: true,  from: "09:00", to: "18:00" },
  { day: "fri", label: "Viernes",   active: true,  from: "09:00", to: "18:00" },
  { day: "sat", label: "Sábado",    active: false, from: "10:00", to: "14:00" },
  { day: "sun", label: "Domingo",   active: false, from: "10:00", to: "14:00" },
]

export const DEFAULT_ALERT_KEYWORDS = ["urgente", "queja", "cancelar", "reclamo", "problema", "molesto", "enojado"]

export const MOCK_CONTACT_DETAILS: Record<string, ContactDetail> = {
  "1": { email: "lucia@eventosfer.com", empresa: "Eventos Fernández", interes: "Landing page para evento", origen: "Instagram Ads", primerContacto: "22/06/2026 10:30" },
  "2": { empresa: "Ferretería Rojas", interes: "Marketing digital para pymes", origen: "Instagram Ads", primerContacto: "22/06/2026 10:10" },
  "3": { email: "carolina@studiobaires.com", empresa: "Studio Pilates Boutique", interes: "Rebranding completo (logo + web)", origen: "Referido - Estudio Creativo Baires", primerContacto: "22/06/2026 09:30" },
  "4": { interes: "Información general de servicios", origen: "Google Search", primerContacto: "21/06/2026 18:22" },
  "5": { empresa: "Freelancer / Personal", interes: "Gestión de redes (Instagram + TikTok)", origen: "Búsqueda orgánica", primerContacto: "21/06/2026 14:00" },
  "6": { empresa: "Suárez Construcciones", interes: "Contacto comercial vía llamada", origen: "WhatsApp directo", primerContacto: "20/06/2026 16:45" },
}

export interface ResponseTemplate {
  id: string
  category: string
  label: string
  text: string
}

export const MOCK_TEMPLATES: ResponseTemplate[] = [
  { id: "t1", category: "Saludo", label: "Bienvenida", text: "¡Hola! Gracias por escribirnos. ¿En qué podemos ayudarte hoy? 😊" },
  { id: "t2", category: "Saludo", label: "Retomar chat", text: "¡Hola! Te retomo desde el equipo. ¿Seguís con interés en nuestros servicios?" },
  { id: "t3", category: "Servicios", label: "Precios", text: "Nuestros planes arrancán desde $80.000/mes. ¿Querés que te detalle qué incluye cada uno?" },
  { id: "t4", category: "Servicios", label: "Portfolio", text: "Te comparto nuestro portfolio para que veas trabajos anteriores: [link]. ¿Hay algún estilo que te llame la atención?" },
  { id: "t5", category: "Cierre", label: "Agendar llamada", text: "¿Tenés 15 minutos esta semana para una llamada rápida? Así te contamos mejor cómo trabajamos." },
  { id: "t6", category: "Cierre", label: "Enviar propuesta", text: "Perfecto, en las próximas horas te enviamos una propuesta personalizada a tu email." },
  { id: "t7", category: "Cierre", label: "Follow up", text: "¡Hola! Pasamos a ver si pudiste revisar la propuesta. ¿Quedó alguna duda?" },
  { id: "t8", category: "General", label: "Horario", text: "Estamos disponibles de lunes a viernes de 9 a 18hs. ¿Preferís que te llamemos o seguimos por aquí?" },
]

export interface AnalyticsDay {
  day: string
  bot: number
  human: number
  inputTokens: number
  outputTokens: number
  avgBotResponseSec: number
  avgHumanResponseSec: number
  csatAvg: number
}

export const GPT_PRICE = { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 }

export function calcCost(input: number, output: number) {
  return input * GPT_PRICE.input + output * GPT_PRICE.output
}

export const MOCK_ANALYTICS: AnalyticsDay[] = [
  { day: "Lun", bot: 24, human: 8,  inputTokens: 9_840,  outputTokens: 2_016, avgBotResponseSec: 1.2, avgHumanResponseSec: 8.4,  csatAvg: 4.5 },
  { day: "Mar", bot: 31, human: 5,  inputTokens: 12_710, outputTokens: 2_604, avgBotResponseSec: 1.1, avgHumanResponseSec: 6.2,  csatAvg: 4.3 },
  { day: "Mié", bot: 19, human: 12, inputTokens: 7_790,  outputTokens: 1_596, avgBotResponseSec: 1.5, avgHumanResponseSec: 10.1, csatAvg: 4.1 },
  { day: "Jue", bot: 38, human: 7,  inputTokens: 15_580, outputTokens: 3_192, avgBotResponseSec: 0.9, avgHumanResponseSec: 7.3,  csatAvg: 4.7 },
  { day: "Vie", bot: 27, human: 15, inputTokens: 11_070, outputTokens: 2_268, avgBotResponseSec: 1.3, avgHumanResponseSec: 9.5,  csatAvg: 4.4 },
  { day: "Sáb", bot: 14, human: 3,  inputTokens: 5_740,  outputTokens: 1_176, avgBotResponseSec: 1.0, avgHumanResponseSec: 12.3, csatAvg: 4.6 },
  { day: "Dom", bot: 8,  human: 1,  inputTokens: 3_280,  outputTokens: 672,   avgBotResponseSec: 0.8, avgHumanResponseSec: 15.0, csatAvg: 4.8 },
]

// ─── Blacklist ───────────────────────────────────────────────────────────────

export const MOCK_BLACKLIST: string[] = [
  "+54 11 3333-7777",
  "+54 11 9876-5432",
]

// ─── Flow builder ────────────────────────────────────────────────────────────

export interface FlowNode {
  id: string
  type: "start" | "message" | "condition" | "action" | "end"
  label: string
  content: string
  children: FlowNode[]
  conditionLabel?: string
}

export interface BotFlow {
  id: string
  name: string
  active: boolean
  description: string
  root: FlowNode
}

export const MOCK_FLOWS: BotFlow[] = [
  {
    id: "flow-1",
    name: "Flujo principal",
    active: true,
    description: "Bienvenida y derivación según interés",
    root: {
      id: "n1", type: "start", label: "Inicio", content: "Punto de entrada del flujo", children: [
        {
          id: "n2", type: "message", label: "Bienvenida", content: "¡Hola! 👋 Soy el asistente de {{nombre_empresa}}. ¿En qué te puedo ayudar?\n\n1️⃣ Precios y servicios\n2️⃣ Soporte técnico\n3️⃣ Hablar con un agente", children: [
            {
              id: "n3", type: "condition", label: "¿Qué eligió?", content: "Según respuesta del usuario", children: [
                {
                  id: "n4", conditionLabel: "\"1\" o \"precio\"", type: "message", label: "Info precios", content: "Nuestros servicios arrancan desde $50.000. ¿Te envío un presupuesto detallado?", children: [
                    { id: "n5", type: "end", label: "Fin", content: "Conversación finalizada", children: [] }
                  ]
                },
                {
                  id: "n6", conditionLabel: "\"2\" o \"soporte\"", type: "action", label: "Derivar soporte", content: "Asignar al equipo de soporte técnico", children: [
                    { id: "n7", type: "end", label: "Fin", content: "Conversación finalizada", children: [] }
                  ]
                },
                {
                  id: "n8", conditionLabel: "\"3\" o \"agente\"", type: "action", label: "Escalar agente", content: "Transferir a agente humano disponible", children: [
                    { id: "n9", type: "end", label: "Fin", content: "Conversación finalizada", children: [] }
                  ]
                },
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "flow-2",
    name: "Consulta de horarios",
    active: false,
    description: "Responde consultas sobre horarios de atención",
    root: {
      id: "f2n1", type: "start", label: "Inicio", content: "Punto de entrada del flujo", children: [
        {
          id: "f2n2", type: "message", label: "Informar horarios", content: "Nuestros horarios de atención son:\n🕘 Lun a Vie: 9:00 – 18:00\n🕘 Sábados: 9:00 – 13:00\n\n¿Necesitás algo más?", children: [
            { id: "f2n3", type: "end", label: "Fin", content: "Conversación finalizada", children: [] }
          ]
        }
      ]
    }
  },
  {
    id: "flow-3",
    name: "Calificación de lead",
    active: false,
    description: "Recopila datos del prospecto para el equipo comercial",
    root: {
      id: "f3n1", type: "start", label: "Inicio", content: "Punto de entrada del flujo", children: [
        {
          id: "f3n2", type: "message", label: "Pedir nombre", content: "¡Hola! Para ayudarte mejor, ¿me decís tu nombre?", children: [
            {
              id: "f3n3", type: "message", label: "Pedir empresa", content: "Gracias {{nombre}}. ¿De qué empresa o rubro nos escribís?", children: [
                {
                  id: "f3n4", type: "message", label: "Pedir presupuesto", content: "¿Tenés un presupuesto mensual estimado para marketing?", children: [
                    {
                      id: "f3n5", type: "action", label: "Crear lead CRM", content: "Guardar datos del prospecto y notificar al equipo comercial", children: [
                        { id: "f3n6", type: "end", label: "Fin", content: "Lead registrado y conversación finalizada", children: [] }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
]

export const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    name: "Lucía Fernández",
    phone: "+54 9 11 4523-7890",
    lastMessage: "Perfecto, muchas gracias! 🙌",
    lastMessageTime: "10:42",
    unread: 0,
    mode: "bot",
    messages: [
      { id: "m1", role: "incoming", text: "Hola, quería consultar por el servicio de diseño web", timestamp: "10:30" },
      { id: "m2", role: "outgoing", text: "¡Hola Lucía! Claro, con gusto te cuento. Ofrecemos diseño de landing pages, sitios corporativos y tiendas online. ¿Cuál es tu necesidad?", timestamp: "10:31", sentByBot: true, tokens: { input: 318, output: 38 } },
      { id: "m3", role: "incoming", text: "Necesito una landing page para un evento", timestamp: "10:33" },
      { id: "m4", role: "outgoing", text: "Genial! Para una landing de evento solemos trabajar con un plazo de 5-7 días hábiles. El precio base es $150.000. ¿Te gustaría que un asesor te contacte para contarte más detalles?", timestamp: "10:35", sentByBot: true, tokens: { input: 365, output: 52 } },
      { id: "m5", role: "incoming", text: "Sí, me interesa hablar con alguien", timestamp: "10:40" },
      { id: "m6", role: "outgoing", text: "¡Perfecto! Te voy a pasar los datos de nuestro equipo comercial. En breve te contactan. ¿Tenés alguna preferencia de horario?", timestamp: "10:41", sentByBot: true, tokens: { input: 382, output: 34 } },
      { id: "m7", role: "incoming", text: "Perfecto, muchas gracias! 🙌", timestamp: "10:42" },
    ],
  },
  {
    id: "2",
    name: "Martín Rojas",
    phone: "+54 9 11 5678-1234",
    lastMessage: "Tengo un problema con el servicio anterior",
    lastMessageTime: "10:18",
    unread: 3,
    mode: "bot",
    hasAlert: true,
    messages: [
      { id: "m1", role: "incoming", text: "Buen día, vi su publicidad en Instagram", timestamp: "10:10" },
      { id: "m2", role: "outgoing", text: "¡Buenos días Martín! Qué bueno que nos encontraste. ¿En qué podemos ayudarte?", timestamp: "10:11", sentByBot: true, tokens: { input: 312, output: 22 } },
      { id: "m3", role: "incoming", text: "Quería info sobre precios de marketing digital", timestamp: "10:12" },
      { id: "m4", role: "outgoing", text: "Claro! Tenemos planes desde $80.000/mes que incluyen gestión de redes, campañas de ads y reportes mensuales. ¿Qué tipo de negocio tenés?", timestamp: "10:13", sentByBot: true, tokens: { input: 344, output: 44 } },
      { id: "m5", role: "incoming", text: "Una ferretería pequeña, somos 5 empleados", timestamp: "10:14" },
      { id: "m6", role: "outgoing", text: "Para pymes como la tuya tenemos un plan especial. ¿Querés que te enviemos la propuesta por email o preferís una llamada?", timestamp: "10:14", sentByBot: true, tokens: { input: 368, output: 36 } },
      { id: "m7", role: "incoming", text: "¿Tienen descuentos para pymes?", timestamp: "10:15" },
      { id: "m8", role: "outgoing", text: "Sí, contamos con descuentos especiales para pymes. ¿Me pasás tu email para enviarte la info?", timestamp: "10:16", sentByBot: true, tokens: { input: 390, output: 28 } },
      { id: "m9", role: "incoming", text: "Tengo un problema con el servicio anterior", timestamp: "10:18" },
    ],
  },
  {
    id: "3",
    name: "Carolina Vega",
    phone: "+54 9 351 888-5566",
    lastMessage: "Ok entendido, espero la propuesta",
    lastMessageTime: "09:58",
    unread: 0,
    mode: "human",
    messages: [
      { id: "m1", role: "incoming", text: "Hola! Me comunicó con ustedes una colega", timestamp: "09:30" },
      { id: "m2", role: "outgoing", text: "¡Hola Carolina! Bienvenida. ¿De qué empresa viene la recomendación?", timestamp: "09:31", sentByBot: true, tokens: { input: 310, output: 20 } },
      { id: "m3", role: "incoming", text: "De Estudio Creativo Baires, trabajan con ustedes hace tiempo", timestamp: "09:32" },
      { id: "m4", role: "outgoing", text: "¡Claro, los conocemos! ¿En qué proyecto estás pensando?", timestamp: "09:33", sentByBot: true, tokens: { input: 330, output: 18 } },
      { id: "m5", role: "incoming", text: "Necesito rebranding completo, logo, manual de marca y web", timestamp: "09:45" },
      { id: "m6", role: "outgoing", text: "Entiendo, es un proyecto integral. Para ese alcance conviene hablar directamente con nuestra directora creativa. ¿Te parece bien si la sumamos a la conversación?", timestamp: "09:46", sentByBot: false },
      { id: "m7", role: "incoming", text: "Sí, perfecto!", timestamp: "09:50" },
      { id: "m8", role: "outgoing", text: "La voy a contactar ahora. Mientras tanto, ¿podés contarme un poco más sobre tu rubro y el estilo de marca que imaginás?", timestamp: "09:51", sentByBot: false },
      { id: "m9", role: "incoming", text: "Tengo un estudio de pilates boutique, quiero algo minimalista y sofisticado", timestamp: "09:55" },
      { id: "m10", role: "outgoing", text: "Perfecto, con eso ya le paso el contexto. Voy a enviarte una propuesta base esta tarde.", timestamp: "09:56", sentByBot: false },
      { id: "m11", role: "incoming", text: "Ok entendido, espero la propuesta", timestamp: "09:58" },
      { id: "m12", role: "outgoing", text: "Cliente derivada por Estudio Creativo Baires — proyecto grande, rebranding completo. Asignar a directora creativa.", timestamp: "09:59", isNote: true },
    ],
  },
  {
    id: "4",
    name: "Diego Herrera",
    phone: "+54 9 11 2233-4455",
    lastMessage: "Quiero saber cómo funciona el servicio",
    lastMessageTime: "Ayer",
    unread: 1,
    mode: "bot",
    messages: [
      { id: "m1", role: "incoming", text: "Quiero saber cómo funciona el servicio", timestamp: "Ayer 18:22" },
    ],
  },
  {
    id: "5",
    name: "Florencia Méndez",
    phone: "+54 9 11 9988-7766",
    lastMessage: "Muchas gracias por la información",
    lastMessageTime: "Ayer",
    unread: 0,
    mode: "bot",
    messages: [
      { id: "m1", role: "incoming", text: "Hola, necesito presupuesto para redes sociales", timestamp: "Ayer 14:00" },
      { id: "m2", role: "outgoing", text: "Hola Florencia! Con gusto te ayudo. ¿Para qué redes necesitás el servicio?", timestamp: "Ayer 14:01", sentByBot: true, tokens: { input: 308, output: 20 } },
      { id: "m3", role: "incoming", text: "Instagram y TikTok principalmente", timestamp: "Ayer 14:02" },
      { id: "m4", role: "outgoing", text: "Para esas dos redes tenemos un plan de $95.000/mes con 3 publicaciones semanales, stories diarias y reporte mensual.", timestamp: "Ayer 14:03", sentByBot: true, tokens: { input: 340, output: 36 } },
      { id: "m5", role: "incoming", text: "Muchas gracias por la información", timestamp: "Ayer 14:10" },
    ],
  },
  {
    id: "6",
    name: "Pablo Suárez",
    phone: "+54 9 341 445-2233",
    lastMessage: "¿Me pueden llamar mañana a las 10?",
    lastMessageTime: "Lun",
    unread: 0,
    mode: "bot",
    messages: [
      { id: "m1", role: "incoming", text: "¿Me pueden llamar mañana a las 10?", timestamp: "Lun 16:45" },
      { id: "m2", role: "outgoing", text: "¡Claro Pablo! Voy a agendar el llamado para mañana a las 10. ¿A qué número te llamamos?", timestamp: "Lun 16:46", sentByBot: true, tokens: { input: 320, output: 26 } },
    ],
  },
]

export const MOCK_ARCHIVED_CHATS: Chat[] = [
  {
    id: "a1",
    name: "Valentina Torres",
    phone: "+54 9 11 7654-3210",
    lastMessage: "Perfecto, arrancamos la semana que viene",
    lastMessageTime: "19/06/2026",
    unread: 0,
    mode: "human",
    csat: 5,
    messages: [
      { id: "m1", role: "incoming", text: "Hola, quería consultar por una tienda online", timestamp: "19/06 09:10" },
      { id: "m2", role: "outgoing", text: "¡Hola Valentina! Claro. ¿Tenés productos físicos o digitales?", timestamp: "19/06 09:11", sentByBot: true, tokens: { input: 310, output: 18 } },
      { id: "m3", role: "incoming", text: "Productos físicos, ropa de mujer", timestamp: "19/06 09:12" },
      { id: "m4", role: "outgoing", text: "Genial! Para e-commerce de moda trabajamos con Tiendanube + diseño personalizado. El proyecto completo arranca desde $280.000. ¿Te interesa una reunión?", timestamp: "19/06 09:14", sentByBot: true, tokens: { input: 355, output: 48 } },
      { id: "m5", role: "incoming", text: "Sí, me interesa. ¿Cuándo podemos hablar?", timestamp: "19/06 10:30" },
      { id: "m6", role: "outgoing", text: "Mañana a las 11 tenemos disponibilidad. ¿Te queda bien?", timestamp: "19/06 10:32", sentByBot: false },
      { id: "m7", role: "incoming", text: "Perfecto, arrancamos la semana que viene", timestamp: "19/06 11:00" },
    ],
  },
  {
    id: "a2",
    name: "Rodrigo Benitez",
    phone: "+54 9 11 3344-5566",
    lastMessage: "Gracias, voy a pensarlo",
    lastMessageTime: "18/06/2026",
    unread: 0,
    mode: "bot",
    messages: [
      { id: "m1", role: "incoming", text: "Buenas, ¿hacen campañas de Google Ads?", timestamp: "18/06 14:00" },
      { id: "m2", role: "outgoing", text: "¡Hola! Sí, hacemos campañas de Google Ads, Meta Ads y TikTok Ads. ¿Qué tipo de negocio tenés?", timestamp: "18/06 14:01", sentByBot: true, tokens: { input: 315, output: 26 } },
      { id: "m3", role: "incoming", text: "Un restaurante en Palermo", timestamp: "18/06 14:02" },
      { id: "m4", role: "outgoing", text: "Para gastronomía solemos recomendar Meta Ads + Google Maps Ads. El presupuesto mínimo recomendado es $50.000/mes en pauta + $40.000 de gestión.", timestamp: "18/06 14:04", sentByBot: true, tokens: { input: 368, output: 44 } },
      { id: "m5", role: "incoming", text: "Gracias, voy a pensarlo", timestamp: "18/06 14:10" },
    ],
  },
  {
    id: "a3",
    name: "Sofía Herrera",
    phone: "+54 9 351 222-3344",
    lastMessage: "Ya quedó todo, muchas gracias!",
    lastMessageTime: "15/06/2026",
    unread: 0,
    mode: "human",
    csat: 5,
    messages: [
      { id: "m1", role: "incoming", text: "Necesito un logo urgente para el lunes", timestamp: "15/06 08:30" },
      { id: "m2", role: "outgoing", text: "¡Hola Sofía! Para logo express con entrega en 48hs tenemos un servicio especial de $45.000. Incluye 3 propuestas y 2 revisiones.", timestamp: "15/06 08:31", sentByBot: true, tokens: { input: 322, output: 40 } },
      { id: "m3", role: "incoming", text: "Perfecto, lo tomo", timestamp: "15/06 08:33" },
      { id: "m4", role: "outgoing", text: "Excelente! Te paso el link de pago y en cuanto confirmes arrancamos.", timestamp: "15/06 08:34", sentByBot: false },
      { id: "m5", role: "incoming", text: "Ya quedó todo, muchas gracias!", timestamp: "15/06 09:00" },
    ],
  },
  {
    id: "a4",
    name: "Ignacio Peralta",
    phone: "+54 9 11 8877-6655",
    lastMessage: "No me interesa por ahora",
    lastMessageTime: "14/06/2026",
    unread: 0,
    mode: "bot",
    messages: [
      { id: "m1", role: "incoming", text: "Hola, vi que hacen marketing", timestamp: "14/06 16:00" },
      { id: "m2", role: "outgoing", text: "¡Hola Ignacio! Sí, somos una agencia de marketing y diseño. ¿En qué podemos ayudarte?", timestamp: "14/06 16:01", sentByBot: true, tokens: { input: 310, output: 22 } },
      { id: "m3", role: "incoming", text: "¿Cuánto cobran por manejar Instagram?", timestamp: "14/06 16:02" },
      { id: "m4", role: "outgoing", text: "La gestión de Instagram arranca desde $65.000/mes con 3 posts semanales, stories y reporte. ¿Querés más info?", timestamp: "14/06 16:03", sentByBot: true, tokens: { input: 334, output: 30 } },
      { id: "m5", role: "incoming", text: "No me interesa por ahora", timestamp: "14/06 16:10" },
    ],
  },
  {
    id: "a5",
    name: "Mariana Lagos",
    phone: "+54 9 11 5544-7788",
    lastMessage: "Listo, quedamos así entonces",
    lastMessageTime: "12/06/2026",
    unread: 0,
    mode: "human",
    csat: 4,
    messages: [
      { id: "m1", role: "incoming", text: "Hola, necesito ayuda con mi marca personal", timestamp: "12/06 10:00" },
      { id: "m2", role: "outgoing", text: "¡Hola Mariana! Para marca personal trabajamos identidad visual + bio profesional + kit de redes. ¿Contame un poco más sobre vos?", timestamp: "12/06 10:01", sentByBot: true, tokens: { input: 318, output: 38 } },
      { id: "m3", role: "incoming", text: "Soy coach de bienestar, quiero algo femenino y minimalista", timestamp: "12/06 10:05" },
      { id: "m4", role: "outgoing", text: "Perfecto perfil! Tenemos experiencia en ese rubro. Te mando ejemplos de trabajos similares.", timestamp: "12/06 10:06", sentByBot: false },
      { id: "m5", role: "incoming", text: "Me encantaron los ejemplos, quiero avanzar", timestamp: "12/06 10:30" },
      { id: "m6", role: "outgoing", text: "Genial! Te preparo la propuesta formal para esta tarde.", timestamp: "12/06 10:31", sentByBot: false },
      { id: "m7", role: "incoming", text: "Listo, quedamos así entonces", timestamp: "12/06 11:00" },
    ],
  },
]

export const DEFAULT_PROMPT = `Sos el asistente virtual de {{nombre_empresa}}, especializada en {{servicios}}. Tu rol es responder consultas de potenciales clientes por WhatsApp de manera profesional, amigable y directa.

**Información de contacto:**
- Horario de atención: {{horario}}
- Teléfono: {{telefono}}
- Email: {{email}}

**Tus objetivos principales:**
1. Responder preguntas sobre los servicios que ofrecemos
2. Calificar leads (entender qué necesita el cliente y si es viable)
3. Agendar reuniones o llamadas con el equipo comercial cuando el cliente está listo
4. Derivar al equipo humano cuando la consulta es compleja o ya hay interés real

**Estilo de comunicación:**
- Usá un tono cercano pero profesional
- Respondé en el idioma del cliente
- Usá emojis con moderación
- Nunca seas evasivo: si no sabés algo, decilo y derivá al equipo

**Cuándo derivar al equipo humano:**
- Si el cliente pide hablar con una persona
- Si la consulta involucra presupuestos personalizados grandes
- Si hay quejas o situaciones delicadas
- Si el cliente ya es cliente activo con un proyecto en curso`

export const MOCK_CONNECTION = {
  status: "connected" as ConnectionStatus,
  phone: "+54 9 11 1234-5678",
  name: "Agencia Demo",
  connectedSince: "2026-06-20T09:15:00",
  messagesProcessed: 247,
  botActive: true,
}

export const es = {
  // Sidebar
  sidebar: {
    overview: "Resumen",
    manageBusinesses: "Gestionar Empresas",
    inbox: "Bandeja de Entrada",
    customers: "Clientes (CRM)",
    knowledge: "Conocimiento y SOPs",
    agents: "Configuración de Agentes",
    simulator: "Simulador de IA",
    settings: "Ajustes",
    reservations: "Reservas",
    signOut: "Cerrar Sesión"
  },
  
  // Dashboard Overview
  overview: {
    title: "Resumen del Sistema",
    subtitle: "Métricas en tiempo real y estado del sistema para",
    noBusiness: "Ninguna empresa seleccionada. Crea o selecciona una empresa para ver métricas.",
    totalConversations: "Conversaciones Totales",
    avgResolutionTime: "Tiempo Prom. de Resolución",
    botDeflectionRate: "Tasa de Desvío (Bot)",
    escalations: "Escalaciones a Humanos",
    recentActivity: "Actividad Reciente",
    aiResolved: "La IA resolvió una consulta de reserva",
    knowledgeGap: "Brecha de Conocimiento Detectada",
    handoff: "Se solicitó transferencia a humano",
    systemHealth: "Estado del Sistema",
    allSystemsOperational: "Todos los sistemas operativos. Webhooks y Base de Datos conectados.",
  },

  // Settings
  settings: {
    title: "Ajustes de Usuario y Empresa",
    subtitle: "Gestiona las preferencias y las integraciones del negocio seleccionado.",
    languagePreferences: "Preferencias de Idioma",
    selectLanguage: "Seleccionar el Idioma del Dashboard",
    whatsappIntegration: "Integración de WhatsApp",
    metaToken: "Token de Acceso de Meta",
    phoneId: "ID del Número de Teléfono (Phone Number ID)",
    saveChanges: "Guardar Cambios",
  },

  // Manage Businesses
  companies: {
    title: "Gestionar Empresas",
    subtitle: "Crea y configura múltiples agentes de IA para diferentes negocios.",
    newBusiness: "+ Onboarding de IA",
    unnamed: "Empresa sin nombre",
    id: "ID",
    editConfig: "Editar Config.",
    delete: "Eliminar",
    noBusinesses: "Aún no has creado ninguna empresa.",
    editTitle: "Editar Configuración de la Empresa",
    name: "Nombre de la Empresa",
    whatsappId: "ID de Teléfono de WhatsApp (Opcional)",
    calendlyLink: "Enlace de Calendly",
    persona: "Personalidad del Agente",
    productsCatalog: "Catálogo de Productos / Servicios",
    knowledgeBase: "Base de Conocimiento (Políticas, FAQs)",
    cancel: "Cancelar",
    save: "Guardar Configuración",
    saving: "Guardando...",
    confirmDelete: "¿Estás seguro de que deseas eliminar esta empresa?",
  },

  // Customers (CRM)
  customers: {
    title: "CRM de Clientes",
    subtitle: "Perfiles de Memoria a Largo Plazo para",
    subtitle2: "La IA extrae hechos de las conversaciones automáticamente para construir estos perfiles con el tiempo.",
    noBusiness: "Por favor, selecciona una empresa para ver los perfiles CRM.",
    loading: "Cargando perfiles...",
    noProfiles: "No se encontraron perfiles CRM. ¡Chatea con el Simulador de IA para generar memoria!",
    lastActive: "Última actividad",
    extractedFacts: "Hechos Extraídos",
    noFacts: "Aún no hay hechos extraídos.",
  },

  // AI Simulator
  simulator: {
    title: "Simulador de IA",
    subtitle: "Probando",
    subtitle2: "en tiempo real.",
    noBusiness: "Ninguna Empresa Seleccionada",
    typeMessage: "Escribe tu mensaje aquí...",
    send: "Enviar",
  },

  // Agent Config
  agents: {
    title: "Configuración de Agentes",
    subtitle: "Gestiona tu equipo especializado de IA y configura sus personalidades.",
    brandPersona: "Personalidad y Tono de la Marca",
    casual: "Casual y Amigable",
    professional: "Profesional y Formal",
    salesDriven: "Enérgico y Orientado a Ventas",
    currentTone: "Tono actual",
    noPersona: "No hay personalidad configurada.",
    routerAgent: "Agente Enrutador",
    routerDesc: "Identifica la intención y transfiere al agente correcto.",
    salesAgent: "Agente de Ventas",
    salesDesc: "Recomienda productos y capta leads.",
    bookingAgent: "Agente de Reservas",
    bookingDesc: "Se integra con Calendly y Google Sheets.",
    active: "Activo",
    enable: "Habilitar",
  },

  // Knowledge & SOPs
  knowledge: {
    title: "Conocimiento y SOPs",
    subtitle: "Entrena al equipo de IA de",
    subtitle2: "proporcionando menús, directrices y procedimientos.",
    dataSources: "Fuentes de Datos",
    sops: "Biblioteca de Acciones (SOP)",
    uploaded: "Conocimiento Subido",
    active: "Activo",
    uploadPdf: "Subir PDF / Imagen",
    scrapeWeb: "Añadir Enlace",
    actionQueue: "Cola de Tareas Pendientes",
    actionQueueDesc: "Cuando la IA no sabe cómo manejar una solicitud específica, crea un ticket aquí para que escribas el procedimiento.",
    missingSop: "SOP Faltante",
    ago: "horas atrás",
    writeProcedure: "Escribir Procedimiento",
    completedSop: "SOP Completado",
    noDataSources: "Aún no hay fuentes de datos subidas. Añade un sitio web, documento o PDF abajo.",
    addLinkTitle: "Añadir Enlace",
    addLinkSubtitle: "Ingresa la URL del Sitio Web, Google Doc o Google Sheet (Debe ser público):",
    cancel: "Cancelar",
    scan: "Escanear"
  },
  
  // Onboarding
  onboarding: {
    title: "Configuración Charlo AI",
    subtitle: "Cuéntame sobre tu negocio y configuraré tu inteligencia artificial automáticamente.",
    skip: "Saltar onboarding y volver al dashboard",
    placeholder: "Ej. Mi negocio es una peluquería canina llamada Wow Dog...",
    send: "Enviar",
    configuring: "Configurando tu negocio y redirigiendo al dashboard...",
  }
};

export const en = {
  // Sidebar
  sidebar: {
    overview: "Overview",
    manageBusinesses: "Manage Businesses",
    inbox: "Inbox (Human Handoff)",
    customers: "Customers (CRM)",
    knowledge: "Knowledge & SOPs",
    agents: "Agent Config",
    simulator: "AI Simulator (Test)",
    settings: "Settings",
    reservations: "Reservations",
    signOut: "Sign Out",
    addBusiness: "Add Business"
  },
  
  // Dashboard Overview
  overview: {
    title: "Dashboard Overview",
    subtitle: "Real-time metrics and system health for",
    noBusiness: "No business selected. Create or select a business to see metrics.",
    totalConversations: "Total Conversations",
    avgResolutionTime: "Avg. Resolution Time",
    botDeflectionRate: "Bot Deflection Rate",
    escalations: "Escalations to Human",
    recentActivity: "Recent Activity",
    aiResolved: "AI resolved booking inquiry",
    knowledgeGap: "Knowledge Gap Flagged",
    handoff: "Handoff to human requested",
    systemHealth: "System Health",
    allSystemsOperational: "All systems operational. Webhooks and Database are connected.",
  },

  // Settings
  settings: {
    title: "User & Business Settings",
    subtitle: "Manage preferences and integrations for the selected business.",
    languagePreferences: "Language Preferences",
    selectLanguage: "Select Dashboard Language",
    whatsappIntegration: "WhatsApp Integration",
    metaToken: "Meta Access Token",
    phoneId: "Phone Number ID",
    saveChanges: "Save Changes",
  },

  // Manage Businesses
  companies: {
    title: "Manage Businesses",
    subtitle: "Create and configure multiple AI agents for different tenants.",
    newBusiness: "+ AI Onboarding",
    createOneBusiness: "Create one business",
    unnamed: "Unnamed Business",
    id: "ID",
    editConfig: "Edit Config",
    delete: "Delete",
    noBusinesses: "You haven't created any businesses yet.",
    editTitle: "Edit Business Configuration",
    name: "Business Name",
    whatsappId: "WhatsApp Phone ID (Optional)",
    calendlyLink: "Calendly Link",
    persona: "Agent Persona",
    productsCatalog: "Products / Services Catalog",
    knowledgeBase: "Knowledge Base (Policies, FAQs)",
    cancel: "Cancel",
    save: "Save Configuration",
    saving: "Saving...",
    confirmDelete: "Are you sure you want to delete this business?",
  },

  // Customers (CRM)
  customers: {
    title: "Customers CRM",
    subtitle: "Long-Term Memory profiles for",
    subtitle2: "The AI automatically extracts facts from conversations to build these profiles over time.",
    noBusiness: "Please select a business to view CRM profiles.",
    loading: "Loading profiles...",
    noProfiles: "No CRM profiles found. Chat with the AI Simulator to generate memory facts!",
    lastActive: "Last active",
    extractedFacts: "Extracted Facts",
    noFacts: "No facts extracted yet.",
  },

  // AI Simulator
  simulator: {
    title: "AI Simulator",
    subtitle: "Testing",
    subtitle2: "in real-time.",
    noBusiness: "No Business Selected",
    typeMessage: "Type your message here...",
    send: "Send",
  },

  // Agent Config
  agents: {
    title: "Agent Configuration",
    subtitle: "Manage your specialized AI team and configure their personas.",
    brandPersona: "Brand Persona & Tone",
    casual: "Casual & Friendly",
    professional: "Professional & Formal",
    salesDriven: "Energetic & Sales-driven",
    currentTone: "Current tone",
    noPersona: "No persona configured.",
    routerAgent: "Router Agent",
    routerDesc: "Identifies intent and routes to correct agent.",
    salesAgent: "Sales Agent",
    salesDesc: "Recommends products and captures leads.",
    bookingAgent: "Booking Agent",
    bookingDesc: "Integrates with Calendly and Google Sheets.",
    active: "Active",
    enable: "Enable",
  },

  // Knowledge & SOPs
  knowledge: {
    title: "Knowledge & SOPs",
    subtitle: "Train the AI team for",
    subtitle2: "by providing menus, guidelines, and procedures.",
    dataSources: "Data Sources",
    sops: "SOP Action Library",
    uploaded: "Uploaded Knowledge",
    active: "Active",
    uploadPdf: "Upload PDF / Image",
    scrapeWeb: "Add Link",
    actionQueue: "Action Library Queue",
    actionQueueDesc: "When the AI doesn't know how to handle a specific request, it creates a ticket here for you to write the procedure.",
    missingSop: "Missing SOP",
    ago: "hours ago",
    writeProcedure: "Write Procedure",
    completedSop: "Completed SOP",
    noDataSources: "No data sources uploaded yet. Add a website, document, or PDF below.",
    addLinkTitle: "Add Link",
    addLinkSubtitle: "Enter Website, Google Doc, or Google Sheet URL (Must be publicly shared):",
    cancel: "Cancel",
    scan: "Scan"
  },
  
  // Onboarding
  onboarding: {
    title: "Charlo AI Setup",
    subtitle: "Tell me about your business and I will configure your AI automatically.",
    skip: "Skip onboarding and return to dashboard",
    placeholder: "e.g. My business is a dog grooming salon called Wow Dog...",
    send: "Send",
    configuring: "Configuring business and redirecting to dashboard...",
  },
  
  // Login
  login: {
    title: "Welcome Back",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    noAccount: "Don't have an account?",
    signUp: "Sign Up",
    errorInvalidCredential: "The email or password you entered is incorrect. Please try again.",
    errorGeneric: "Failed to login. Please try again.",
    providerError: "Failed to login with provider.",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset Password",
    resetInstructions: "Enter your email address and we'll send you a link to reset your password.",
    sendResetLink: "Send Link",
    cancel: "Cancel",
    resetSuccess: "Link sent! Check your inbox.",
    signingIn: "Signing in..."
  },

  // Signup
  signup: {
    title: "Create Account",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signUp: "Sign Up",
    signingUp: "Signing up...",
    alreadyAccount: "Already have an account?",
    signIn: "Sign In",
    errorPasswordMatch: "Passwords do not match.",
    errorGeneric: "Failed to create account. Please try again.",
    settingUpWorkspace: "Setting up your workspace..."
  }
};

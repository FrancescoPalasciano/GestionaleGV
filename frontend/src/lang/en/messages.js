export default {
  brand: "GESTIONALE GV",
  brandSubtitle: "The smart management software for your Tobacco & Convenience Store",
  
  // Navigation & Sidebar
  nav: {
    brandPro: "TABACCHI PRO",
    dashboard: "Dashboard",
    grattaEVinci: "Scratch & Win",
    statistiche: "Statistics",
    impostazioni: "Settings",
    tabacchi: "Tobacco & Inventory",
    servizi: "Services & Payments",
    cassa: "POS & Daily Revenue",
    profilo: "Profile",
    logout: "Log out of account",
    language: "Language",
    desktopView: "Desktop",
    resellerLabel: "Res. #",
    connectedStatus: "Online",
    offlineStatus: "Offline",
  },

  // Auth Page
  auth: {
    loginTitle: "Sign in to your Portal",
    loginSubtitle: "Everything under control, from cash register to warehouse.",
    registerTitle: "Create your account",
    registerSubtitle: "Start managing your tobacco store easily and securely.",
    emailLabel: "Business or Personal Email",
    emailPlaceholder: "e.g. john.doe@tobacconist.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Minimum 8 characters",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Repeat your password",
    nomeLabel: "First Name",
    nomePlaceholder: "e.g. John",
    cognomeLabel: "Last Name",
    cognomePlaceholder: "e.g. Doe",
    ragioneSocialeLabel: "Business / Store Name",
    ragioneSocialePlaceholder: "e.g. Central Tobacco Store",
    codiceFiscaleLabel: "Tax Identification Code",
    codiceFiscalePlaceholder: "Owner Tax Code (16 characters)",
    partitaIvaLabel: "VAT Number (Optional)",
    partitaIvaPlaceholder: "11-digit VAT ID",
    codiceRivenditaLabel: "Reseller License Code",
    codiceRivenditaPlaceholder: "e.g. RIV-1234",
    telefonoLabel: "Phone / Mobile",
    telefonoPlaceholder: "e.g. +39 340 1234567",
    indirizzoLabel: "Store Address",
    indirizzoPlaceholder: "e.g. 10 Main Street, Rome",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    loginButton: "Sign In to System",
    registerButton: "Register your Store",
    processing: "Processing...",
    noAccountPrompt: "Don't have an account yet?",
    noAccountAction: "Register now for free",
    hasAccountPrompt: "Already have an account?",
    hasAccountAction: "Sign in to your dashboard",
    securityBadge: "Secure connection with JWT encryption and protected database",
  },

  // Messages & Alerts
  messages: {
    loginSuccess: "Successfully logged in! Welcome.",
    registerSuccess: "Registration completed successfully! You can now log in.",
    emailAlreadyRegistered: "Email already registered. Use another email or log in.",
    invalidCredentials: "Incorrect email or password.",
    accountDisabled: "Account disabled. Please contact the administrator.",
    unauthorized: "You do not have permission to access this resource.",
    networkError: "Unable to reach server. Please ensure the backend is running on port 8080.",
    passwordsMismatch: "Passwords do not match.",
    passwordTooShort: "Password must be at least 8 characters long.",
    requiredFields: "Please fill in all required fields.",
    unexpectedError: "An unexpected error occurred. Please try again later.",
  },

  // Dashboard preview matching mockup
  dashboard: {
    title: "Dashboard",
    dayProgress: "day in progress",
    todayFilter: "Today",
    yesterdayFilter: "Yesterday",
    weekFilter: "This week",
    monthFilter: "This month",
    welcome: "Welcome back,",
    roleBadge: "Store Owner",
    systemStatus: "System Online (Backend 8080 connected)",
    cards: {
      soldGv: "SCRATCH CARDS SOLD",
      soldGvTrend: "↑ 12% vs yesterday",
      winningsPaid: "PRIZES PAID OUT",
      winningsOperations: "5 operations",
      purchased: "PURCHASED",
      purchasedSub: "Today's supply",
      partialProfit: "PARTIAL PROFIT",
      partialProfitTrend: "↑ 8% vs yesterday",
    },
    trendTitle: "Economic trend",
    trendSubtitle: "Current week",
    recentOperationsTitle: "Recent operations",
    winPrefix: "Prize",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },

  // Gratta e Vinci Workspace
  grattaEVinci: {
    title: "Scratch & Win",
    subtitle: "Management of active ticket packs, dispensers and lottery sales",
    activePacks: "Active Packs at POS",
    ticketsSold: "Tickets Sold Today",
    todayMargin: "Earned Commission (8%)",
    lowStock: "Low Inventory Packs",
    actions: {
      newPack: "+ Load New Pack",
      registerSale: "Log Sale",
      inventoryScan: "Barcode / Delivery Note Scan",
    },
    table: {
      packCode: "Pack Code",
      gameName: "Lottery Name",
      price: "Denomination",
      remaining: "Remaining",
      status: "Status",
      action: "Action",
    },
    statuses: {
      active: "At POS",
      low: "Low Stock",
      soldOut: "Sold Out",
    }
  },

  // Statistiche Section
  statistiche: {
    title: "Statistics & Financial Reports",
    subtitle: "Turnover monitoring, monopoly fee breakdown and sales trends",
    monthlyRevenue: "Total Monthly Revenue",
    tabacchiShare: "Tobacco Volume Share",
    lotterieShare: "Scratchcards Volume Share",
    serviziShare: "Services & Utility Bills",
  },

  // Impostazioni Section
  impostazioni: {
    title: "Store Settings",
    subtitle: "Profile configuration, tax parameters and security settings",
    storeInfo: "Store & Owner Details",
    credentials: "Credentials & Security",
    fiscalInfo: "Monopoly Fiscal Parameters",
    saveChanges: "Save Changes",
  },

  // SEO & Headings
  seo: {
    siteTitle: "Gestionale GV - Advanced Tobacco & Retail Management Software",
    metaDescription: "Gestionale GV is the cutting-edge management system for tobacconists, retail monopolies, lottery tickets, stamps and fiscal tracking.",
    keywords: "tobacco management software, retail POS, lottery tracking, excise management, store inventory",
  }
};

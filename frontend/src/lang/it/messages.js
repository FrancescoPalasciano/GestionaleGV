export default {
  brand: "GESTIONALE GV",
  brandSubtitle: "Il software per la gestione intelligente della tua Tabaccheria",
  
  // Navigation & Sidebar
  nav: {
    brandPro: "PALASCIANO",
    dashboard: "Dashboard",
    grattaEVinci: "Gratta e Vinci",
    statistiche: "Statistiche",
    impostazioni: "Impostazioni",
    tabacchi: "Tabacchi e Magazzino",
    servizi: "Servizi e Pagamenti",
    cassa: "Cassa e Corrispettivi",
    profilo: "Profilo",
    logout: "Esci dall'account",
    language: "Lingua",
    desktopView: "Desktop",
    resellerLabel: "Riv. n°",
    connectedStatus: "Online",
    offlineStatus: "Offline",
  },

  // Auth Page
  auth: {
    loginTitle: "Accedi al gestionale",
    loginSubtitle: "Tutto sotto controllo in cassa e in magazzino.",
    registerTitle: "Crea il tuo account",
    registerSubtitle: "Inizia a gestire la tua tabaccheria in modo semplice e sicuro.",
    emailLabel: "Email aziendale o personale",
    emailPlaceholder: "es. mario.rossi@tabacchi.it",
    passwordLabel: "Password",
    passwordPlaceholder: "Minimo 8 caratteri",
    confirmPasswordLabel: "Conferma Password",
    confirmPasswordPlaceholder: "Ripeti la tua password",
    nomeLabel: "Nome",
    nomePlaceholder: "es. Mario",
    cognomeLabel: "Cognome",
    cognomePlaceholder: "es. Rossi",
    ragioneSocialeLabel: "Insegna / Ragione Sociale",
    ragioneSocialePlaceholder: "es. Tabaccheria del Corso",
    codiceFiscaleLabel: "Codice Fiscale",
    codiceFiscalePlaceholder: "Codice Fiscale titolare (16 caratteri)",
    partitaIvaLabel: "Partita IVA (Opzionale)",
    partitaIvaPlaceholder: "11 cifre numeriche",
    codiceRivenditaLabel: "Codice Rivendita n.",
    codiceRivenditaPlaceholder: "es. RIV-1234",
    telefonoLabel: "Telefono / Cellulare",
    telefonoPlaceholder: "es. 340 1234567",
    indirizzoLabel: "Indirizzo",
    indirizzoPlaceholder: "es. Via Roma 10, Milano",
    rememberMe: "Rimani connesso",
    forgotPassword: "Password dimenticata?",
    loginButton: "Accedi al Sistema",
    registerButton: "Registra la tua Tabaccheria",
    processing: "Elaborazione in corso...",
    noAccountPrompt: "Non hai ancora un account?",
    noAccountAction: "Registrati ora gratuitamente",
    hasAccountPrompt: "Hai già un account attivo?",
    hasAccountAction: "Accedi alla tua area",
    securityBadge: "Connessione sicura con crittografia JWT e database protetto",
  },

  // Messages & Alerts
  messages: {
    loginSuccess: "Accesso effettuato con successo! Benvenuto.",
    registerSuccess: "Registrazione completata con successo! Ora puoi accedere.",
    emailAlreadyRegistered: "Email già registrata. Usa un'altra email o effettua il login.",
    invalidCredentials: "Email o password non corretti.",
    accountDisabled: "Account disattivato. Contatta l'amministratore.",
    unauthorized: "Non hai i permessi per accedere a questa risorsa.",
    networkError: "Impossibile contattare il server. Verifica che il backend sia attivo su porta 8080.",
    passwordsMismatch: "Le password inserite non coincidono.",
    passwordTooShort: "La password deve contenere almeno 8 caratteri.",
    requiredFields: "Compila tutti i campi obbligatori contrassegnati.",
    unexpectedError: "Si è verificato un errore imprevisto. Riprova più tardi.",
  },

  // Dashboard preview matching mockup
  dashboard: {
    title: "Dashboard",
    dayProgress: "giornata in corso",
    todayFilter: "Oggi",
    yesterdayFilter: "Ieri",
    weekFilter: "Questa settimana",
    monthFilter: "Questo mese",
    welcome: "Bentornato,",
    roleBadge: "Titolare Rivendita",
    systemStatus: "Sistema Online (Backend 8080 connesso)",
    cards: {
      soldGv: "GRATTA E VINCI VENDUTI",
      soldGvTrend: "↑ 12% vs ieri",
      winningsPaid: "VINCITE EMESSE",
      winningsOperations: "5 operazioni",
      purchased: "ACQUISTATI (SETTIMANALE)",
      purchasedSub: "Fornitura settimanale",
      partialProfit: "GUADAGNO PARZIALE",
      partialProfitTrend: "↑ 8% vs ieri",
    },
    trendTitle: "Andamento economico",
    trendSubtitle: "Settimana corrente",
    recentOperationsTitle: "Ultime operazioni",
    winPrefix: "Vincita",
    days: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
  },

  // Gratta e Vinci Workspace
  grattaEVinci: {
    title: "Gratta e Vinci",
    subtitle: "Gestione pacchi attivi, distributore e vendita tagliandi di monopolio",
    activePacks: "Pacchi Attivi in Cassa",
    ticketsSold: "Tagliandi Venduti Oggi",
    todayMargin: "Aggio Maturato (8%)",
    lowStock: "Blocchi in Esaurimento",
    actions: {
      newPack: "+ Carica Nuovo Pacco",
      registerSale: "Registra Vendita",
      inventoryScan: "Lettura Barcode / DTT",
    },
    table: {
      packCode: "Codice Pacco",
      gameName: "Nome Lotteria",
      price: "Taglio",
      remaining: "Giacenza",
      status: "Stato",
      action: "Azione",
    },
    statuses: {
      active: "In Cassa",
      low: "In Esaurimento",
      soldOut: "Esaurito",
    }
  },

  // Statistiche Section
  statistiche: {
    title: "Statistiche & Report Economici",
    subtitle: "Monitoraggio fatturato, aggi di monopolio e andamento vendite",
    monthlyRevenue: "Incasso Totale Mensile",
    tabacchiShare: "Incidenza Tabacchi",
    lotterieShare: "Incidenza Gratta & Vinci",
    serviziShare: "Servizi e Bollette",
  },

  // Impostazioni Section
  impostazioni: {
    title: "Impostazioni Rivendita",
    subtitle: "Configurazione profilo tabaccheria, parametri fiscali e sicurezza",
    storeInfo: "Dati della Tabaccheria",
    credentials: "Credenziali e Sicurezza",
    fiscalInfo: "Parametri Fiscali Monopolio",
    saveChanges: "Salva Modifiche",
  },

  // SEO & Headings
  seo: {
    siteTitle: "Gestionale GV - Software per Tabaccherie e Ricevitorie",
    metaDescription: "Gestionale GV è la soluzione all'avanguardia per la gestione completa di tabacchi, lotterie, valori bollati, aggi e corrispettivi per tabaccherie.",
    keywords: "gestionale tabaccheria, software tabacchi, aggio tabacchi, lotterie gratta e vinci, corrispettivi tabaccai, rivendita generi di monopolio",
  }
};

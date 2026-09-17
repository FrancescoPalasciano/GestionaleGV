import { useState, useEffect } from 'react'
import { dictionaries } from './lang/i18n.js'
import { api, tokenStorage } from './services/api.js'
import Sidebar from './components/Sidebar.jsx'
import GrattaEVinciView from './components/GrattaEVinciView.jsx'
import DashboardView from './components/DashboardView.jsx'
import StatisticheView from './components/StatisticheView.jsx'
import ImpostazioniView from './components/ImpostazioniView.jsx'

export default function App() {
  const [user, setUser] = useState(() => tokenStorage.getUser())
  const [mode, setMode] = useState('login') // 'login' | 'register'
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    cognome: '',
    ragioneSociale: '',
    codiceFiscale: '',
    partitaIva: '',
    codiceRivendita: '',
    telefono: '',
    indirizzo: '',
    rememberMe: true,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [backendOnline, setBackendOnline] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 900)

  // Lingua fissa in italiano
  const t = dictionaries.it

  // Update SEO Document Title
  useEffect(() => {
    document.title = t.seo.siteTitle
  }, [t])

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true
    const checkStatus = async () => {
      try {
        await api.checkHealth()
        if (isMounted) setBackendOnline(true)
      } catch {
        if (isMounted) setBackendOnline(false)
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 15000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Verifica la sessione salvata e reagisce centralmente alla scadenza del JWT.
  useEffect(() => {
    let active = true
    const refreshCurrentUser = async () => {
      if (!tokenStorage.get()) {
        tokenStorage.clear()
        if (active) setUser(null)
        return
      }
      try {
        const profile = await api.getCurrentUser()
        if (active) {
          setUser((current) => ({ ...current, ...profile }))
        }
      } catch {
        if (active) {
          tokenStorage.clear()
          setUser(null)
        }
      }
    }
    const handleExpiredSession = () => {
      setUser(null)
      setErrorMsg('La sessione è scaduta. Accedi nuovamente.')
    }
    window.addEventListener('auth:expired', handleExpiredSession)
    refreshCurrentUser()
    return () => {
      active = false
      window.removeEventListener('auth:expired', handleExpiredSession)
    }
  }, [])

  // Close mobile sidebar on Escape or window resize > 900px
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarMobileOpen) {
        setSidebarMobileOpen(false)
      }
    }
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth <= 900)
      if (window.innerWidth > 900 && sidebarMobileOpen) {
        setSidebarMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [sidebarMobileOpen])

  useEffect(() => {
    // Run after a drawer's scroll restoration so every new view starts at its heading.
    const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [activeTab])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Reset alert on typing
    if (errorMsg) setErrorMsg('')
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    // Client-side validations
    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg(t.messages.passwordsMismatch)
        return
      }
      if (formData.password.length < 8) {
        setErrorMsg(t.messages.passwordTooShort)
        return
      }
      if (!formData.nome || !formData.cognome || !formData.ragioneSociale || !formData.codiceFiscale) {
        setErrorMsg(t.messages.requiredFields)
        return
      }
    }

    setIsLoading(true)

    try {
      if (mode === 'login') {
        const res = await api.login({
          email: formData.email,
          password: formData.password,
        }, formData.rememberMe)
        setUser(res)
        setSuccessMsg(t.messages.loginSuccess)
      } else {
        // Registration payload matching TabacchinoCreateDTO
        const payload = {
          email: formData.email,
          password: formData.password,
          nome: formData.nome,
          cognome: formData.cognome,
          ragioneSociale: formData.ragioneSociale,
          codiceFiscale: formData.codiceFiscale,
          partitaIva: formData.partitaIva || null,
          codiceRivendita: formData.codiceRivendita || null,
          telefono: formData.telefono || null,
          indirizzo: formData.indirizzo || null,
        }
        await api.register(payload)
        setSuccessMsg(t.messages.registerSuccess)
        setMode('login')
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }))
      }
    } catch (err) {
      if (err.isNetworkError) {
        setErrorMsg(t.messages.networkError)
      } else if (err.data && err.data.message) {
        // If error message is from server (e.g. "Email già registrata")
        setErrorMsg(err.data.message)
      } else if (err.status === 409) {
        setErrorMsg(t.messages.emailAlreadyRegistered)
      } else if (err.status === 401) {
        setErrorMsg(t.messages.invalidCredentials)
      } else {
        setErrorMsg(err.message || t.messages.unexpectedError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    api.logout()
    setUser(null)
    setSuccessMsg('')
    setErrorMsg('')
  }

  // Render Authenticated Shell (NO top navbar, sidebar on left matching mockup)
  if (user) {
    const tabLabels = {
      dashboard: t.nav.dashboard,
      grattaEVinci: t.nav.grattaEVinci,
      statistiche: t.nav.statistiche,
      impostazioni: t.nav.impostazioni,
    }

    return (
      <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          onLogout={handleLogout}
          t={t}
          backendOnline={backendOnline}
          isOpen={sidebarMobileOpen}
          onClose={() => setSidebarMobileOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="app-main-layout" inert={sidebarMobileOpen ? true : undefined}>
          {/* Top Breadcrumb Bar matching mockup */}
          <header className="desktop-breadcrumb-bar">
            <div className="breadcrumb-left">
              {(sidebarCollapsed || !sidebarMobileOpen) && (
                <button
                  type="button"
                  className={`sidebar-toggle-btn ${!sidebarCollapsed ? 'mobile-only' : ''}`}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
                      setSidebarMobileOpen(!sidebarMobileOpen)
                    } else {
                      setSidebarCollapsed(!sidebarCollapsed)
                    }
                  }}
                  title="Menu di navigazione"
                  aria-label="Menu di navigazione"
                  aria-controls="app-navigation"
                  aria-expanded={isMobileViewport ? sidebarMobileOpen : !sidebarCollapsed}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                </button>
              )}

              <div className="breadcrumb-text">
                <span className="breadcrumb-category">{tabLabels[activeTab] || 'Dashboard'}</span>
                <span className="breadcrumb-slash">/</span>
                <span className="breadcrumb-view">Panoramica attività</span>
              </div>
            </div>

            <div className="breadcrumb-right">
              <span className="header-store-name">{user.ragioneSociale}</span>
              <div 
                className="header-status-badge"
                title={backendOnline ? t.nav.connectedStatus : t.nav.offlineStatus}
              >
                <span 
                  className="header-status-dot" 
                  style={{ backgroundColor: backendOnline ? '#0F6B4F' : '#d9383a' }} 
                />
                <span className="header-status-text">
                  {backendOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </header>

          {/* Active Tab View */}
          <main className="dashboard-content-area" role="main">
            {activeTab === 'grattaEVinci' && (
              <GrattaEVinciView t={t} user={user} />
            )}
            {activeTab === 'dashboard' && (
              <DashboardView
                t={t}
                user={user}
                onNavigateToGv={() => setActiveTab('grattaEVinci')}
              />
            )}
            {activeTab === 'statistiche' && (
              <StatisticheView t={t} user={user} />
            )}
            {activeTab === 'impostazioni' && (
              <ImpostazioniView t={t} user={user} />
            )}
          </main>
        </div>
      </div>
    )
  }

  // Unauthenticated layout (with top navbar & login/register card)
  return (
    <div className="app-container">
      {/* Top Header shown ONLY when not logged in */}
      <header className="top-header" role="banner">
        <div className="brand-badge" onClick={() => setMode('login')}>
          <div className="brand-icon">P</div>
          <div className="brand-text">
            <span className="brand-title">PALASCIANO</span>
            <span className="brand-sub">{t.brandSubtitle}</span>
          </div>
        </div>

        <div className="header-controls">
          <div className={`backend-indicator ${backendOnline ? '' : 'is-offline'}`} title="Stato del servizio">
            <span className="indicator-dot" style={{ backgroundColor: backendOnline ? '#0F6B4F' : '#d9383a' }}></span>
            <span>{backendOnline ? 'Servizio disponibile' : 'Servizio non raggiungibile'}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-wrapper">
        <section className="auth-wrapper" aria-label={mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}>
            <div className="auth-card">
              <div className="auth-header">
                <h1>{mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}</h1>
                <p>{mode === 'login' ? t.auth.loginSubtitle : t.auth.registerSubtitle}</p>
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="alert alert-error" role="alert">
                  <span className="alert-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success" role="alert">
                  <span className="alert-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  <span>{successMsg}</span>
                </div>
              )}

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                {mode === 'register' && (
                  <>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label htmlFor="reg-nome">
                          {t.auth.nomeLabel} <span className="req-star">*</span>
                        </label>
                        <input
                          id="reg-nome"
                          name="nome"
                          type="text"
                          required
                          className="form-input"
                          placeholder={t.auth.nomePlaceholder}
                          value={formData.nome}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="reg-cognome">
                          {t.auth.cognomeLabel} <span className="req-star">*</span>
                        </label>
                        <input
                          id="reg-cognome"
                          name="cognome"
                          type="text"
                          required
                          className="form-input"
                          placeholder={t.auth.cognomePlaceholder}
                          value={formData.cognome}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="reg-ragione">
                        {t.auth.ragioneSocialeLabel} <span className="req-star">*</span>
                      </label>
                      <input
                        id="reg-ragione"
                        name="ragioneSociale"
                        type="text"
                        required
                        className="form-input"
                        placeholder={t.auth.ragioneSocialePlaceholder}
                        value={formData.ragioneSociale}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field">
                        <label htmlFor="reg-cf">
                          {t.auth.codiceFiscaleLabel} <span className="req-star">*</span>
                        </label>
                        <input
                          id="reg-cf"
                          name="codiceFiscale"
                          type="text"
                          required
                          maxLength={16}
                          className="form-input"
                          placeholder={t.auth.codiceFiscalePlaceholder}
                          value={formData.codiceFiscale}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="reg-piva">{t.auth.partitaIvaLabel}</label>
                        <input
                          id="reg-piva"
                          name="partitaIva"
                          type="text"
                          maxLength={11}
                          className="form-input"
                          placeholder={t.auth.partitaIvaPlaceholder}
                          value={formData.partitaIva}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field">
                        <label htmlFor="reg-rivendita">{t.auth.codiceRivenditaLabel}</label>
                        <input
                          id="reg-rivendita"
                          name="codiceRivendita"
                          type="text"
                          className="form-input"
                          placeholder={t.auth.codiceRivenditaPlaceholder}
                          value={formData.codiceRivendita}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="reg-tel">{t.auth.telefonoLabel}</label>
                        <input
                          id="reg-tel"
                          name="telefono"
                          type="tel"
                          className="form-input"
                          placeholder={t.auth.telefonoPlaceholder}
                          value={formData.telefono}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="reg-indirizzo">{t.auth.indirizzoLabel}</label>
                      <input
                        id="reg-indirizzo"
                        name="indirizzo"
                        type="text"
                        className="form-input"
                        placeholder={t.auth.indirizzoPlaceholder}
                        value={formData.indirizzo}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}

                {/* Email Field */}
                <div className="form-field">
                  <label htmlFor="auth-email">
                    {t.auth.emailLabel} <span className="req-star">*</span>
                  </label>
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="form-input"
                    placeholder={t.auth.emailPlaceholder}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Password Field */}
                <div className="form-field">
                  <label htmlFor="auth-password">
                    {t.auth.passwordLabel} <span className="req-star">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="form-input"
                      placeholder={t.auth.passwordPlaceholder}
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Mostra o nascondi password"
                    >
                      {showPassword ? 'Nascondi' : 'Mostra'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Register mode only) */}
                {mode === 'register' && (
                  <div className="form-field">
                    <label htmlFor="auth-confirm-password">
                      {t.auth.confirmPasswordLabel} <span className="req-star">*</span>
                    </label>
                    <input
                      id="auth-confirm-password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="form-input"
                      placeholder={t.auth.confirmPasswordPlaceholder}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                {/* Options row */}
                {mode === 'login' && (
                  <div className="form-options form-options-single">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                      />
                      <span>{t.auth.rememberMe}</span>
                    </label>
                  </div>
                )}

                {/* Submit button */}
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? t.auth.processing : (mode === 'login' ? t.auth.loginButton : t.auth.registerButton)}
                </button>
              </form>

              {/* Mode switch prompt */}
              <div className="auth-footer">
                <span>
                  {mode === 'login' ? t.auth.noAccountPrompt : t.auth.hasAccountPrompt}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login')
                    setErrorMsg('')
                    setSuccessMsg('')
                  }}
                >
                  {mode === 'login' ? t.auth.noAccountAction : t.auth.hasAccountAction}
                </button>
              </div>

              {/* Security badge */}
              <div className="security-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>{t.auth.securityBadge}</span>
              </div>
            </div>
          </section>
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <p>© {new Date().getFullYear()} Gestionale GV — Soluzioni Software per Tabaccherie & Monopoli. Tutti i diritti riservati.</p>
      </footer>
    </div>
  )
}

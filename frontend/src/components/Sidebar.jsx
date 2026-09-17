import React, { useRef } from 'react'
import useOverlayFocus from '../hooks/useOverlayFocus.js'

export function IconDashboard({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function IconGrattaEVinci({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  )
}

export function IconStatistiche({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v16h16M9 15v-4M14 15V7M19 15v-6" />
    </svg>
  )
}

export function IconImpostazioni({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function IconLogout({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function Sidebar({
  activeTab,
  onTabChange,
  user,
  onLogout,
  t,
  backendOnline,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse
}) {
  const sidebarRef = useRef(null)
  useOverlayFocus(sidebarRef, isOpen, onClose)
  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: IconDashboard },
    { id: 'grattaEVinci', label: t.nav.grattaEVinci, icon: IconGrattaEVinci },
    { id: 'statistiche', label: t.nav.statistiche, icon: IconStatistiche },
    { id: 'impostazioni', label: t.nav.impostazioni, icon: IconImpostazioni },
  ]

  // User initials
  const initials = user
    ? (user.ragioneSociale
        ? user.ragioneSociale.substring(0, 2).toUpperCase()
        : `${(user.nome || 'T')[0]}${(user.cognome || 'P')[0]}`.toUpperCase())
    : 'TP'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside 
        ref={sidebarRef}
        id="app-navigation"
        className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`} 
        aria-label={t.nav.brandPro}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? true : undefined}
      >
        {/* Brand Header from Mockup with hide button */}
        <div className="sidebar-brand-container">
          <div className="sidebar-brand-lockup">
            <span className="sidebar-brand-mark" aria-hidden="true">p<span /></span>
            <div><h2 className="sidebar-brand-title">{t.nav.brandPro}</h2><span className="sidebar-brand-subtitle">Il tuo gestionale, ogni giorno.</span></div>
          </div>
          <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Chiudi menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M6 18 18 6" /></svg>
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title="Nascondi barra laterale"
              aria-label="Nascondi barra laterale"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <path d="m14 9-3 3 3 3" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav" aria-label="Navigazione principale">
          <span className="sidebar-section-label">WORKSPACE</span>
          <ul className="sidebar-menu">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <li key={item.id} className="sidebar-menu-item">
                  <button
                    type="button"
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onTabChange(item.id)
                      if (onClose) onClose()
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="sidebar-icon-wrap">
                      <Icon className="sidebar-icon" />
                    </span>
                    <span className="sidebar-label">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar Footer: Dettagli che fanno la differenza */}
        <div className="sidebar-footer">
          {/* User Profile Card */}
          {user && (
            <div className="sidebar-user-card" title={`${user.nome || ''} ${user.cognome || ''}`}>
              <div className="sidebar-avatar">{initials}</div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">
                  {user.ragioneSociale || `${user.nome || ''} ${user.cognome || ''}`}
                </span>
                <span className="sidebar-user-sub">
                  {user.codiceRivendita
                    ? `${t.nav.resellerLabel} ${user.codiceRivendita}`
                    : user.email}
                </span>
              </div>
              <div 
                className="sidebar-status-dot" 
                title={backendOnline ? t.nav.connectedStatus : t.nav.offlineStatus}
                style={{ backgroundColor: backendOnline ? '#0F6B4F' : '#d9383a' }}
              />
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={onLogout}
            title={t.nav.logout}
            aria-label={t.nav.logout}
          >
            <IconLogout className="logout-icon" />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

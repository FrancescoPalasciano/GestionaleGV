import React from 'react'

function ProfileField({ label, value, isCode = false, wide = false }) {
  return (
    <div className={`settings-field-group ${wide ? 'is-wide' : ''}`}>
      <dt className="settings-field-label">{label}</dt>
      <dd className={`settings-field-value ${isCode ? 'is-code' : ''} ${!value ? 'is-empty' : ''}`}>
        {value || 'Non inserito'}
      </dd>
    </div>
  )
}

export default function ImpostazioniView({ t, user }) {
  const holderName = [user?.nome, user?.cognome].filter(Boolean).join(' ')

  return (
    <div className="tab-view-container">
      <div className="view-header profile-view-header">
        <div className="view-header-text">
          <span className="profile-eyebrow">ACCOUNT E RIVENDITA</span>
          <h1>{t.impostazioni.title}</h1>
          <p>{t.impostazioni.subtitle}</p>
        </div>
        <div className="profile-status-pill" aria-label="Profilo attivo">
          <span className="profile-status-dot" /> Profilo attivo
        </div>
      </div>

      <section className="panel-card profile-card" aria-labelledby="store-profile-title">
        <div className="panel-card-header profile-card-header">
          <div>
            <h2 className="panel-card-title" id="store-profile-title">{t.impostazioni.storeInfo}</h2>
            <p>I dati mostrati sono quelli associati all’account autenticato.</p>
          </div>
          <div className="profile-avatar-large" aria-hidden="true">
            {(user?.ragioneSociale || holderName || 'GV').slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="settings-panel-body">
          <dl className="settings-info-grid">
            <ProfileField label="Ragione sociale / insegna" value={user?.ragioneSociale} />
            <ProfileField label="Codice rivendita Monopolio" value={user?.codiceRivendita} isCode />
            <ProfileField label="Titolare" value={holderName} />
            <ProfileField label="Email account" value={user?.email} />
            <ProfileField label="Codice fiscale" value={user?.codiceFiscale} isCode />
            <ProfileField label="Partita IVA" value={user?.partitaIva} isCode />
            <ProfileField label="Telefono" value={user?.telefono} />
            <ProfileField label="Indirizzo" value={user?.indirizzo} wide />
          </dl>
        </div>
      </section>

      <div className="profile-note" role="note">
        <span className="profile-note-icon" aria-hidden="true">i</span>
        <p>Per ragioni di sicurezza, le modifiche ai dati identificativi saranno disponibili in un flusso verificato dedicato.</p>
      </div>
    </div>
  )
}

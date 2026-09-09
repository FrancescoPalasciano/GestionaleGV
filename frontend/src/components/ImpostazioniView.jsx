import React from 'react'

export default function ImpostazioniView({ t, user }) {
  return (
    <div className="tab-view-container">
      <div className="view-header">
        <div className="view-header-text">
          <h1>{t.impostazioni.title}</h1>
          <p>{t.impostazioni.subtitle}</p>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <h2 className="panel-card-title">{t.impostazioni.storeInfo}</h2>
        </div>
        <div className="settings-panel-body">
          <div className="settings-info-grid">
            <div className="settings-field-group">
              <label className="settings-field-label">
                RAGIONE SOCIALE / INSEGNA
              </label>
              <div className="settings-field-value">
                {user?.ragioneSociale || 'Tabaccheria e Ricevitoria'}
              </div>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">
                CODICE RIVENDITA MONOPOLIO
              </label>
              <div className="settings-field-value">
                {user?.codiceRivendita ? `RIV-${user.codiceRivendita}` : 'RIV-1234'}
              </div>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">
                TITOLARE
              </label>
              <div className="settings-field-value">
                {user?.nome} {user?.cognome}
              </div>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">
                EMAIL ACCOUNT
              </label>
              <div className="settings-field-value">
                {user?.email}
              </div>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">
                CODICE FISCALE
              </label>
              <div className="settings-field-value is-code">
                {user?.codiceFiscale || 'Non specificato'}
              </div>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">
                PARTITA IVA
              </label>
              <div className="settings-field-value is-code">
                {user?.partitaIva || 'Non inserita'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

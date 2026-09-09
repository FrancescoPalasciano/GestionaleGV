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
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#66756d', marginBottom: '6px' }}>
                RAGIONE SOCIALE / INSEGNA
              </label>
              <div style={{ padding: '10px 14px', background: '#f6f9f7', border: '1px solid #dce4de', borderRadius: '8px', fontWeight: 600 }}>
                {user?.ragioneSociale || 'Tabaccheria e Ricevitoria'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#66756d', marginBottom: '6px' }}>
                CODICE RIVENDITA MONOPOLIO
              </label>
              <div style={{ padding: '10px 14px', background: '#f6f9f7', border: '1px solid #dce4de', borderRadius: '8px', fontWeight: 600 }}>
                {user?.codiceRivendita ? `RIV-${user.codiceRivendita}` : 'RIV-1234'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#66756d', marginBottom: '6px' }}>
                TITOLARE
              </label>
              <div style={{ padding: '10px 14px', background: '#f6f9f7', border: '1px solid #dce4de', borderRadius: '8px', fontWeight: 600 }}>
                {user?.nome} {user?.cognome}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#66756d', marginBottom: '6px' }}>
                EMAIL ACCOUNT
              </label>
              <div style={{ padding: '10px 14px', background: '#f6f9f7', border: '1px solid #dce4de', borderRadius: '8px', fontWeight: 600 }}>
                {user?.email}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#66756d', marginBottom: '6px' }}>
                CODICE FISCALE
              </label>
              <div style={{ padding: '10px 14px', background: '#f6f9f7', border: '1px solid #dce4de', borderRadius: '8px', fontWeight: 600, fontFamily: 'monospace' }}>
                {user?.codiceFiscale || 'Non specificato'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#66756d', marginBottom: '6px' }}>
                PARTITA IVA
              </label>
              <div style={{ padding: '10px 14px', background: '#f6f9f7', border: '1px solid #dce4de', borderRadius: '8px', fontWeight: 600, fontFamily: 'monospace' }}>
                {user?.partitaIva || 'Non inserita'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

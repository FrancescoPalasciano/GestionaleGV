import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export default function App() {
  const [apiState, setApiState] = useState('Verifica della connessione API...')

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/health`)
      .then((response) => {
        if (!response.ok) throw new Error('Risposta non valida')
        return response.json()
      })
      .then((data) => setApiState(`API connessa: ${data.status}`))
      .catch(() => setApiState('API non raggiungibile'))
  }, [])

  return (
    <main>
      <section>
        <p className="eyebrow">Gestionale GV</p>
        <h1>Base React + Spring Boot pronta.</h1>
        <p>Il frontend gira con Vite e comunica con le API REST di Spring Boot.</p>
        <p className="status">{apiState}</p>
      </section>
    </main>
  )
}

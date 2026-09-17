# Gestionale GV — ambiente Docker di sviluppo

Questa configurazione avvia due container Linux separati:

- `frontend`: React/Vite su `http://localhost:3000`
- `backend`: Spring Boot REST su `http://localhost:8080`

Il database non viene eseguito localmente: il backend usa PostgreSQL ospitato su Supabase.

## Primo avvio

1. Copia `.env.example` in `.env` e completa i parametri di connessione di Supabase.
2. Avvia l'ambiente:

   ```powershell
   docker compose up --build
   ```

3. Per fermarlo, premi `Ctrl+C`; per rimuovere i container esegui `docker compose down`.

Le modifiche a frontend e backend vengono montate nei container; Vite e Spring Boot le rilevano normalmente durante lo sviluppo. Le dipendenze npm e Maven restano in volumi Docker, senza sporcare il progetto locale.

## Dipendenze backend

Nel progetto Spring Boot includi almeno `spring-boot-starter-web`, `spring-boot-starter-data-jpa` e il driver `org.postgresql:postgresql`. Le proprietà `SPRING_DATASOURCE_*` vengono fornite automaticamente dal compose.

Per un collegamento più stabile a Supabase usa esattamente la URL JDBC indicata in **Connect** nella dashboard. Mantieni `sslmode=require` e non caricare mai il file `.env` nel repository.

## Verifica dell'interfaccia

I test Playwright avviano un frontend isolato sulla porta 4174 e usano risposte API simulate: non modificano il database. Verificano le quattro viste da 320 a 1920 px, grafici, menu, finestre di dialogo, touch, tastiera e schermate di accesso.

```powershell
cd frontend
npm install
npx playwright install chromium
npm run test:ui
npm run build
```

Per usare Chrome già installato: `$env:PLAYWRIGHT_CHANNEL = 'chrome'` prima dei test. Le schermate di verifica vengono salvate in `frontend/test-results/`.

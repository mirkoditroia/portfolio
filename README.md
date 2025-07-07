"# portfolio" 
"# portfolio" 

## Backend Server (Node/Express)

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure env**
   Copy the sample below into a new `.env` file and adjust as needed.
   ```env
   PORT=3000
   ADMIN_TOKEN=MY_SECRET_TOKEN
   ```
3. **Run in dev mode (auto-reload)**
   ```bash
   npm run dev
   ```
   or build/prod mode
   ```bash
   npm start
   ```

The server serves:
- `public/` at root (your current portfolio site)
- `admin/` at `/admin` (dashboard to be implemented)
- API endpoints at `/api/galleries`  
  • `GET /api/galleries` – returns JSON of all galleries  
  • `POST /api/galleries?token=YOUR_TOKEN` – overwrite galleries JSON (requires token) 

---

## Setup rapido (Windows, macOS, Linux)

### 1. Prerequisiti
* **Node.js** v14 o superiore. Se `node -v` non restituisce una versione, scarica l’installer LTS da <https://nodejs.org> e assicurati di spuntare «Add to PATH» durante il setup.
* **Git** (opzionale, solo se vuoi clonare il repo anziché scaricarlo).

### 2. Installazione dipendenze
```powershell
cd C:\portfolio   # o il percorso in cui hai clonato/estratto il progetto
npm install        # installa express, cors, dotenv, nodemon...
```

### 3. Variabili d’ambiente
Crea un file `.env` nella root (stesso livello di `package.json`).
```env
# Porta su cui gira il server (di default 3000)
PORT=3000

# Token di accesso per le operazioni di amministrazione
ADMIN_TOKEN=MY_SECRET_TOKEN
```

### 4. Avvio del server
* **Dev mode** (riavvia automatico con *nodemon*):
  ```powershell
  npm run dev
  ```
* **Produzione** (niente auto-reload):
  ```powershell
  npm start
  ```

Apri il browser su <http://localhost:3000> per vedere il portfolio.

---

## Struttura del progetto
```
portfolio/
  ├─ admin/          # (in arrivo) dashboard HTML/CSS/JS per modificare le gallery
  ├─ data/
  │    └─ galleries.json   # sorgente dati usata dal frontend e salvata dal backend
  ├─ css/ , images/ , video/ , assets/...   # file del sito pubblico
  ├─ server.js      # Express backend
  ├─ package.json   # dipendenze + script npm
  └─ .env           # variabili d’ambiente (NON versionato)
```

---

## API
| Metodo | Endpoint | Descrizione | Parametri |
|--------|----------|-------------|-----------|
| GET    | `/api/galleries` | Restituisce l’intero oggetto JSON con le gallery. | – |
| POST   | `/api/galleries?token=YOUR_TOKEN` | Sovrascrive `data/galleries.json` con il body inviato (JSON). | **token** (query-param) deve combaciare con `ADMIN_TOKEN` |

Esempio di richiesta POST (PowerShell / *curl*):
```powershell
curl -X POST "http://localhost:3000/api/galleries?token=MY_SECRET_TOKEN" `
     -H "Content-Type: application/json" `
     -d @data/galleries.json
```

---

## Dashboard di amministrazione (work in progress)
La UI verrà servita all’URL <http://localhost:3000/admin> e permetterà di:
1. Visualizzare le gallery esistenti.
2. Aggiungere / modificare / eliminare slide.
3. Salvare le modifiche (chiama la POST di cui sopra).

Fino al completamento della dashboard puoi modificare `data/galleries.json` a mano e salvare; il backend e il frontend si aggiorneranno al reload.

---

## Note comuni
* **Errore “Cannot GET /”** → significa che Express non trova `index.html`. Assicurati che il percorso in `server.js` coincida con la tua struttura (di default usa la root del progetto).
* **Porta già in uso** → cambia `PORT=` nel `.env`.
* **Modifica live** → con `npm run dev` ogni salvataggio riavvia automaticamente il server.
* **Sicurezza** → la protezione via token in query-string è sufficiente per demo o ambienti interni, non per produzione. 

---

## Deployment e guida completa

### Ambiente di produzione (Linux/Windows)
1. **Clona il repo**
   ```bash
   git clone https://github.com/tuo-utente/portfolio.git
   cd portfolio
   ```
2. **Installa Node** (>=14) e dipendenze:
   ```bash
   npm install --production
   ```
3. **Configura variabili**
   ```env
   # .env
   PORT=80           # o altra porta se su PaaS come Heroku / Render
   ADMIN_TOKEN=CAMBIA_QUESTO_TOKEN
   ```
4. **Avvia in background** (PM2, systemd o semplice nohup):
   ```bash
   npm start &    # oppure pm2 start server.js --name portfolio
   ```
5. **Punta il DNS / reverse-proxy** (Nginx, Caddy, Apache) al tuo server.

### Hosting statico + API separata
Se preferisci servire il sito da Netlify/Vercel e tenere l’API altrove:
1. Sposta `index.html`, `css/`, `images/`, `video/`, `assets/`, `script.js` in una cartella `public/` (o come build output).  
2. Configura il backend Node solo per `/api/*` e `/admin/*` (vedi `PUBLIC_DIR` in `server.js`).  Vercel o Netlify sarà il frontend, il backend potrà stare su Render/Heroku/Fly.
3. Assicurati che il frontend punti al dominio API (es. `fetch('https://api.tuodominio.com/api/galleries')`).

### Backup dati
I JSON `data/galleries.json` e `data/site.json` **non** vengono versionati in automatico. Per non perdere modifiche puoi:
1. Impostare backup giornaliero della cartella `data/` (cron + tar/scp o un volume cloud).  
2. O creare uno script git-commit automatizzato:
   ```bash
   git add data/*.json && git commit -m "backup data $(date +%F_%T)" && git push origin main
   ```

### Admin Dashboard – flusso completo
1. Vai su `https://tuodominio.com/admin` (o `http://localhost:3000/admin`).
2. Inserisci/edita:
   • **Bio & Contatti** – textarea + liste dinamiche
   • **Sezioni** – mostra/nasconde, rinomina label
   • **Gallery** – aggiungi/ordina/modifica slide, upload immagini/video (token richiesto)
3. Premi “Salva dettagli” (site) o “Salva gallery”. Ti verrà chiesto il **token**.  
4. Refresh del sito pubblico per vedere i cambiamenti.

### Sicurezza
Il token in query-string è un layer minimo. Per ambienti pubblici:
1. Abilita **HTTPS** ovunque.  
2. Usa un header `Authorization: Bearer <token>` o autentica via cookie sessione.  
3. Rate-limit endpoints upload e POST.

### Roadmap futura
- Autenticazione JWT o OAuth
- Drag & drop per riordinare slide
- Mini-anteprime nel modal editor
- Integrazione CDN per media

--- 

# Firebase Storage CORS Configuration

## Problema
Il dominio personalizzato `meirks.xyz` non può accedere ai contenuti di Firebase Storage a causa di errori CORS.

## Soluzione

### 1. Installa Google Cloud SDK
```bash
# Windows (usando Chocolatey)
choco install gcloudsdk

# Oppure scarica da: https://cloud.google.com/sdk/docs/install
```

### 2. Configura l'autenticazione
```bash
gcloud auth login
gcloud config set project portfolio-eb526
```

### 3. Applica la configurazione CORS
```bash
gsutil cors set storage-cors.json gs://portfolio-eb526.appspot.com
```

### 4. Verifica la configurazione
```bash
gsutil cors get gs://portfolio-eb526.appspot.com
```

## Configurazione CORS Applicata

Il file `storage-cors.json` contiene:
- **Origini autorizzate**: meirks.xyz, www.meirks.xyz, portfolio-eb526.web.app
- **Metodi**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, Content-Range, Accept-Ranges
- **Cache**: 3600 secondi

## Alternative (se gsutil non è disponibile)

### Opzione 1: Firebase Console
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il progetto `portfolio-eb526`
3. Vai su Storage > Rules
4. Aggiungi le regole CORS manualmente

### Opzione 2: Google Cloud Console
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il progetto `portfolio-eb526`
3. Vai su Cloud Storage > Browser
4. Clicca sui tre punti del bucket > Edit CORS
5. Incolla il contenuto di `storage-cors.json`

## Test
Dopo aver applicato la configurazione:
1. Vai su https://meirks.xyz
2. Apri la console del browser (F12)
3. Verifica che non ci siano più errori CORS
4. I video e le immagini dovrebbero caricarsi correttamente

## Note
- La configurazione CORS può richiedere alcuni minuti per propagarsi
- Se il problema persiste, prova a svuotare la cache del browser
- Assicurati che il dominio personalizzato sia correttamente configurato in Firebase Hosting

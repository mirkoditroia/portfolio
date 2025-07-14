# Setup Firebase Storage per Upload Diretto

## 1. Configura Firebase Storage

### Nel Firebase Console:
1. Vai su **Storage** nel menu laterale
2. Clicca **Get started**
3. Scegli **Start in test mode** (o production mode se preferisci)
4. Seleziona la location (es. europe-west1)

### Regole di Sicurezza (Storage Rules):
```javascript
// Regole per sviluppo (permissive)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}

// Regole per produzione (più sicure)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{imageId} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024 // 10MB max
                  && request.resource.contentType.matches('image/.*');
    }
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.resource.size < 100 * 1024 * 1024 // 100MB max
                  && request.resource.contentType.matches('video/.*');
    }
  }
}
```

### Configurazione CORS per Firebase Storage:

**IMPORTANTE**: Firebase Storage ha regole CORS predefinite che possono bloccare i domini. Per risolvere:

1. **Installa Google Cloud SDK**:
   ```bash
   # Windows
   https://cloud.google.com/sdk/docs/install
   
   # Mac
   brew install google-cloud-sdk
   
   # Linux
   curl https://sdk.cloud.google.com | bash
   ```

2. **Configura CORS**:
   ```bash
   # Login
   gcloud auth login
   
   # Set project
   gcloud config set project portfolio-eb526
   
   # Create cors.json file
   echo '[
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type", "Authorization"]
     }
   ]' > cors.json
   
   # Apply CORS
   gsutil cors set cors.json gs://portfolio‑eb526.firebasestorage.app
   ```

3. **Verifica CORS**:
   ```bash
   gsutil cors get gs://portfolio‑eb526.firebasestorage.app
   ```

### Alternative Senza Google Cloud SDK:

Se non puoi installare Google Cloud SDK, usa queste regole di sicurezza più permissive:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

E aggiungi questi header nella tua app:

```javascript
// In js/firebase.js, aggiungi dopo l'inizializzazione
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
```

## 2. Aggiorna la Configurazione Firebase

Nel file `js/firebase.js`, assicurati che `storageBucket` sia corretto:

```javascript
const firebaseConfig = {
  apiKey: "TUA_API_KEY",
  authDomain: "TUO_PROJECT.firebaseapp.com",
  projectId: "TUO_PROJECT",
  storageBucket: "TUO_PROJECT.appspot.com", // ← Importante!
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 3. Come Funziona l'Upload

### Nell'Admin Panel:
1. **Upload Veloce**: Bottone verde per caricare più file contemporaneamente
2. **Upload Singolo**: Bottoni "Upload" nei campi del form
3. **Progresso**: Barra di progresso in alto a destra

### Struttura dei File:
```
/images/
  ├── 1704123456789_abc123def.jpg
  ├── 1704123456790_xyz789ghi.png
  └── ...

/videos/
  ├── 1704123456791_vid123abc.mp4
  ├── 1704123456792_mov456def.mov
  └── ...
```

### Nomi File Generati:
- Formato: `{timestamp}_{random}.{extension}`
- Esempio: `1704123456789_abc123def.jpg`
- Evita conflitti e organizza cronologicamente

## 4. Funzionalità Disponibili

### ✅ Funziona in Produzione:
- Upload diretto a Firebase Storage
- Supporto immagini e video
- Upload multipli
- Indicatore di progresso
- Organizzazione automatica in cartelle

### ❌ Solo in Local/Pre-prod:
- Upload tramite Express server
- Richiede token amministratore

## 5. Limitazioni Firebase (Piano Gratuito)

### Storage:
- **5GB** di spazio totale
- **1GB/giorno** di download
- **20.000/giorno** operazioni

### Suggerimenti:
- Ottimizza immagini prima dell'upload
- Usa formati efficienti (WebP, AVIF)
- Comprimi video quando possibile
- Monitora l'uso nella console Firebase

## 6. Troubleshooting

### Errore "Storage bucket not configured":
```javascript
// Verifica che storageBucket sia impostato correttamente
storageBucket: "portfolio-d5e8e.appspot.com"
```

### Errore "Permission denied":
- Controlla le Storage Rules
- Verifica che le regole permettano write

### Upload lento:
- Comprimi file prima dell'upload
- Verifica la connessione internet
- Controlla le dimensioni dei file

### File non visibili:
- Controlla che i URL siano salvati correttamente in Firestore
- Verifica le regole di lettura in Storage

## 7. Esempio di Uso

1. Vai su `/admin/`
2. Apri una galleria
3. Clicca "📁 Upload Veloce"
4. Seleziona più file
5. Attendi il completamento
6. Clicca "Salva gallery"

I file vengono caricati su Firebase Storage e gli URL salvati in Firestore automaticamente.

## 8. Regole di Sicurezza Firestore (con Autenticazione)

### Per un admin autenticato:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to everyone for galleries and config
    match /galleries/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /config/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Test collection for connection tests
    match /test/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Per Setup Iniziale (permissivo):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 9. Setup Utente Admin

1. **Vai su Firebase Console → Authentication**
2. **Abilita "Email/Password" provider**
3. **Aggiungi un utente admin**:
   - Email: `admin@tuodominio.com`
   - Password: `password_sicura`
4. **Testa il login** nell'admin panel 

✅  Configurazione Firebase di produzione applicata localmente:

1. Creato file `.env` (ignorato da Git) con le tue chiavi.
2. Eseguito `npm run postinstall` → generato `config/env.local.js` contenente  
   ```
   window.APP_ENV = "prod";
   window.FIREBASE_CONFIG = { ... }
   ```

Il file è già pronto per il deploy ed è escluso dal repository, quindi le chiavi non verranno mai pushate.

Ora puoi testare in locale (`npm start`) e, quando vuoi:

```
firebase deploy --only hosting
```

Il predeploy rigenererà l’`env.local.js` usando le stesse variabili ambiente e caricherà l’app su Firebase Hosting in modalità PROD.

Fammi sapere se va tutto liscio! 
# 🔍 Come Trovare l'Opzione CORS - Guida Completa

## 🎯 Problema
Non riesci a trovare l'opzione "Edit CORS" nell'interfaccia. Ecco tutte le possibili ubicazioni:

## 🔧 OPZIONE 1 - Google Cloud Console (Più Probabile)

### **Passo 1: Accedi a Google Cloud Console**
1. Vai su: **https://console.cloud.google.com/**
2. **IMPORTANTE:** Assicurati di aver selezionato il progetto **portfolio-eb526** (in alto a sinistra)

### **Passo 2: Vai a Cloud Storage**
1. Nel menu laterale sinistro, clicca su **Cloud Storage**
2. Clicca su **Browser** (se non sei già lì)

### **Passo 3: Trova il Bucket**
1. Dovresti vedere il bucket: **portfolio-eb526.appspot.com**
2. **Clicca sul nome del bucket** (non sui tre punti)

### **Passo 4: Cerca CORS nelle Impostazioni**
Una volta dentro il bucket, cerca:
- **"Permissions"** o **"Permessi"**
- **"Security"** o **"Sicurezza"** 
- **"Settings"** o **"Impostazioni"**
- **"Configuration"** o **"Configurazione"**
- **"CORS"** direttamente

### **Passo 5: Alternative se non trovi CORS**
Se non trovi CORS, prova:
1. **Clicca sui tre punti** in alto a destra del bucket
2. Cerca **"Edit bucket"** o **"Modifica bucket"**
3. Cerca **"Bucket settings"** o **"Impostazioni bucket"**

## 🔧 OPZIONE 2 - Firebase Console

### **Passo 1: Accedi a Firebase Console**
1. Vai su: **https://console.firebase.google.com/project/portfolio-eb526**
2. Clicca su **Storage** nel menu laterale

### **Passo 2: Cerca Impostazioni**
1. Clicca su **Files** (se non sei già lì)
2. Cerca in alto a destra:
   - **Tre punti** → **"Settings"** o **"Impostazioni"**
   - **"Configuration"** o **"Configurazione"**
   - **"Bucket settings"** o **"Impostazioni bucket"**

## 🔧 OPZIONE 3 - URL Diretto

Prova questi URL diretti:

### **Google Cloud Storage:**
- https://console.cloud.google.com/storage/browser/portfolio-eb526.appspot.com
- https://console.cloud.google.com/storage/browser/portfolio-eb526.appspot.com?project=portfolio-eb526

### **Firebase Storage:**
- https://console.firebase.google.com/project/portfolio-eb526/storage/portfolio-eb526.appspot.com/files

## 🔧 OPZIONE 4 - Riavvia il Terminale

Se vuoi provare con Google Cloud SDK:

1. **Chiudi** il terminale attuale
2. **Apri** un nuovo terminale PowerShell
3. **Prova:** `gcloud --version`
4. Se funziona, esegui:
   ```bash
   gcloud auth login
   gcloud config set project portfolio-eb526
   gsutil cors set BUCKET_CORS_CONFIG.json gs://portfolio-eb526.appspot.com
   ```

## 🎯 Configurazione CORS da Applicare

Quando trovi l'opzione CORS, incolla questa configurazione:

```json
[
  {
    "origin": [
      "https://meirks.xyz",
      "https://www.meirks.xyz",
      "https://portfolio-eb526.web.app",
      "https://portfolio-eb526.firebaseapp.com"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Range",
      "Accept-Ranges",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers"
    ],
    "maxAgeSeconds": 3600
  }
]
```

## 🆘 Se Non Trovi Ancora CORS

1. **Prova a cercare** "CORS" nella barra di ricerca della console
2. **Controlla** se hai i permessi di amministratore sul progetto
3. **Prova** con un browser diverso
4. **Contatta** il supporto Firebase se necessario

## 🎯 Risultato Atteso
Dopo aver applicato la configurazione CORS, tutti i media dovrebbero caricarsi correttamente su meirks.xyz senza errori CORS.

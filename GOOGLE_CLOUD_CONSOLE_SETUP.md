# Configurazione CORS tramite Google Cloud Console

## Passo 1: Accedi a Google Cloud Console
1. Vai su: https://console.cloud.google.com/
2. Seleziona il progetto: **portfolio-eb526**

## Passo 2: Vai a Cloud Storage
1. Nel menu laterale, clicca su **Cloud Storage**
2. Clicca su **Browser**
3. Trova il bucket: **portfolio-eb526.appspot.com**

## Passo 3: Configura CORS
1. Clicca sui **tre punti** del bucket
2. Seleziona **Edit CORS**
3. Incolla questa configurazione:

```json
[
  {
    "origin": [
      "https://portfolio-eb526.web.app", 
      "https://portfolio-eb526.firebaseapp.com",
      "https://meirks.xyz",
      "https://www.meirks.xyz"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "responseHeader": [
      "Content-Type", 
      "Authorization", 
      "Content-Range", 
      "Accept-Ranges", 
      "X-Goog-Upload-Status", 
      "X-Goog-Upload-Size-Received",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers"
    ],
    "maxAgeSeconds": 3600
  }
]
```

## Passo 4: Salva
1. Clicca su **Save**
2. Conferma la configurazione

## Passo 5: Verifica
1. Vai su https://meirks.xyz
2. Apri la console del browser (F12)
3. Verifica che non ci siano più errori CORS

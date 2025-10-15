# Configurazione CORS tramite Firebase Console

## Passo 1: Accedi a Firebase Console
1. Vai su: https://console.firebase.google.com/
2. Seleziona il progetto: **portfolio-eb526**

## Passo 2: Configura Storage
1. Nel menu laterale, clicca su **Storage**
2. Clicca su **Rules** (nella tab superiore)
3. Clicca su **Edit rules**

## Passo 3: Aggiungi Regole CORS
Sostituisci le regole esistenti con:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
      // CORS headers per dominio personalizzato
      allow read: if request.headers.origin == "https://meirks.xyz" 
                   || request.headers.origin == "https://www.meirks.xyz"
                   || request.headers.origin == "https://portfolio-eb526.web.app"
                   || request.headers.origin == "https://portfolio-eb526.firebaseapp.com";
    }
  }
}
```

## Passo 4: Pubblica le Regole
1. Clicca su **Publish**
2. Conferma la pubblicazione

## Passo 5: Verifica
1. Vai su https://meirks.xyz
2. Apri la console del browser (F12)
3. Verifica che non ci siano più errori CORS

# 🚀 Guida Completa per Risolvere il Problema CORS

## 🎯 Problema
Il dominio personalizzato `meirks.xyz` non può accedere ai contenuti di Firebase Storage a causa di errori CORS.

## ✅ Soluzioni Disponibili

### 🥇 **Opzione 1: Script Automatico (Raccomandato)**
```powershell
# Esegui questo comando in PowerShell come Amministratore
.\scripts\install-gcloud.ps1
```
**Vantaggi:** Completamente automatico, configura tutto in una volta
**Tempo:** ~5-10 minuti

### 🥈 **Opzione 2: Firebase Console (Più Semplice)**
1. Vai su: https://console.firebase.google.com/project/portfolio-eb526
2. Segui le istruzioni in: `FIREBASE_CONSOLE_SETUP.md`
**Vantaggi:** Interfaccia grafica, nessuna installazione richiesta
**Tempo:** ~2-3 minuti

### 🥉 **Opzione 3: Google Cloud Console**
1. Vai su: https://console.cloud.google.com/storage/browser
2. Segui le istruzioni in: `GOOGLE_CLOUD_CONSOLE_SETUP.md`
**Vantaggi:** Controllo completo, interfaccia web
**Tempo:** ~3-5 minuti

## 🔧 Configurazione Manuale (Se le opzioni sopra non funzionano)

### Installazione Google Cloud SDK:
```powershell
# Installa Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Installa Google Cloud SDK
choco install gcloudsdk -y

# Configura
gcloud auth login
gcloud config set project portfolio-eb526

# Applica CORS
gsutil cors set storage-cors.json gs://portfolio-eb526.appspot.com
```

## 🧪 Test di Verifica
Dopo aver applicato una delle soluzioni:

1. **Vai su:** https://meirks.xyz
2. **Apri console browser:** F12
3. **Verifica:** Non dovrebbero esserci più errori CORS
4. **Controlla:** I video e le immagini dovrebbero caricarsi

## 📋 File di Configurazione Creati
- ✅ `storage-cors.json` - Configurazione CORS per Firebase Storage
- ✅ `cors.json` - Configurazione CORS aggiornata
- ✅ `firebase.json` - Headers CORS per hosting
- ✅ `server.js` - Middleware CORS aggiornato

## 🆘 Se Nulla Funziona
1. **Contatta supporto Firebase:** https://firebase.google.com/support
2. **Verifica dominio personalizzato:** Assicurati che meirks.xyz sia configurato correttamente in Firebase Hosting
3. **Controlla DNS:** Verifica che il dominio punti correttamente a Firebase

## 🎯 Risultato Atteso
Dopo la configurazione:
- ✅ Nessun errore CORS nella console
- ✅ Video e immagini caricano correttamente
- ✅ Sito funziona perfettamente su meirks.xyz
- ✅ Performance ottimale

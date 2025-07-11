# 🎨 Portfolio VFXulo - Sistema Multi-Ambiente

Un portfolio dinamico per artisti VFX/3D con gestione completa tramite admin panel e supporto multi-ambiente (Local, Pre-prod, Production).

## 🌟 Caratteristiche Principali

### ✨ **Frontend**
- **Design Responsive** - Ottimizzato per desktop e mobile
- **Shader GLSL** - Effetti visivi avanzati per desktop
- **Animazioni CSS** - Fallback leggero per mobile
- **Gallerie Dinamiche** - Caroselli interattivi con Swiper.js
- **Modale Video/Immagini** - Visualizzazione full-screen
- **Canvas 3D** - Rendering di modelli Three.js

### 🔧 **Backend & Admin**
- **Sistema Multi-Ambiente** - Local, Pre-prod, Production
- **Admin Panel Responsive** - Gestione completa ottimizzata mobile
- **Autenticazione Firebase** - Login sicuro senza token
- **Upload Diretto** - Firebase Storage per immagini/video
- **Database Firestore** - Salvataggio dati in tempo reale
- **Mobile Shader Editor** - Editor GLSL integrato
- **Sistema Logging** - Tracciamento completo delle operazioni
- **Gestione Modifiche** - Indicatori visivi per cambiamenti non salvati
- **Upload Progress** - Overlay animato con progress bar
- **Configurazione Modulare** - Form indipendenti per diverse sezioni

### 🛡️ **Sicurezza**
- **Autenticazione Firebase** - Solo utenti autorizzati
- **Regole Firestore** - Controllo accessi granulare
- **CORS Configurato** - Upload sicuro
- **Validazione Input** - Protezione XSS

## 🏗️ Architettura Sistema

### 📁 **Struttura Progetto**
```
portfolio/
├── config/               # Configurazioni ambiente
│   ├── env.local.js     # Local development
│   ├── env.preprod.js   # Pre-production
│   └── env.prod.js      # Production
├── js/                  # JavaScript core
│   ├── firebase.js      # Inizializzazione Firebase
│   ├── auth.js          # Sistema autenticazione
│   ├── dataProvider.js  # Gestione dati
│   └── script.js        # Logica frontend
├── admin/               # Pannello amministrazione
│   ├── index.html       # Interfaccia admin
│   ├── script.js        # Logica admin
│   └── style.css        # Stili admin
├── data/                # Dati locali (dev/preprod)
│   ├── galleries.json   # Configurazione gallerie
│   ├── site.json        # Configurazione sito
│   └── mobile_shader.glsl # Shader mobile
├── images/              # Asset immagini
├── video/               # Asset video
├── css/                 # Stili aggiuntivi
└── assets/              # Modelli 3D e texture
```

### 🌍 **Ambienti**

#### **LOCAL** 🟢
- **Porta**: 3000
- **Database**: File JSON locali
- **Upload**: Server Express
- **Auth**: Token amministratore
- **Uso**: Sviluppo e testing

#### **PRE-PROD** 🟡
- **Hosting**: Render.com
- **Database**: File JSON
- **Upload**: Server Express
- **Auth**: Token amministratore
- **Uso**: Staging e review

#### **PRODUCTION** 🔴
- **Hosting**: Firebase Hosting
- **Database**: Firestore
- **Upload**: Firebase Storage
- **Auth**: Firebase Authentication
- **Uso**: Live pubblico

## 🚀 Setup e Installazione

### 1. **Clona il Repository**
```bash
git clone https://github.com/tuousername/portfolio.git
cd portfolio
```

### 2. **Installa Dipendenze**
```bash
npm install
```

### 3. **Configurazione Firebase**

#### **Crea Progetto Firebase**
1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Crea nuovo progetto
3. Abilita Firestore Database
4. Abilita Storage
5. Abilita Authentication (Email/Password)

#### **Configura Credenziali**
Aggiorna `js/firebase.js` con le tue credenziali:
```javascript
const firebaseConfig = {
  apiKey: "TUA_API_KEY",
  authDomain: "TUO_PROJECT.firebaseapp.com",
  projectId: "TUO_PROJECT",
  storageBucket: "TUO_PROJECT.firebasestorage.app",
  messagingSenderId: "TUO_SENDER_ID",
  appId: "TUO_APP_ID"
};
```

### 4. **Crea Utente Admin**
1. Firebase Console → Authentication → Users
2. Add user: `admin@tuodominio.com`
3. Password: `password_sicura`

### 5. **Regole di Sicurezza**

#### **Firestore Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /galleries/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /config/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

#### **Storage Rules**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🎮 Utilizzo

### **Sviluppo Locale**
```bash
# Avvia server development
npm start

# Apri browser
http://localhost:3000

# Admin panel
http://localhost:3000/admin
```

### **Deploy Pre-prod (Render)**
```bash
# Connetti repository a Render
# Deploy automatico da branch main
```

### **Deploy Production (Firebase)**
```bash
# Installa Firebase CLI
npm install -g firebase-tools

# Login Firebase
firebase login

# Deploy
firebase deploy
```

## 📊 Gestione Contenuti

### **Admin Panel** (`/admin/`)

#### **Autenticazione**
- **Login**: Email/password Firebase
- **Logout**: Pulsante logout
- **Protezione**: Auto-redirect se non autenticato

#### **Gestione Gallerie**
- **Aggiungi Slide**: Pulsante "Aggiungi Slide"
- **Modifica**: Click "Modifica" su slide esistente
- **Elimina**: Click "Elimina" con conferma
- **Riordina**: Drag & drop delle slide + pulsanti freccia
- **Upload**: Pulsanti "Upload" per immagini/video con progress
- **Indicatori Non Salvato**: Bordi gialli e badge per modifiche
- **Salvataggio Indipendente**: Ogni galleria salvabile separatamente

#### **Configurazione Sito Modulare**
- **Hero Text & Bio**: Nome sito, testo hero, bio, controllo logo
- **Versione**: Gestione versione sito separata
- **Contatti**: Lista dinamica contatti con add/remove
- **API Settings**: Base URL e configurazione Shader URL
- **Sezioni**: Gestione visibilità sezioni con drag & drop
- **Mobile Shader**: Editor GLSL integrato con syntax highlighting

#### **Sistema Logging Avanzato**
- **Log Colorati**: Verde (successo), Rosso (errore), Giallo (info)
- **Tracciamento Modifiche**: Dettagli specifici di ogni cambiamento
- **Timestamp**: Orario preciso per ogni operazione
- **Contatori**: Numero di elementi modificati/aggiunti/rimossi
- **Scroll Automatico**: Log sempre visibile in fondo

#### **Upload System Avanzato**
- **Progress Overlay**: Spinner, progress bar, lista file
- **Indicatori Stato**: Successo/errore per ogni file
- **Multi-file**: Upload simultaneo di più file
- **Feedback Visivo**: Animazioni e transizioni smooth

#### **Tipi di Contenuto**
- **Video**: `.mp4`, `.mov`, `.webm`
- **Immagini**: `.jpg`, `.png`, `.gif`, `.webp`
- **Canvas**: Rendering 3D con Three.js
- **Gallerie**: Collezioni di immagini

### **Struttura Dati**

#### **Gallerie** (`galleries.json` / Firestore)
```json
{
  "vfx": [
    {
      "title": "Motion Graphics",
      "src": "images/thumb.jpg",
      "video": "video/demo.mp4",
      "canvas": true,
      "description": "Descrizione progetto"
    }
  ]
}
```

#### **Configurazione Sito** (`site.json` / Firestore)
```json
{
  "heroText": "vfxulo",
  "bio": "Artista VFX e 3D...",
  "contacts": [
    {"label": "Email", "value": "info@vfxulo.com"}
  ],
  "sections": [
    {"key": "vfx", "label": "VFX", "status": "show"}
  ]
}
```

## 🔧 Funzionalità Avanzate

### **Admin Panel Mobile-First** 🆕
- **Layout Responsive**: Sidebar che diventa orizzontale su mobile
- **Touch Optimization**: Controlli ottimizzati per dispositivi touch
- **Tabelle Adaptive**: Colonne nascoste automaticamente su schermi piccoli
- **Modal Responsive**: Overlay e form adattati per mobile
- **Navigation Smooth**: Transizioni fluide tra sezioni

### **Sistema Gestione Modifiche** 🆕
- **Indicatori Visivi**: Bordi gialli e badge per modifiche non salvate
- **Pulsanti Pulsanti**: Animazione pulse per richiamare l'attenzione
- **Stato Persistente**: Tracciamento modifiche per ogni sezione
- **Salvataggio Granulare**: Ogni form salvabile indipendentemente
- **Feedback Immediato**: Conferme visive per ogni operazione

### **Upload System Avanzato** 🆕
- **Progress Overlay**: Interfaccia completa con spinner e progress bar
- **Multi-file Support**: Upload simultaneo di più file
- **Status Indicators**: Icone successo/errore per ogni file
- **Smooth Animations**: Transizioni fluide e feedback visivo
- **Error Handling**: Gestione errori con retry automatico

### **Logging System Professionale** 🆕
- **Log Colorati**: Verde (successo), Rosso (errore), Giallo (info), Cyan (info)
- **Timestamp Preciso**: Orario esatto per ogni operazione
- **Dettagli Operazioni**: Tracciamento completo di modifiche, aggiunte, rimozioni
- **Auto-scroll**: Log sempre visibile in fondo
- **Formatting Avanzato**: Stili CSS per migliore leggibilità

### **Shader System**
- **Desktop**: Shader GLSL complessi via Shadertoy
- **Mobile**: Shader leggeri custom
- **Fallback**: Animazioni CSS se shader non supportato

### **Upload System**
- **Produzione**: Upload diretto Firebase Storage
- **Dev/Staging**: Upload via Express server
- **Organizzazione**: Cartelle automatiche `/images/` e `/videos/`
- **Nomi File**: Timestamp + random per evitare conflitti

### **Responsive Design**
- **Breakpoints**: 480px, 768px, 900px, 1200px
- **Mobile First**: Ottimizzazioni performance mobile
- **Touch Support**: Gestione eventi touch
- **Accessibility**: Supporto screen reader
- **Admin Mobile**: Layout responsive completo per admin panel
- **Sidebar Adattiva**: Navigation orizzontale su mobile
- **Tabelle Responsive**: Colonne nascoste su schermi piccoli
- **Touch-Friendly**: Controlli ottimizzati per dispositivi touch

## 🐛 Troubleshooting

### **Errori Comuni**

#### **CORS Errors**
```bash
# Configura CORS Firebase Storage
gcloud config set project TUO_PROJECT
gsutil cors set cors.json gs://TUO_PROJECT.firebasestorage.app
```

#### **Authentication Failed**
1. Verifica credenziali Firebase
2. Controlla regole Firestore
3. Verifica utente admin creato

#### **Upload Failed**
1. Controlla regole Storage
2. Verifica dimensioni file (<10MB immagini, <100MB video)
3. Controlla formato file supportato

### **Debug Mode**
```javascript
// Abilita debug console
localStorage.setItem('debug', 'true');
```

## 🎯 Roadmap

### **v1.1.0** ✅ **COMPLETATO**
- [x] **Admin Mobile Responsive** - Layout completamente ottimizzato per mobile
- [x] **Sistema Logging Avanzato** - Log colorati con tracciamento dettagliato
- [x] **Upload Progress Overlay** - Indicatori visivi per upload
- [x] **Configurazione Modulare** - Form indipendenti per diverse sezioni
- [x] **Gestione Modifiche** - Indicatori visivi per cambiamenti non salvati
- [x] **Drag & Drop Migliorato** - Correzione handle e integrazione con unsaved state
- [x] **Branding Configurabile** - Nome sito e logo gestiti via admin
- [x] **Environment Detection** - Rilevamento automatico ambiente (local/preprod/prod)
- [x] **Upload Animation System** - Overlay completo con spinner e progress bar
- [x] **Partial Site Config** - Salvataggio indipendente per ogni sezione

### **v1.2.0** 🚧 **IN SVILUPPO**
- [ ] Image optimization automatica
- [ ] Video thumbnails generation
- [ ] Bulk operations per gallerie
- [ ] Export/Import configurazioni
- [ ] Backup automatico dati

### **v1.3.0** 📋 **PIANIFICATO**
- [ ] Multi-user support
- [ ] Permissions system granulare
- [ ] Analytics integration
- [ ] SEO optimization avanzata
- [ ] Sitemap automatica

### **v2.0.0** 🔮 **FUTURO**
- [ ] PWA support completo
- [ ] Offline mode
- [ ] Advanced shader editor con autocomplete
- [ ] API endpoints pubblici
- [ ] Plugin system
- [ ] Theme customization

## 📄 Licenza

MIT License - Vedi `LICENSE` file per dettagli.

## 👨‍💻 Autore

**VFXulo** - Realizzato al 100% con l'indispensabile aiuto di Cursor e i suoi agenti galattici 🚀

---

## 🔗 Links Utili

- [Firebase Console](https://console.firebase.google.com)
- [Render Dashboard](https://dashboard.render.com)
- [Three.js Documentation](https://threejs.org/docs/)
- [Swiper.js Documentation](https://swiperjs.com)

---

*Ultimo aggiornamento: Luglio 2025 - v1.1.0-release* 

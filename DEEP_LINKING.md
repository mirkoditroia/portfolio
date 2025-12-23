# Deep Linking & URL Personalizzati

## 🎯 Funzionalità

Il portfolio supporta ora **URL personalizzati** per ogni progetto, permettendo di condividere link diretti tipo:

```
https://meirks.xyz/nome-progetto
https://meirks.xyz/my-awesome-vfx
https://meirks.xyz/interactive-installation
```

## 📋 Come Funziona

### 1. **Generazione Automatica URL**
Quando apri un progetto, il sistema:
- Converte il titolo in uno slug URL-friendly
- Aggiorna l'URL del browser automaticamente
- Aggiunge l'entry nella cronologia del browser

**Esempio:**
- Titolo: `"My Awesome VFX Project!"`
- URL: `/my-awesome-vfx-project`

### 2. **Deep Linking**
Puoi condividere l'URL diretto a un progetto:
- L'URL viene aperto direttamente
- Il modal si apre automaticamente
- Se il progetto non esiste, reindirizza alla homepage

### 3. **Navigazione Browser**
- ✅ **Back/Forward** funzionano correttamente
- ✅ **Refresh** mantiene il progetto aperto
- ✅ **Bookmark** salva il progetto specifico

### 4. **Social Media Sharing**
Quando condividi un link su social media, vengono mostrati:
- **Titolo** del progetto
- **Descrizione** del progetto
- **Immagine** di anteprima
- **URL** canonico

## 🔧 Implementazione Tecnica

### File Modificati

1. **`js/modalModule.js`**
   - `slugify()` - Converte titoli in URL
   - `updateMetaTags()` - Aggiorna Open Graph tags
   - `setupHistoryListener()` - Gestisce back/forward
   - `openModalFromSlug()` - Apre modal da URL

2. **`js/app.js`**
   - `checkDeepLink()` - Controlla URL al caricamento
   - Passa la `section` quando apre modal

3. **`firebase.json`**
   - Rewrite `**` → `/index.html` (già presente)
   - Permette il routing lato client

## 📝 Slug Rules

Gli slug vengono generati seguendo queste regole:
- Tutto lowercase
- Spazi → trattini (`-`)
- Rimuove accenti e caratteri speciali
- Rimuove caratteri non-alfanumerici
- Rimuove trattini multipli

**Esempi:**
```
"3D Art Gallery"          → "3d-art-gallery"
"Città Futuristica"       → "citta-futuristica"
"VFX: Explosion Test!"    → "vfx-explosion-test"
"Installazione #2 (2024)" → "installazione-2-2024"
```

## 🎨 Meta Tags Aggiornati

Per ogni progetto, vengono aggiornati:

```html
<!-- Open Graph -->
<meta property="og:title" content="Titolo Progetto">
<meta property="og:description" content="Descrizione...">
<meta property="og:image" content="https://meirks.xyz/images/project.jpg">
<meta property="og:url" content="https://meirks.xyz/titolo-progetto">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Titolo Progetto">
<meta name="twitter:description" content="Descrizione...">
<meta name="twitter:image" content="https://meirks.xyz/images/project.jpg">

<!-- SEO -->
<meta name="description" content="Descrizione...">
<link rel="canonical" href="https://meirks.xyz/titolo-progetto">
```

## 🚀 Test

Per testare il sistema:

1. **Apri un progetto** - Verifica che l'URL cambi
2. **Copia l'URL** - Aprilo in una nuova tab
3. **Usa Back/Forward** - Verifica la navigazione
4. **Condividi su social** - Verifica l'anteprima

## 🐛 Troubleshooting

### URL non si aggiorna
- Verifica che il progetto abbia un `title` definito
- Controlla la console per errori

### Progetto non si apre da URL
- Verifica che il progetto esista in `galleries.json`
- Controlla che lo slug corrisponda al titolo

### Meta tags non corretti
- Verifica che il progetto abbia `description` e `src`/`modalImage`
- Pulisci la cache del browser

## 📊 Struttura Dati

Per supportare il deep linking, ogni progetto deve avere:

```json
{
  "title": "My Project",           // Obbligatorio per generare slug
  "description": "Description...",  // Usato per meta description
  "src": "images/thumbnail.jpg",    // Usato per meta image
  "modalImage": "images/full.jpg",  // Alternativa a src
  // ... altri campi
}
```

## ✅ Vantaggi

- 🔗 **Condivisione facile** - Link diretti ai progetti
- 📱 **SEO friendly** - URL semantici e meta tags ottimizzati
- 🎯 **UX migliorata** - Navigazione browser funzionante
- 🌐 **Social media ready** - Anteprime perfette su tutti i social
- 📖 **Bookmarkable** - Salva progetti preferiti

---

**Note:** Il sistema è completamente retrocompatibile. I progetti esistenti senza modifiche funzioneranno normalmente.


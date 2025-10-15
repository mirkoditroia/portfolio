# 🔒 Configurazione SSL per Dominio Personalizzato meirks.xyz

## 🎯 Problema
Il dominio personalizzato `meirks.xyz` non è configurato in Firebase Hosting, quindi non ha certificato SSL.

## 🔧 Soluzione: Configurazione Dominio Personalizzato

### **Passo 1: Aggiungi Dominio Personalizzato**
```bash
firebase hosting:sites:create meirks-xyz
```

### **Passo 2: Configura il Dominio**
```bash
firebase hosting:channel:deploy live --site meirks-xyz
```

### **Passo 3: Aggiungi Dominio Personalizzato via Console**
1. Vai su: **https://console.firebase.google.com/project/portfolio-eb526/hosting**
2. Clicca su **"Add custom domain"**
3. Inserisci: **meirks.xyz**
4. Segui le istruzioni per verificare il dominio

## 🔧 Alternativa: Configurazione Manuale

### **Metodo 1: Firebase Console**
1. **Vai su:** https://console.firebase.google.com/project/portfolio-eb526/hosting
2. **Clicca:** "Add custom domain"
3. **Inserisci:** meirks.xyz
4. **Segui** le istruzioni per la verifica

### **Metodo 2: Comando Firebase CLI**
```bash
# Aggiungi dominio personalizzato
firebase hosting:channel:deploy live --site portfolio-eb526

# Poi configura il dominio via console Firebase
```

## 📋 Configurazione DNS Richiesta

Dopo aver aggiunto il dominio in Firebase, dovrai configurare i record DNS:

### **Record A (IPv4):**
```
Type: A
Name: @
Value: 151.101.1.195
TTL: 300
```

### **Record A (IPv6):**
```
Type: AAAA
Name: @
Value: 2a04:4e42::645
TTL: 300
```

### **Record CNAME (www):**
```
Type: CNAME
Name: www
Value: portfolio-eb526.web.app
TTL: 300
```

## 🔍 Verifica Configurazione

### **1. Controlla DNS:**
```bash
nslookup meirks.xyz
dig meirks.xyz
```

### **2. Test SSL:**
- Vai su: https://www.ssllabs.com/ssltest/
- Inserisci: meirks.xyz
- Verifica il certificato

### **3. Test Browser:**
- Vai su: https://meirks.xyz
- Controlla che il lucchetto sia verde

## 🚨 Problemi Comuni

### **1. Certificato Non Valido:**
- Aspetta 24-48 ore per la propagazione
- Verifica che i record DNS siano corretti
- Controlla che il dominio sia verificato in Firebase

### **2. Redirect Non Funziona:**
- Verifica che il dominio sia configurato in Firebase Hosting
- Controlla che il deploy sia stato fatto correttamente

### **3. DNS Non Propagato:**
- Usa: https://dnschecker.org/
- Controlla la propagazione globale

## 🎯 Risultato Atteso
Dopo la configurazione:
- ✅ https://meirks.xyz funziona
- ✅ Certificato SSL valido
- ✅ Lucchetto verde nel browser
- ✅ Redirect automatico da HTTP a HTTPS

## 📞 Supporto
Se hai problemi:
1. **Firebase Support:** https://firebase.google.com/support
2. **DNS Issues:** Contatta il provider del dominio
3. **SSL Issues:** Verifica la configurazione Firebase

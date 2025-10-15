# Script automatico per configurare CORS su Firebase Storage
# Risolve il problema CORS per meirks.xyz

Write-Host "🚀 Configurazione CORS automatica per Firebase Storage..." -ForegroundColor Green

# Verifica se gcloud è disponibile
try {
    $gcloudVersion = gcloud --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Google Cloud SDK trovato" -ForegroundColor Green
    } else {
        throw "gcloud non trovato"
    }
} catch {
    Write-Host "❌ Google Cloud SDK non trovato. Riavvia il terminale e riprova." -ForegroundColor Red
    Write-Host "Se il problema persiste, installa Google Cloud SDK:" -ForegroundColor Yellow
    Write-Host "winget install Google.CloudSDK" -ForegroundColor Cyan
    exit 1
}

# Autenticazione
Write-Host "🔐 Avvio autenticazione Google Cloud..." -ForegroundColor Yellow
Write-Host "Si aprirà il browser per l'autenticazione..." -ForegroundColor Yellow
gcloud auth login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Errore durante l'autenticazione" -ForegroundColor Red
    exit 1
}

# Configura progetto
Write-Host "⚙️ Configurazione progetto portfolio-eb526..." -ForegroundColor Green
gcloud config set project portfolio-eb526

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Errore durante la configurazione del progetto" -ForegroundColor Red
    exit 1
}

# Applica configurazione CORS
Write-Host "📁 Applicazione configurazione CORS..." -ForegroundColor Green
$corsFile = Join-Path $PSScriptRoot "..\BUCKET_CORS_CONFIG.json"
$bucket = "gs://portfolio-eb526.appspot.com"

gsutil cors set $corsFile $bucket

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Configurazione CORS applicata con successo!" -ForegroundColor Green
} else {
    Write-Host "❌ Errore durante l'applicazione della configurazione CORS" -ForegroundColor Red
    exit 1
}

# Verifica configurazione
Write-Host "🔍 Verifica configurazione CORS..." -ForegroundColor Green
gsutil cors get $bucket

Write-Host "🎉 Configurazione completata!" -ForegroundColor Green
Write-Host "🌐 Testa ora https://meirks.xyz" -ForegroundColor Cyan
Write-Host "📋 Gli errori CORS dovrebbero essere risolti!" -ForegroundColor Green

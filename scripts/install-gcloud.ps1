# Script PowerShell per installare Google Cloud SDK
# Risolve automaticamente il problema CORS per meirks.xyz

Write-Host "🚀 Installazione Google Cloud SDK per configurazione CORS..." -ForegroundColor Green

# Verifica se Chocolatey è installato
if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "✅ Chocolatey trovato. Installazione Google Cloud SDK..." -ForegroundColor Green
    choco install gcloudsdk -y
} else {
    Write-Host "⚠️  Chocolatey non trovato. Installazione automatica..." -ForegroundColor Yellow
    
    # Installa Chocolatey
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Installa Google Cloud SDK
    choco install gcloudsdk -y
}

Write-Host "🔧 Configurazione Google Cloud SDK..." -ForegroundColor Green

# Configura il progetto
gcloud config set project portfolio-eb526

Write-Host "🔐 Autenticazione richiesta..." -ForegroundColor Yellow
Write-Host "Si aprirà il browser per l'autenticazione..." -ForegroundColor Yellow
gcloud auth login

Write-Host "📁 Applicazione configurazione CORS..." -ForegroundColor Green
$corsFile = Join-Path $PSScriptRoot "..\storage-cors.json"
$bucket = "gs://portfolio-eb526.appspot.com"

gsutil cors set $corsFile $bucket

Write-Host "✅ Configurazione CORS completata!" -ForegroundColor Green
Write-Host "🌐 Testa ora https://meirks.xyz" -ForegroundColor Cyan

# Verifica la configurazione
Write-Host "🔍 Verifica configurazione CORS..." -ForegroundColor Green
gsutil cors get $bucket

#!/bin/bash

# Script pour lancer ProNote+ avec le bon environnement
export LD_LIBRARY_PATH=/usr/lib:$LD_LIBRARY_PATH

echo "🚀 Lancement de ProNote+..."
echo "Vite démarrera sur http://localhost:3000/"
echo ""

# Lancement en arrière-plan
npm run dev:vite &
VITE_PID=$!

echo "Vite démarré (PID: $VITE_PID)"
echo "Attente de 3 secondes que Vite soit prêt..."
sleep 3

echo ""
echo "🔄 Lancement d'Electron..."
# Essayons plusieurs méthodes pour lancer Electron

echo "Méthode 1 : npx electron"
npx electron . 2>&1 | grep -v "Downloading" || {
    echo "❌ Échec méthode 1"
    
    echo ""
    echo "Méthode 2 : node_modules/.bin/electron"
    node_modules/.bin/electron . 2>&1 | grep -v "Downloading" || {
        echo "❌ Échec méthode 2"
        
        echo ""
        echo "Méthode 3 : Téléchargement manuel d'Electron"
        npx --yes electron@latest --version
        npx electron . 2>&1 | grep -v "Downloading"
    }
}

# Nettoyage
kill $VITE_PID 2>/dev/null

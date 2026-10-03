#!/bin/bash

echo "🚀 LANCEMENT DE PRONOTE+ 🚀"
echo "Date : $(date)"
echo ""

# Étape 1 : Démarrer Vite (interface web)
echo "1. Démarrage de Vite sur http://localhost:3001/"
npm run dev:vite &
VITE_PID=$!
sleep 5

# Étape 2 : Démarrer Electron
echo "2. Démarrage d'Electron..."
export LD_LIBRARY_PATH=/usr/lib:$LD_LIBRARY_PATH
node_modules/.bin/electron . 2>&1

# Nettoyage
echo ""
echo "Arrêt de Vite..."
kill $VITE_PID 2>/dev/null
echo "✅ ProNote+ arrêté"

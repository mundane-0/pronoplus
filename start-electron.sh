#!/bin/bash

# Script pour lancer Electron avec le bon chemin de bibliothèques
export LD_LIBRARY_PATH=/usr/lib:$LD_LIBRARY_PATH

echo "Lancement d'Electron..."
npx electron .


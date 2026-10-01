#!/bin/bash

# Script pour pousser ProNote+ sur GitHub
# Exécutez ce script après avoir créé un token d'accès personnel GitHub

set -e  # Arrêter en cas d'erreur

echo "=== Script de déploiement ProNote+ sur GitHub ==="
echo ""

# Demander le nom d'utilisateur GitHub
read -p "Entrez votre nom d'utilisateur GitHub : " GITHUB_USERNAME

# Demander le token d'accès personnel
read -sp "Entrez votre token d'accès personnel GitHub : " GITHUB_TOKEN
echo ""

# Créer le repository via l'API GitHub
echo "Création du repository 'pronoplus' sur GitHub..."
REPO_DATA=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{
    "name": "pronoplus",
    "description": "ProNote+ - Application desktop remplaçant Pronote avec analyse avancée des notes et assistant IA",
    "private": false,
    "auto_init": false,
    "has_issues": true,
    "has_projects": true,
    "has_wiki": true
  }')

# Vérifier si la création a réussi
if echo "$REPO_DATA" | grep -q '"html_url"'; then
  echo "✅ Repository créé avec succès sur GitHub !"
  
  # Extraire l'URL du repository
  REPO_URL=$(echo "$REPO_DATA" | grep -o '"clone_url": "[^"]*"' | cut -d'"' -f4)
  echo "URL du repository : $REPO_URL"
  
  # Configurer Git et pousser le code
  echo ""
  echo "Configuration de Git..."
  
  # Configurer l'utilisateur Git
  git config --local user.name "$GITHUB_USERNAME"
  git config --local user.email "$GITHUB_USERNAME@users.noreply.github.com"
  
  # Ajouter l'origine avec l'URL contenant le token
  AUTH_REPO_URL=$(echo $REPO_URL | sed "s|https://|https://$GITHUB_USERNAME:$GITHUB_TOKEN@|")
  git remote add origin "$AUTH_REPO_URL"
  
  # Pousser le code
  echo ""
  echo "Poussage du code vers GitHub..."
  git branch -M main
  git push -u origin main
  
  echo ""
  echo "✅ ProNote+ a été poussé avec succès sur GitHub !"
  echo "🌐 Accédez à votre repository : https://github.com/$GITHUB_USERNAME/pronoplus"
  echo ""
  echo "=== Prochaines étapes ==="
  echo "1. Vérifiez votre repository sur GitHub"
  echo "2. Activez GitHub Pages si besoin (pour la documentation)"
  echo "3. Créez une première release"
  echo "4. Partagez le projet !"
  
else
  echo "❌ Erreur lors de la création du repository."
  echo "Réponse de l'API :"
  echo "$REPO_DATA"
  echo ""
  echo "Vérifiez :"
  echo "1. Que le token a la permission 'repo'"
  echo "2. Que le nom d'utilisateur est correct"
  echo "3. Que vous n'avez pas déjà un repository nommé 'pronoplus'"
  exit 1
fi

# Nettoyer le token de la mémoire
unset GITHUB_TOKEN
unset GITHUB_USERNAME
unset AUTH_REPO_URL
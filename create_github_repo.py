#!/usr/bin/env python3
"""
Script pour créer un repository GitHub pour ProNote+
"""
import json
import os
import sys
import subprocess
import getpass

def create_github_repository():
    print("=== Création du repository GitHub pour ProNote+ ===")
    print()
    
    # Demander les informations utilisateur
    username = input("Votre nom d'utilisateur GitHub: ").strip()
    
    print("\nPour créer un token d'accès personnel:")
    print("1. Allez sur https://github.com/settings/tokens")
    print("2. Cliquez sur 'Generate new token'")
    print("3. Nommez-le 'ProNote+ Push Token'")
    print("4. Sélectionnez la portée 'repo' (full control)")
    print("5. Copiez le token généré")
    print()
    
    token = getpass.getpass("Votre token d'accès personnel GitHub: ").strip()
    
    # Créer le repository via l'API
    import requests
    
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    data = {
        'name': 'pronoplus',
        'description': 'ProNote+ - Application desktop remplaçant Pronote avec analyse avancée des notes et assistant IA',
        'private': False,
        'auto_init': False,
        'has_issues': True,
        'has_projects': True,
        'has_wiki': True
    }
    
    print("\nCréation du repository 'pronoplus'...")
    response = requests.post('https://api.github.com/user/repos', headers=headers, json=data)
    
    if response.status_code == 201:
        repo_info = response.json()
        clone_url = repo_info['clone_url']
        html_url = repo_info['html_url']
        
        print(f"✅ Repository créé avec succès!")
        print(f"URL: {html_url}")
        print(f"Clone URL: {clone_url}")
        
        # Configurer Git local
        print("\nConfiguration du repository local...")
        
        # Retirer l'origine existante si elle existe
        subprocess.run(['git', 'remote', 'remove', 'origin'], capture_output=True, text=True)
        
        # Ajouter la nouvelle origine
        auth_url = clone_url.replace('https://', f'https://{username}:{token}@')
        subprocess.run(['git', 'remote', 'add', 'origin', auth_url], check=True)
        
        # Pousser le code
        print("Poussage du code vers GitHub...")
        subprocess.run(['git', 'branch', '-M', 'main'], check=True)
        subprocess.run(['git', 'push', '-u', 'origin', 'main'], check=True)
        
        print("\n🎉 ProNote+ a été poussé avec succès sur GitHub!")
        print(f"🌐 Accédez à: {html_url}")
        print("\n=== Prochaines étapes ===")
        print("1. Visitez votre repository sur GitHub")
        print("2. Configurez GitHub Pages si nécessaire")
        print("3. Créez une première release")
        print("4. Partagez le projet!")
        
        # Nettoyer le token de l'URL
        safe_url = clone_url.replace(f'{username}:{token}@', '')
        print(f"\nURL de clone standard: {safe_url}")
        
    else:
        print(f"❌ Erreur lors de la création du repository:")
        print(f"Code: {response.status_code}")
        print(f"Message: {response.text}")
        sys.exit(1)

if __name__ == '__main__':
    try:
        create_github_repository()
    except KeyboardInterrupt:
        print("\n\n❌ Opération annulée par l'utilisateur.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        sys.exit(1)

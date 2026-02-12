#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  📦 COPIE DES FICHIERS MODIFIÉS VERS TON REPO GIT        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Demander le chemin du repo
echo "📂 Où est ton repo Git principal (connecté à Vercel) ?"
echo "Exemple: /home/user/altess ou ~/projects/altess"
echo ""
read -p "Chemin complet du repo: " REPO_PATH

# Vérifier que le chemin existe
if [ ! -d "$REPO_PATH" ]; then
  echo "❌ Erreur: Le dossier $REPO_PATH n'existe pas"
  exit 1
fi

# Vérifier que c'est un repo Git
if [ ! -d "$REPO_PATH/.git" ]; then
  echo "❌ Erreur: $REPO_PATH n'est pas un repo Git (pas de dossier .git)"
  exit 1
fi

echo ""
echo "✅ Repo trouvé: $REPO_PATH"
echo ""
echo "📋 Fichiers qui seront copiés:"
echo "   1. components/WhatsAppChat.tsx (z-index WhatsApp corrigé)"
echo "   2. components/PlayoutMediaLibrary.tsx (détection auto durée)"
echo ""
read -p "Continuer ? (o/n): " CONFIRM

if [ "$CONFIRM" != "o" ] && [ "$CONFIRM" != "O" ]; then
  echo "❌ Annulé"
  exit 0
fi

# Copier les fichiers
echo ""
echo "📦 Copie en cours..."

# WhatsAppChat.tsx
if cp /tmp/cc-agent/62678032/project/components/WhatsAppChat.tsx "$REPO_PATH/components/WhatsAppChat.tsx"; then
  echo "✅ WhatsAppChat.tsx copié"
else
  echo "❌ Erreur lors de la copie de WhatsAppChat.tsx"
  exit 1
fi

# PlayoutMediaLibrary.tsx
if cp /tmp/cc-agent/62678032/project/components/PlayoutMediaLibrary.tsx "$REPO_PATH/components/PlayoutMediaLibrary.tsx"; then
  echo "✅ PlayoutMediaLibrary.tsx copié"
else
  echo "❌ Erreur lors de la copie de PlayoutMediaLibrary.tsx"
  exit 1
fi

echo ""
echo "✅ Tous les fichiers ont été copiés avec succès !"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 PROCHAINE ÉTAPE: COMMIT ET PUSH                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Exécute ces commandes dans ton repo:"
echo ""
echo "cd $REPO_PATH"
echo "git status"
echo "git add components/WhatsAppChat.tsx components/PlayoutMediaLibrary.tsx"
echo "git commit -m 'Full Sync Vercel: WhatsApp z-index + Auto video duration'"
echo "git push origin main"
echo ""
echo "Vercel déploiera automatiquement en 2-3 minutes."
echo ""

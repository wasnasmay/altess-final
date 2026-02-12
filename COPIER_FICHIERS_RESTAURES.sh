#!/bin/bash

# ================================================================
# SCRIPT DE COPIE DES FICHIERS RESTAURÉS VERS VOTRE DÉPÔT GIT
# ================================================================
# Ce script copie les fichiers restaurés de Bolt vers votre dépôt git local

echo "📦 COPIE DES FICHIERS RESTAURÉS v0.1.7"
echo "========================================"
echo ""

# Demander le chemin du dépôt git
read -p "📁 Entrez le chemin complet de votre dépôt git local: " REPO_PATH

# Vérifier que le dépôt existe
if [ ! -d "$REPO_PATH" ]; then
    echo "❌ Erreur: Le chemin '$REPO_PATH' n'existe pas"
    exit 1
fi

# Vérifier que c'est un dépôt git
if [ ! -d "$REPO_PATH/.git" ]; then
    echo "❌ Erreur: '$REPO_PATH' n'est pas un dépôt git"
    exit 1
fi

echo "✅ Dépôt trouvé: $REPO_PATH"
echo ""

# Liste des fichiers critiques à copier
CURRENT_DIR=$(pwd)

echo "📋 Fichiers à copier:"
echo ""

# Fonction pour copier avec confirmation
copy_file() {
    local src="$1"
    local dest="$2"

    if [ -f "$src" ]; then
        mkdir -p "$(dirname "$dest")"
        cp "$src" "$dest"
        echo "  ✅ Copié: $src"
        return 0
    else
        echo "  ⚠️  Fichier non trouvé: $src"
        return 1
    fi
}

# Copier les fichiers critiques
echo "1️⃣ Composants restaurés..."
copy_file "$CURRENT_DIR/components/Header.tsx" "$REPO_PATH/components/Header.tsx"
copy_file "$CURRENT_DIR/components/PlayoutMediaLibrary.tsx" "$REPO_PATH/components/PlayoutMediaLibrary.tsx"

echo ""
echo "2️⃣ Configuration..."
copy_file "$CURRENT_DIR/package.json" "$REPO_PATH/package.json"
copy_file "$CURRENT_DIR/package-lock.json" "$REPO_PATH/package-lock.json"

echo ""
echo "3️⃣ Documentation..."
copy_file "$CURRENT_DIR/SYNC_STATUS.md" "$REPO_PATH/SYNC_STATUS.md"
copy_file "$CURRENT_DIR/GUIDE_SYNCHRONISATION_GITHUB_VERCEL.md" "$REPO_PATH/GUIDE_SYNCHRONISATION_GITHUB_VERCEL.md"
copy_file "$CURRENT_DIR/SOLUTION_GITHUB_SYNC_IMMEDIATE.md" "$REPO_PATH/SOLUTION_GITHUB_SYNC_IMMEDIATE.md"

echo ""
echo "✅ COPIE TERMINÉE!"
echo ""
echo "📍 Fichiers copiés vers: $REPO_PATH"
echo ""
echo "🎯 PROCHAINES ÉTAPES:"
echo ""
echo "1. Allez dans votre dépôt:"
echo "   cd \"$REPO_PATH\""
echo ""
echo "2. Vérifiez les changements:"
echo "   git status"
echo ""
echo "3. Ajoutez et commitez:"
echo "   git add ."
echo "   git commit -m \"🔄 FORCE SYNC v0.1.7 - Header et MediaLibrary restaurés\""
echo ""
echo "4. Poussez vers GitHub:"
echo "   git push origin main --force"
echo ""
echo "5. Vercel déploiera automatiquement dans 2-3 minutes"
echo ""
echo "✨ Fait!"

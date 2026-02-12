#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "   SCRIPT DE REDÉMARRAGE COMPLET"
echo "════════════════════════════════════════════════════════"
echo ""

# Tuer tous les processus Node.js
echo "🔴 Arrêt de tous les processus Node.js..."
pkill -9 node 2>/dev/null
sleep 2

# Supprimer le cache Next.js
echo "🗑️  Suppression du cache Next.js..."
rm -rf .next
echo "   ✓ Cache .next supprimé"

# Supprimer node_modules/.cache si existe
if [ -d "node_modules/.cache" ]; then
    echo "🗑️  Suppression du cache node_modules..."
    rm -rf node_modules/.cache
    echo "   ✓ Cache node_modules supprimé"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "   VÉRIFICATION DES CHANGEMENTS"
echo "════════════════════════════════════════════════════════"
echo ""

# Vérifier que les changements sont dans le fichier
if grep -q "VERSION MODIFIÉE" app/page.tsx; then
    echo "✅ CONFIRMATION : Les changements sont dans app/page.tsx"
    echo ""
    echo "Extraits du fichier :"
    echo "────────────────────────────────────────────────────────"
    grep -n "VERSION MODIFIÉE" app/page.tsx | head -5
    echo "────────────────────────────────────────────────────────"
else
    echo "❌ ERREUR : Les changements ne sont PAS dans app/page.tsx"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "   DÉMARRAGE DU SERVEUR"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Démarrage de npm run dev..."
echo ""
echo "⚠️  IMPORTANT : Après le démarrage :"
echo "   1. Ouvre un navigateur en MODE NAVIGATION PRIVÉE"
echo "   2. Va sur : http://localhost:3000"
echo "   3. Tu DOIS voir :"
echo "      - Un FOND VERT FONCÉ"
echo "      - Une GROSSE BORDURE VERTE"
echo "      - Un BADGE VERT qui clignote"
echo ""
echo "Si tu ne vois PAS ces 3 éléments, quelque chose ne va pas."
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

# Démarrer le serveur
npm run dev

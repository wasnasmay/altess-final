#!/bin/bash

# SCRIPT DE PUSH VERS VERCEL
# Ce script pousse le commit "Fixed Layout and Sync" vers votre dépôt

echo "🚀 SYNCHRONISATION VERCEL"
echo "========================="
echo ""
echo "✅ Commit créé : a86710a - Fixed Layout and Sync"
echo "✅ Branche : main"
echo "✅ 570 fichiers prêts"
echo ""

# Vérifier si un remote existe
if git remote | grep -q "origin"; then
    echo "📡 Remote 'origin' détecté"
    echo "🔄 Push vers origin/main..."
    git push -u origin main
    echo "✅ Push terminé !"
    echo ""
    echo "🌐 Vercel va déployer automatiquement"
    echo "📍 Surveillez : https://vercel.com/dashboard"
else
    echo "❌ Aucun remote Git configuré"
    echo ""
    echo "Configurez d'abord votre remote :"
    echo ""
    echo "Option 1 - GitHub (recommandé) :"
    echo "  git remote add origin https://github.com/USERNAME/REPO.git"
    echo "  git push -u origin main"
    echo ""
    echo "Option 2 - Vercel CLI :"
    echo "  vercel --prod"
    echo ""
    echo "Option 3 - Vercel Git :"
    echo "  git remote add vercel VOTRE_URL_VERCEL_GIT"
    echo "  git push -u vercel main"
fi

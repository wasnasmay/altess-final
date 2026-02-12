#!/bin/bash

# ================================
# FORCE GITHUB SYNCHRONIZATION
# ================================
# This script will force push the latest version to GitHub
# Run this to sync all restored files with your repository

echo "🚀 Starting GitHub synchronization..."
echo ""

# Step 1: Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already exists"
fi

# Step 2: Configure git (replace with your info)
echo ""
echo "⚙️  Configuring git..."
git config user.email "contact@altess.fr"
git config user.name "ALTESS Platform"
echo "✅ Git configured"

# Step 3: Add your GitHub remote (REPLACE WITH YOUR REPO URL)
echo ""
echo "🔗 Setting up GitHub remote..."
# Remove existing remote if any
git remote remove origin 2>/dev/null || true
# Add your repository URL here
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
echo "✅ Remote configured"

# Step 4: Add all files
echo ""
echo "📝 Adding all files..."
git add .
echo "✅ Files added"

# Step 5: Commit with timestamp
echo ""
echo "💾 Creating commit..."
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "🔄 FORCE SYNC v0.1.7 - Restored Header & Media Library - $TIMESTAMP

✅ Complete restoration of all functionalities:
- Header.tsx with dynamic navigation
- PlayoutMediaLibrary.tsx with auto-duration detection
- YouTube metadata auto-import
- Version bumped to 0.1.7

This commit contains the full working version with menu and all features."

echo "✅ Commit created"

# Step 6: Force push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
echo "⚠️  This will FORCE PUSH and overwrite GitHub with this version"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -f origin main
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Synchronization complete!"
    echo ""
    echo "Next steps:"
    echo "1. Check GitHub repository to verify changes"
    echo "2. Vercel will automatically deploy from GitHub"
    echo "3. Wait 2-3 minutes for Vercel deployment"
    echo "4. Clear browser cache and reload"
else
    echo ""
    echo "❌ Push cancelled"
fi

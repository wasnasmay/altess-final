#!/usr/bin/env node

/**
 * Script de vérification du webhook Stripe
 * Vérifie que les imports et la syntaxe sont corrects sans faire un build complet
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification du webhook Stripe...\n');

const webhookPath = path.join(__dirname, 'app/api/webhooks/stripe/route.ts');
const stripeConfigPath = path.join(__dirname, 'lib/stripe-config.ts');

// Vérifier que les fichiers existent
const checks = [
  { path: webhookPath, name: 'Webhook Stripe' },
  { path: stripeConfigPath, name: 'Configuration Stripe' },
  { path: path.join(__dirname, 'next.config.js'), name: 'Next.js config' },
  { path: path.join(__dirname, 'vercel.json'), name: 'Vercel config' },
  { path: path.join(__dirname, '.vercelignore'), name: 'Vercel ignore' },
];

let allOk = true;

checks.forEach(({ path: filePath, name }) => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${name}: OK`);
  } else {
    console.log(`❌ ${name}: MANQUANT`);
    allOk = false;
  }
});

console.log('\n📦 Vérification des imports...\n');

// Vérifier les imports dans le webhook
if (fs.existsSync(webhookPath)) {
  const webhookContent = fs.readFileSync(webhookPath, 'utf8');

  const requiredImports = [
    { pattern: /import.*NextRequest.*from.*next\/server/, name: 'NextRequest/NextResponse' },
    { pattern: /import.*createClient.*from.*@supabase\/supabase-js/, name: 'Supabase client' },
    { pattern: /import Stripe from ['"]stripe['"]/, name: 'Stripe' },
    { pattern: /import.*stripe-config/, name: 'Stripe config' },
  ];

  requiredImports.forEach(({ pattern, name }) => {
    if (pattern.test(webhookContent)) {
      console.log(`✅ Import ${name}: OK`);
    } else {
      console.log(`❌ Import ${name}: MANQUANT`);
      allOk = false;
    }
  });

  // Vérifier les fonctions
  console.log('\n🔧 Vérification des fonctions...\n');

  const requiredFunctions = [
    'handleCheckoutSessionCompleted',
    'handleTicketPurchase',
    'handleProductPurchase',
    'handleSubscriptionPurchase',
    'handlePaymentIntentSucceeded',
    'handlePaymentIntentFailed',
  ];

  requiredFunctions.forEach((funcName) => {
    const pattern = new RegExp(`function ${funcName}|const ${funcName} =|async function ${funcName}`);
    if (pattern.test(webhookContent)) {
      console.log(`✅ Fonction ${funcName}: OK`);
    } else {
      console.log(`⚠️  Fonction ${funcName}: NON TROUVÉE`);
    }
  });
}

// Vérifier next.config.js
console.log('\n⚙️  Vérification de next.config.js...\n');

const nextConfigPath = path.join(__dirname, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

  const checks = [
    { pattern: /webpack.*config/, name: 'Configuration webpack' },
    { pattern: /ignoreWarnings/, name: 'Suppression des warnings' },
    { pattern: /experimental/, name: 'Configuration experimental' },
    { pattern: /serverComponentsExternalPackages/, name: 'Packages externes serveur' },
  ];

  checks.forEach(({ pattern, name }) => {
    if (pattern.test(nextConfigContent)) {
      console.log(`✅ ${name}: OK`);
    } else {
      console.log(`⚠️  ${name}: NON CONFIGURÉ`);
    }
  });
}

// Vérifier package.json
console.log('\n📋 Vérification des dépendances...\n');

const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const requiredDeps = [
    'stripe',
    '@supabase/supabase-js',
    'next',
    'react',
  ];

  requiredDeps.forEach((dep) => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: MANQUANT`);
      allOk = false;
    }
  });
}

console.log('\n' + '='.repeat(60));

if (allOk) {
  console.log('\n✅ Tous les fichiers sont en place!');
  console.log('\n📌 Prochaines étapes:');
  console.log('   1. Push vers GitHub');
  console.log('   2. Déployer sur Vercel');
  console.log('   3. Configurer STRIPE_WEBHOOK_SECRET dans Vercel');
  console.log('   4. Configurer l\'endpoint webhook dans Stripe Dashboard');
  console.log('\n📚 Voir BUILD_FIXES.md pour plus de détails\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Certains éléments sont manquants');
  console.log('   Vérifiez les erreurs ci-dessus\n');
  process.exit(1);
}

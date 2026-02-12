#!/usr/bin/env node

/**
 * Script de vérification pré-déploiement
 * Vérifie que tout est prêt pour Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification pré-déploiement...\n');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

// 1. Vérifier .env
console.log('📋 Vérification des variables d\'environnement...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    checks.passed.push('✅ NEXT_PUBLIC_SUPABASE_URL trouvée');
  } else {
    checks.failed.push('❌ NEXT_PUBLIC_SUPABASE_URL manquante');
  }

  if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    checks.passed.push('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY trouvée');
  } else {
    checks.failed.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY manquante');
  }
} else {
  checks.warnings.push('⚠️  Fichier .env non trouvé (OK pour Vercel)');
}

// 2. Vérifier vercel.json
console.log('\n📋 Vérification de vercel.json...');
const vercelPath = path.join(__dirname, '..', 'vercel.json');
if (fs.existsSync(vercelPath)) {
  checks.passed.push('✅ vercel.json trouvé');

  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  if (vercelConfig.build?.env?.NODE_OPTIONS) {
    checks.passed.push('✅ Configuration mémoire optimisée');
  }
} else {
  checks.failed.push('❌ vercel.json manquant');
}

// 3. Vérifier next.config.js
console.log('\n📋 Vérification de next.config.js...');
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  checks.passed.push('✅ next.config.js trouvé');
} else {
  checks.failed.push('❌ next.config.js manquant');
}

// 4. Vérifier package.json
console.log('\n📋 Vérification de package.json...');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  if (pkg.scripts?.build) {
    checks.passed.push('✅ Script build trouvé');
  } else {
    checks.failed.push('❌ Script build manquant');
  }

  if (pkg.dependencies?.['@supabase/supabase-js']) {
    checks.passed.push('✅ Supabase client installé');
  } else {
    checks.failed.push('❌ Supabase client manquant');
  }

  if (pkg.dependencies?.next) {
    checks.passed.push('✅ Next.js installé');
  } else {
    checks.failed.push('❌ Next.js manquant');
  }
} else {
  checks.failed.push('❌ package.json manquant');
}

// 5. Vérifier les fichiers critiques
console.log('\n📋 Vérification des fichiers critiques...');
const criticalFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/api/diagnostic/health/route.ts',
  'lib/supabase.ts',
  'components/AdvertisingTicker.tsx'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    checks.passed.push(`✅ ${file}`);
  } else {
    checks.failed.push(`❌ ${file} manquant`);
  }
});

// 6. Vérifier les migrations
console.log('\n📋 Vérification des migrations Supabase...');
const migrationsPath = path.join(__dirname, '..', 'supabase', 'migrations');
if (fs.existsSync(migrationsPath)) {
  const migrations = fs.readdirSync(migrationsPath);
  checks.passed.push(`✅ ${migrations.length} migrations trouvées`);

  const cacheFixMigration = migrations.find(m =>
    m.includes('fix_schema_cache_and_performance')
  );

  if (cacheFixMigration) {
    checks.passed.push('✅ Migration de cache trouvée');
  } else {
    checks.warnings.push('⚠️  Migration de cache non trouvée');
  }
} else {
  checks.warnings.push('⚠️  Dossier migrations non trouvé');
}

// 7. Vérifier la documentation
console.log('\n📋 Vérification de la documentation...');
const docs = [
  'VERCEL_DEPLOYMENT_READY.md',
  'CORRECTIONS_FINALES_04_FEV_2026.md',
  'README_DEPLOIEMENT_IMMEDIAT.md'
];

docs.forEach(doc => {
  const docPath = path.join(__dirname, '..', doc);
  if (fs.existsSync(docPath)) {
    checks.passed.push(`✅ ${doc}`);
  } else {
    checks.warnings.push(`⚠️  ${doc} manquant`);
  }
});

// Afficher le résumé
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ');
console.log('='.repeat(60));

console.log(`\n✅ Réussi: ${checks.passed.length}`);
checks.passed.forEach(check => console.log(`   ${check}`));

if (checks.warnings.length > 0) {
  console.log(`\n⚠️  Avertissements: ${checks.warnings.length}`);
  checks.warnings.forEach(check => console.log(`   ${check}`));
}

if (checks.failed.length > 0) {
  console.log(`\n❌ Échoué: ${checks.failed.length}`);
  checks.failed.forEach(check => console.log(`   ${check}`));
}

console.log('\n' + '='.repeat(60));

if (checks.failed.length === 0) {
  console.log('✅ PRÊT POUR DÉPLOIEMENT VERCEL');
  console.log('='.repeat(60));
  console.log('\nCommande de déploiement:');
  console.log('  vercel --prod');
  console.log('\nOu via Dashboard:');
  console.log('  https://vercel.com/new');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ DES PROBLÈMES ONT ÉTÉ DÉTECTÉS');
  console.log('='.repeat(60));
  console.log('\nCorrigez les erreurs avant de déployer.');
  console.log('');
  process.exit(1);
}

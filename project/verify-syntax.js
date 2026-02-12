const fs = require('fs');

console.log('🔍 VÉRIFICATION FINALE DES MODIFICATIONS\n');
console.log('======================================================================\n');

const files = [
  'components/ProviderMediaCarousel.tsx',
  'components/PlayoutMediaLibrary.tsx'
];

let allValid = true;

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;

    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;

    const balanced = openBraces === closeBraces;

    console.log('📁', file);
    console.log('   Lignes:', lines);
    console.log('   Accolades ouvertes:', openBraces);
    console.log('   Accolades fermées:', closeBraces);
    console.log('   Balance:', balanced ? '✅ Équilibré' : '❌ Déséquilibré');

    const hasImport = content.includes('handleImportYouTubeMetadata');
    const hasExtract = content.includes('extractYouTubeId');
    console.log('   handleImportYouTubeMetadata:', hasImport ? '✅' : '❌');
    console.log('   extractYouTubeId:', hasExtract ? '✅' : '❌');

    const extractCount = (content.match(/function extractYouTubeId/g) || []).length;
    const importCount = (content.match(/function handleImportYouTubeMetadata/g) || []).length;
    console.log('   Nombre de extractYouTubeId:', extractCount, extractCount === 1 ? '✅' : '❌ DUPLICATION');
    console.log('   Nombre de handleImport:', importCount, importCount === 1 ? '✅' : '❌ DUPLICATION');

    if (!balanced || extractCount !== 1 || importCount !== 1) {
      allValid = false;
    }

    console.log('');
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    allValid = false;
  }
});

console.log('======================================================================');
if (allValid) {
  console.log('✅ TOUS LES FICHIERS SONT VALIDES');
  console.log('✅ AUCUNE DUPLICATION');
  console.log('✅ PRÊT POUR VERCEL');
} else {
  console.log('❌ ERREURS DÉTECTÉES');
  process.exit(1);
}
console.log('======================================================================');

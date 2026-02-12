const fs = require('fs');

console.log('🔍 VÉRIFICATION DES API ROUTES\n');
console.log('======================================================================\n');

const apiRoutes = [
  'app/api/youtube/extract/route.ts',
  'app/api/radio/validate/route.ts'
];

let allValid = true;

apiRoutes.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;

    const hasExport = content.includes('export async function POST');
    const hasNextResponse = content.includes('NextResponse');
    const hasRuntime = content.includes('export const runtime');
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const balanced = openBraces === closeBraces;

    console.log('📁', file);
    console.log('   Lignes:', lines);
    console.log('   Export POST:', hasExport ? '✅' : '❌');
    console.log('   NextResponse:', hasNextResponse ? '✅' : '❌');
    console.log('   Runtime Edge:', hasRuntime ? '✅' : '❌');
    console.log('   Accolades:', balanced ? '✅ Équilibrées' : '❌ Déséquilibrées');

    if (!hasExport || !hasNextResponse || !balanced) {
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
  console.log('✅ TOUTES LES API ROUTES SONT VALIDES');
  console.log('✅ PRÊT POUR VERCEL');
} else {
  console.log('❌ ERREURS DÉTECTÉES');
  process.exit(1);
}
console.log('======================================================================');

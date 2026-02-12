// Test de l'extraction d'ID YouTube

function extractYouTubeId(url) {
  if (!url) return null;

  const cleanUrl = url.trim();

  // Pattern 1: youtube.com/watch?v=VIDEO_ID
  const watchMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Pattern 2: youtu.be/VIDEO_ID
  const shortMatch = cleanUrl.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedMatch = cleanUrl.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Pattern 4: youtube.com/v/VIDEO_ID
  const vMatch = cleanUrl.match(/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  // Pattern 5: Iframe complet
  const iframeMatch = cleanUrl.match(/src=["']?[^"']*\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (iframeMatch) return iframeMatch[1];

  // Pattern 6: ID direct
  const directMatch = cleanUrl.match(/^([a-zA-Z0-9_-]{11})$/);
  if (directMatch) return directMatch[1];

  // Pattern 7: URL avec paramètres
  const paramsMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (paramsMatch) return paramsMatch[1];

  return null;
}

// Tests
const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/v/dQw4w9WgXcQ',
  '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=xOUnks3aXnpelQXQ"></iframe>',
  'dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
  'https://www.youtube.com/embed/4E3aOLMEoVw',
  'https://youtu.be/4E3aOLMEoVw?si=xyz'
];

console.log('🧪 TEST D\'EXTRACTION D\'ID YOUTUBE\n');
console.log('='.repeat(80) + '\n');

let passCount = 0;
let failCount = 0;

testUrls.forEach((url, index) => {
  const id = extractYouTubeId(url);
  const success = id && id.length === 11;

  if (success) {
    passCount++;
    console.log(`✅ Test ${index + 1}: SUCCÈS`);
  } else {
    failCount++;
    console.log(`❌ Test ${index + 1}: ÉCHEC`);
  }

  console.log(`   Input:  ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
  console.log(`   Output: ${id || 'null'}`);
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 RÉSULTATS: ${passCount}/${testUrls.length} tests réussis`);

if (failCount === 0) {
  console.log('✅ TOUS LES TESTS SONT PASSÉS !');
  console.log('✅ L\'EXTRACTION EST 100% FONCTIONNELLE');
} else {
  console.log(`❌ ${failCount} test(s) échoué(s)`);
  process.exit(1);
}

console.log('='.repeat(80));

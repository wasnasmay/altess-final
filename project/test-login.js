// Script de test pour diagnostiquer le problème de connexion
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('🔍 Test de connexion pour imed.labidi@gmail.com\n');

  try {
    // 1. Test de connexion
    console.log('1️⃣ Tentative de connexion...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'imed.labidi@gmail.com',
      password: 'Admin123!' // À remplacer par le vrai mot de passe
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message);
      return;
    }

    console.log('✅ Connexion réussie!');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // 2. Test de récupération du profil
    console.log('\n2️⃣ Tentative de récupération du profil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur de récupération du profil:', profileError.message);
      console.error('   Details:', profileError);
      return;
    }

    if (!profile) {
      console.error('❌ Profil non trouvé pour cet utilisateur');
      return;
    }

    console.log('✅ Profil récupéré avec succès!');
    console.log('   Rôle:', profile.role);
    console.log('   Email:', profile.email);
    console.log('   Created:', profile.created_at);

    // 3. Déconnexion
    console.log('\n3️⃣ Déconnexion...');
    await supabase.auth.signOut();
    console.log('✅ Déconnexion réussie!');

    console.log('\n✅ Tous les tests sont passés avec succès!');
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
    console.error(error);
  }
}

testLogin();

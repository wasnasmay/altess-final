"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getRoleRedirectPath } from '@/lib/auth-utils';

type UserSpace = 'client' | 'partner' | 'organizer' | 'admin';

interface SpaceOption {
  value: UserSpace;
  label: string;
  description: string;
  roleMap: string;
}

const SPACE_OPTIONS: SpaceOption[] = [
  {
    value: 'client',
    label: 'Compte Personnel',
    description: 'Gérer mon profil, mes cours et billets',
    roleMap: 'client'
  },
  {
    value: 'partner',
    label: 'Compte Professionnel',
    description: 'Événements, Prestations et Bonnes Adresses',
    roleMap: 'partner'
  },
  {
    value: 'organizer',
    label: 'Organisateur d\'événements',
    description: 'Billetterie et gestion de mini-sites',
    roleMap: 'organizer'
  },
  {
    value: 'admin',
    label: 'Administration',
    description: 'Gestion de la plateforme',
    roleMap: 'admin'
  }
];

export default function LoginPage() {
  const [email, setEmail] = useState('imed.labidi@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<UserSpace>('admin');
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [canCreatePlaces, setCanCreatePlaces] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, signOut, user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirection automatique si l'utilisateur est déjà connecté (désactivée en mode inscription)
  useEffect(() => {
    if (!authLoading && !loading && !isSignUp && user && profile?.role) {
      console.log('User already logged in with role:', profile.role);
      // Ne pas rediriger automatiquement pour éviter les boucles
      // L'utilisateur peut cliquer sur "Accéder à mon espace" s'il veut
    }
  }, [authLoading, loading, isSignUp, user, profile]);

  // Handler pour rediriger vers le dashboard approprié
  const handleGoToDashboard = () => {
    if (profile?.role) {
      const redirectPath = getRoleRedirectPath(profile.role);
      router.push(redirectPath);
    }
  };

  // Handler pour déconnexion
  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    toast.success('Déconnexion réussie');
    setLoading(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Déconnecter toute session existante avant l'inscription
        if (user) {
          await signOut();
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        if (selectedSpace === 'partner' && !canCreateEvents && !canCreatePlaces) {
          toast.error('Veuillez sélectionner au moins une activité pour votre compte professionnel');
          setLoading(false);
          return;
        }

        // Déterminer le rôle en fonction du type d'espace sélectionné
        const spaceOption = SPACE_OPTIONS.find(s => s.value === selectedSpace);
        const role = spaceOption?.roleMap || 'client';

        console.log('Création du compte avec le rôle:', role);

        const { error } = await signUp(email, password);

        if (error) {
          console.error('Signup error:', error);
          toast.error(error.message || "Erreur lors de l'inscription");
          setLoading(false);
          return;
        }

        // Attendre un peu pour que l'authentification soit complète
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: { user: newUser }, error: getUserError } = await supabase.auth.getUser();

        if (getUserError) {
          console.error('Error getting user:', getUserError);
          toast.error('Erreur lors de la récupération du profil utilisateur');
          setLoading(false);
          return;
        }

        if (!newUser) {
          toast.error('Utilisateur non trouvé après inscription');
          setLoading(false);
          return;
        }

        console.log('Utilisateur créé:', newUser.id);
        console.log('Création du profil avec:', {
          id: newUser.id,
          email: newUser.email,
          role,
          can_create_events: selectedSpace === 'partner' ? canCreateEvents : selectedSpace === 'organizer' ? true : false,
          can_create_places: selectedSpace === 'partner' ? canCreatePlaces : false
        });

        // Créer le profil directement avec le bon rôle
        const { error: insertError, data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: newUser.id,
            email: newUser.email || email,
            role,
            can_create_events: selectedSpace === 'partner' ? canCreateEvents : selectedSpace === 'organizer' ? true : false,
            can_create_places: selectedSpace === 'partner' ? canCreatePlaces : false
          })
          .select()
          .single();

        console.log('Résultat de la création du profil:', { insertError, newProfile });

        if (insertError) {
          console.error('Error creating profile:', insertError);

          // Afficher une alerte persistante
          alert(`ERREUR: La création du profil a échoué.\n\nDétails: ${insertError.message}\n\nCode: ${insertError.code}\n\nHint: ${insertError.hint || 'N/A'}\n\nVeuillez contacter le support.`);

          toast.error(`Erreur lors de la création du profil: ${insertError.message}`, {
            duration: 10000
          });
          setLoading(false);
          return;
        }

        if (!newProfile) {
          console.error('Profil non créé');
          alert('ERREUR: Profil non créé.\n\nVeuillez contacter le support.');
          toast.error('Profil non créé');
          setLoading(false);
          return;
        }

        console.log('Profil créé avec succès:', newProfile);
        toast.success('Compte créé avec succès ! Redirection...', {
          duration: 2000
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        const redirectUrl = getRoleRedirectPath(role);
        router.push(redirectUrl);
      } else {
        console.log('Attempting to sign in with email:', email);
        const { error, role } = await signIn(email, password);

        if (error) {
          console.error('Sign in error:', error);
          let errorMessage = 'Erreur lors de la connexion';

          // Messages d'erreur plus clairs pour l'utilisateur
          if (error.message) {
            if (error.message.includes('Invalid login credentials')) {
              errorMessage = 'Email ou mot de passe incorrect';
            } else if (error.message.includes('Email not confirmed')) {
              errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
            } else if (error.message.includes('Unexpected failure')) {
              errorMessage = 'Erreur de connexion. Vérifiez que votre mot de passe est correct.';
            } else {
              errorMessage = error.message;
            }
          }

          console.error('Error message:', errorMessage);
          toast.error(errorMessage, { duration: 7000 });
          setLoading(false);
          return;
        }

        if (role) {
          console.log('Sign in successful, role:', role);
          toast.success('Connexion réussie ! Redirection...');
          await new Promise(resolve => setTimeout(resolve, 500));
          const redirectUrl = getRoleRedirectPath(role);
          console.log('Redirecting to:', redirectUrl);
          router.push(redirectUrl);
        } else {
          console.error('No role returned after sign in');
          toast.error('Impossible de récupérer le profil', { duration: 5000 });
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      const errorMessage = error?.message || 'Une erreur est survenue';
      toast.error(errorMessage, { duration: 5000 });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(217, 119, 6) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo ALTESS */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 relative w-48 h-48">
            <Image
              src="/image_(4).png"
              alt="ALTESS"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-gray-400 text-sm">Votre espace de connexion</p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-sm">
          {/* Already Logged In Section */}
          {!authLoading && user && profile && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="text-center space-y-3">
                <p className="text-amber-400 font-medium">
                  Vous êtes déjà connecté en tant que :
                </p>
                <p className="text-white font-semibold">
                  {SPACE_OPTIONS.find(s => s.roleMap === profile.role)?.label || profile.role}
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleGoToDashboard}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-lg transition-all"
                  >
                    Accéder à mon espace
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    Me déconnecter
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Space Selector Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="space" className="text-amber-400 font-medium">
                Type d'espace
              </Label>
              <Select
                value={selectedSpace}
                onValueChange={(value: UserSpace) => setSelectedSpace(value)}
                disabled={loading}
              >
                <SelectTrigger className="w-full h-auto min-h-[56px] bg-black border-amber-500/30 text-white hover:border-amber-500/50 transition-colors px-4 py-3">
                  <div className="flex flex-col items-start text-left w-full">
                    <div className="font-medium text-amber-400 text-sm">
                      {SPACE_OPTIONS.find(s => s.value === selectedSpace)?.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {SPACE_OPTIONS.find(s => s.value === selectedSpace)?.description}
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-black border-amber-500/30 z-[100000]">
                  {SPACE_OPTIONS.map((space) => (
                    <SelectItem
                      key={space.value}
                      value={space.value}
                      className="text-white hover:bg-amber-500/20 focus:bg-amber-500/20 cursor-pointer py-3 px-3"
                    >
                      <div className="flex flex-col">
                        <div className="font-medium text-amber-400 text-sm">{space.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{space.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-400 font-medium">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-12 bg-black border-amber-500/30 text-white placeholder-gray-600 focus:border-amber-500/50"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-400 font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  className="h-12 bg-black border-amber-500/30 text-white placeholder-gray-600 focus:border-amber-500/50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Partner Activity Selection */}
            {isSignUp && (selectedSpace === 'partner' || selectedSpace === 'organizer') && (
              <div className="space-y-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <Label className="text-amber-400 font-medium">
                  {selectedSpace === 'organizer'
                    ? 'Vos besoins en billetterie'
                    : 'Que souhaitez-vous proposer ?'}
                </Label>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="create-events"
                      checked={selectedSpace === 'organizer' ? true : canCreateEvents}
                      onCheckedChange={(checked) => setCanCreateEvents(checked as boolean)}
                      disabled={selectedSpace === 'organizer'}
                      className="border-amber-500/30 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="create-events"
                        className="text-sm font-medium text-white cursor-pointer"
                      >
                        Événements / Billetterie
                      </label>
                      <p className="text-xs text-gray-400 mt-1">
                        Organiser des événements, vendre des billets, scanner les QR codes
                      </p>
                    </div>
                  </div>

                  {selectedSpace === 'partner' && (
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="create-places"
                        checked={canCreatePlaces}
                        onCheckedChange={(checked) => setCanCreatePlaces(checked as boolean)}
                        className="border-amber-500/30 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="create-places"
                          className="text-sm font-medium text-white cursor-pointer"
                        >
                          Services / Bonnes Adresses
                        </label>
                        <p className="text-xs text-gray-400 mt-1">
                          Gérer une vitrine, prestations événementielles, statistiques
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {selectedSpace === 'partner' && (
                  <p className="text-xs text-amber-400/70 mt-2">
                    Vous pouvez sélectionner les deux options si vous proposez plusieurs types de services
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : isSignUp ? (
                'Créer mon compte'
              ) : (
                'Se connecter'
              )}
            </button>


            {/* Toggle Sign Up / Sign In */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
              >
                {isSignUp
                  ? 'Déjà un compte ? Se connecter'
                  : 'Pas encore de compte ? S\'inscrire'}
              </button>
            </div>

            {/* Back to Home */}
            <div className="text-center pt-2 border-t border-amber-500/20">
              <Link
                href="/"
                className="text-gray-400 hover:text-amber-400 text-sm transition-colors inline-block mt-4"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </form>
        </div>

        {/* Info Text */}
        <p className="text-center text-xs text-gray-600 mt-6">
          En vous connectant, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  );
}

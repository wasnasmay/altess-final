'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Lock, User, Mail, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProfileSettingsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile data
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [user, profile, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!currentPassword) {
      toast.error('Veuillez entrer votre mot de passe actuel');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setPasswordLoading(true);
    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Mot de passe modifié avec succès');

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPasswordLoading(false);
    }
  };

  const validatePasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (password.length < 8) return { strength: 0, label: 'Trop court', color: 'text-red-500' };
    if (strength === 1) return { strength: 1, label: 'Faible', color: 'text-orange-500' };
    if (strength === 2) return { strength: 2, label: 'Moyen', color: 'text-yellow-500' };
    if (strength === 3) return { strength: 3, label: 'Bon', color: 'text-blue-500' };
    return { strength: 4, label: 'Excellent', color: 'text-green-500' };
  };

  const passwordStrength = newPassword ? validatePasswordStrength(newPassword) : null;

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header />

      <div className="container mx-auto px-4 py-12 mt-20">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Paramètres du profil</h1>
            <p className="text-gray-400">Gérez vos informations personnelles et votre sécurité</p>
          </div>

          <div className="grid gap-6">
            {/* Profile Information */}
            <Card className="bg-black/40 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <User className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Informations personnelles</CardTitle>
                    <CardDescription className="text-gray-400">
                      Modifiez vos informations de profil
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-500" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="bg-gray-800/50 border-gray-700 text-gray-400"
                    />
                    <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-500" />
                      Nom complet
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-amber-500" />
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      'Mettre à jour le profil'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="bg-black/40 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Lock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Sécurité</CardTitle>
                    <CardDescription className="text-gray-400">
                      Modifiez votre mot de passe
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-white">
                      Mot de passe actuel
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                        placeholder="Entrez votre mot de passe actuel"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white">
                      Nouveau mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                        placeholder="Minimum 8 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordStrength && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.strength
                                  ? passwordStrength.strength === 1
                                    ? 'bg-red-500'
                                    : passwordStrength.strength === 2
                                    ? 'bg-orange-500'
                                    : passwordStrength.strength === 3
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                  : 'bg-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${passwordStrength.color}`}>
                          Force: {passwordStrength.label}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Le mot de passe doit contenir: majuscules, minuscules, chiffres et caractères spéciaux
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                        placeholder="Confirmez votre nouveau mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Modification...
                      </>
                    ) : (
                      'Changer le mot de passe'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

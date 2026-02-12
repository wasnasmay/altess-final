'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Building2, MapPin, CreditCard, ArrowRight, ArrowLeft, Check,
  Sparkles, Palette, Phone, Mail, Upload, Building, Landmark,
  FileText, Globe, User, Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CityAutocomplete } from '@/components/CityAutocomplete';

const STEPS = [
  {
    id: 1,
    title: 'Vous',
    subtitle: 'Votre identité',
    icon: User,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    title: 'Organisation',
    subtitle: 'Votre marque',
    icon: Building,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 3,
    title: 'Coordonnées',
    subtitle: 'Votre siège',
    icon: MapPin,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    id: 4,
    title: 'Comptabilité',
    subtitle: 'Vos paiements',
    icon: CreditCard,
    gradient: 'from-amber-500 to-orange-500'
  }
];

interface OnboardingData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  logoUrl: string;
  brandColor: string;
  email: string;
  phone: string;
  website: string;
  headquartersAddress: string;
  headquartersCity: string;
  headquartersPostalCode: string;
  headquartersCountry: string;
  iban: string;
  vatNumber: string;
  companyRegistration: string;
  aboutText: string;
}

export default function OrganizerOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    jobTitle: '',
    companyName: '',
    logoUrl: '',
    brandColor: '#F59E0B',
    email: '',
    phone: '',
    website: '',
    headquartersAddress: '',
    headquartersCity: '',
    headquartersPostalCode: '',
    headquartersCountry: 'France',
    iban: '',
    vatNumber: '',
    companyRegistration: '',
    aboutText: ''
  });

  const progress = (currentStep / STEPS.length) * 100;

  const markFieldTouched = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  const getFieldError = (fieldName: string): string | null => {
    if (!touchedFields.has(fieldName)) return null;

    switch (fieldName) {
      case 'firstName':
        return !formData.firstName.trim() ? 'Le prénom est requis' : null;
      case 'lastName':
        return !formData.lastName.trim() ? 'Le nom est requis' : null;
      case 'jobTitle':
        return !formData.jobTitle.trim() ? 'La fonction est requise' : null;
      case 'companyName':
        return !formData.companyName.trim() ? 'Le nom de l\'organisation est requis' : null;
      case 'headquartersAddress':
        return !formData.headquartersAddress.trim() ? 'L\'adresse est requise' : null;
      case 'headquartersCity':
        return !formData.headquartersCity.trim() ? 'La ville est requise' : null;
      case 'headquartersPostalCode':
        return !formData.headquartersPostalCode.trim() ? 'Le code postal est requis' : null;
      case 'email':
        return !formData.email.trim() ? 'L\'email est requis' : null;
      case 'iban':
        return !formData.iban.trim() ? 'L\'IBAN est requis' : null;
      default:
        return null;
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName.trim() &&
               formData.lastName.trim() &&
               formData.jobTitle.trim();
      case 2:
        return formData.companyName.trim() && formData.brandColor;
      case 3:
        return formData.headquartersAddress.trim() &&
               formData.headquartersCity.trim() &&
               formData.headquartersPostalCode.trim() &&
               formData.email.trim();
      case 4:
        return formData.iban.trim();
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length && canGoNext()) {
      setCurrentStep(currentStep + 1);
    } else if (!canGoNext()) {
      toast.error('Champs requis manquants', {
        description: 'Veuillez remplir tous les champs obligatoires'
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async () => {
    if (!canGoNext()) {
      toast.error('Formulaire incomplet');
      return;
    }

    setLoading(true);

    try {
      if (!userId) {
        toast.error('Session expirée');
        router.push('/login');
        return;
      }

      const slug = generateSlug(formData.companyName);

      const { data: existingOrg } = await supabase
        .from('event_organizers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingOrg) {
        const { error: updateError } = await supabase
          .from('event_organizers')
          .update({
            company_name: formData.companyName,
            slug,
            logo_url: formData.logoUrl || null,
            brand_color: formData.brandColor,
            email: formData.email,
            phone: formData.phone || null,
            website: formData.website || null,
            headquarters_address: formData.headquartersAddress,
            headquarters_city: formData.headquartersCity,
            headquarters_postal_code: formData.headquartersPostalCode,
            headquarters_country: formData.headquartersCountry,
            iban: formData.iban,
            vat_number: formData.vatNumber || null,
            company_registration: formData.companyRegistration || null,
            about_text: formData.aboutText || null,
            onboarding_completed: true,
            onboarding_step: 4,
            contact_email: formData.email,
            contact_phone: formData.phone || null
          })
          .eq('id', existingOrg.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('event_organizers')
          .insert({
            user_id: userId,
            company_name: formData.companyName,
            slug,
            logo_url: formData.logoUrl || null,
            brand_color: formData.brandColor,
            email: formData.email,
            phone: formData.phone || null,
            website: formData.website || null,
            headquarters_address: formData.headquartersAddress,
            headquarters_city: formData.headquartersCity,
            headquarters_postal_code: formData.headquartersPostalCode,
            headquarters_country: formData.headquartersCountry,
            iban: formData.iban,
            vat_number: formData.vatNumber || null,
            company_registration: formData.companyRegistration || null,
            about_text: formData.aboutText || null,
            onboarding_completed: true,
            onboarding_step: 4,
            status: 'active',
            verified: false,
            contact_email: formData.email,
            contact_phone: formData.phone || null
          });

        if (insertError) throw insertError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'organizer',
          first_name: formData.firstName,
          last_name: formData.lastName,
          job_title: formData.jobTitle,
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone || null
        })
        .eq('id', userId);

      if (profileError) console.error('Profile update error:', profileError);

      toast.success(`Bienvenue, ${formData.firstName} ! 🎉`, {
        description: 'Votre compte organisateur est prêt'
      });

      setTimeout(() => {
        router.push('/organizer-dashboard-premium');
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Erreur', {
        description: 'Impossible de finaliser l\'inscription'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-6 shadow-2xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">
            Créez votre espace
          </h1>
          <p className="text-slate-400 text-lg">
            Une plateforme premium pour gérer vos événements
          </p>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${
                      currentStep >= step.id
                        ? `bg-gradient-to-br ${step.gradient} text-white shadow-lg`
                        : currentStep > step.id
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-8 h-8" />
                    ) : (
                      <step.icon className="w-8 h-8" />
                    )}
                  </div>
                  <div className="text-center mt-3">
                    <p className={`text-sm font-bold ${
                      currentStep >= step.id ? 'text-white' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${
                      currentStep >= step.id ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {step.subtitle}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 rounded-full ${
                    currentStep > step.id
                      ? `bg-gradient-to-r ${STEPS[index + 1].gradient}`
                      : 'bg-slate-800'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <Progress value={progress} className="h-3 bg-slate-800 rounded-full" />
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8 md:p-12">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${STEPS[0].gradient} mb-4`}>
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Qui êtes-vous ?</h2>
                  <p className="text-slate-400">Commençons par vous connaître</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="first-name" className="text-white font-semibold text-lg flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-400" />
                      Prénom *
                    </Label>
                    <Input
                      id="first-name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      onBlur={() => markFieldTouched('firstName')}
                      placeholder="Ex: Jean"
                      className={`mt-3 h-14 text-lg bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 ${
                        getFieldError('firstName') ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {getFieldError('firstName') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('firstName')}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="last-name" className="text-white font-semibold text-lg flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-400" />
                      Nom *
                    </Label>
                    <Input
                      id="last-name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      onBlur={() => markFieldTouched('lastName')}
                      placeholder="Ex: Dupont"
                      className={`mt-3 h-14 text-lg bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 ${
                        getFieldError('lastName') ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {getFieldError('lastName') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('lastName')}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="job-title" className="text-white font-semibold text-lg flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
                      Votre fonction *
                    </Label>
                    <Input
                      id="job-title"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      onBlur={() => markFieldTouched('jobTitle')}
                      placeholder="Ex: Directeur événementiel, Organisateur..."
                      className={`mt-3 h-14 text-lg bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 ${
                        getFieldError('jobTitle') ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {getFieldError('jobTitle') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('jobTitle')}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Votre rôle dans l'organisation
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${STEPS[1].gradient} mb-4`}>
                    <Building className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {formData.firstName ? `Content de vous voir parmi nous, ${formData.firstName} !` : 'Votre organisation'}
                  </h2>
                  <p className="text-slate-400">Créez votre image de marque</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="company-name" className="text-white font-semibold text-lg flex items-center">
                      <Building className="w-5 h-5 mr-2 text-purple-400" />
                      Nom de votre organisation *
                    </Label>
                    <Input
                      id="company-name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      onBlur={() => markFieldTouched('companyName')}
                      placeholder="Ex: Événements Premium Paris"
                      className={`mt-3 h-14 text-lg bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 ${
                        getFieldError('companyName') ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {getFieldError('companyName') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('companyName')}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Ce nom apparaîtra partout : dashboard, boutique, tickets...
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="about" className="text-white font-semibold text-lg flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-400" />
                      Présentation (optionnel)
                    </Label>
                    <Textarea
                      id="about"
                      value={formData.aboutText}
                      onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                      placeholder="Décrivez votre activité, votre expertise..."
                      className="mt-3 min-h-[100px] bg-black border-slate-700 text-white placeholder:text-slate-500"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="logo" className="text-white font-semibold text-lg flex items-center">
                      <Upload className="w-5 h-5 mr-2 text-purple-400" />
                      Logo (URL) - Optionnel
                    </Label>
                    <Input
                      id="logo"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://exemple.com/logo.png"
                      className="mt-3 h-14 bg-black border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {formData.logoUrl && (
                      <div className="mt-4 p-4 bg-white rounded-xl w-32 h-32 flex items-center justify-center">
                        <img
                          src={formData.logoUrl}
                          alt="Logo preview"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="color" className="text-white font-semibold text-lg flex items-center">
                      <Palette className="w-5 h-5 mr-2 text-purple-400" />
                      Couleur de marque *
                    </Label>
                    <div className="flex items-center gap-4 mt-3">
                      <input
                        id="color"
                        type="color"
                        value={formData.brandColor}
                        onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                        className="w-24 h-14 rounded-xl cursor-pointer border-2 border-slate-700"
                      />
                      <div className="flex-1">
                        <Input
                          value={formData.brandColor}
                          onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                          className="h-14 bg-black border-slate-700 text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="mt-4 p-6 rounded-xl" style={{ background: `linear-gradient(135deg, ${formData.brandColor} 0%, ${formData.brandColor}80 100%)` }}>
                      <p className="text-white font-semibold text-center">Aperçu de votre couleur</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${STEPS[2].gradient} mb-4`}>
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {formData.firstName ? `Parfait ${formData.firstName}, où êtes-vous basé ?` : 'Vos coordonnées'}
                  </h2>
                  <p className="text-slate-400">Adresse de votre siège social</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-300 text-sm flex items-start gap-3">
                      <Building className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>
                        Cette adresse est pour la <strong>facturation et comptabilité</strong>.
                        L'adresse de vos événements sera demandée lors de leur création.
                      </span>
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="hq-address" className="text-white font-semibold text-lg flex items-center">
                      <Building className="w-5 h-5 mr-2 text-emerald-400" />
                      Adresse du siège *
                    </Label>
                    <Input
                      id="hq-address"
                      value={formData.headquartersAddress}
                      onChange={(e) => setFormData({ ...formData, headquartersAddress: e.target.value })}
                      onBlur={() => markFieldTouched('headquartersAddress')}
                      placeholder="123 Avenue des Champs-Élysées"
                      className={`mt-3 h-14 bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 ${
                        getFieldError('headquartersAddress') ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {getFieldError('headquartersAddress') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('headquartersAddress')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="hq-city" className="text-white font-semibold">Ville *</Label>
                      <CityAutocomplete
                        value={formData.headquartersCity}
                        onChange={(city) => {
                          setFormData({ ...formData, headquartersCity: city });
                          if (city.trim()) {
                            markFieldTouched('headquartersCity');
                          }
                        }}
                        className="mt-3 h-14 bg-black border-slate-700 text-white"
                      />
                      {getFieldError('headquartersCity') && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError('headquartersCity')}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="hq-postal" className="text-white font-semibold">Code postal *</Label>
                      <Input
                        id="hq-postal"
                        value={formData.headquartersPostalCode}
                        onChange={(e) => setFormData({ ...formData, headquartersPostalCode: e.target.value })}
                        onBlur={() => markFieldTouched('headquartersPostalCode')}
                        placeholder="75008"
                        maxLength={5}
                        className={`mt-3 h-14 bg-black border-slate-700 text-white ${
                          getFieldError('headquartersPostalCode') ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      {getFieldError('headquartersPostalCode') && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError('headquartersPostalCode')}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hq-country" className="text-white font-semibold text-lg flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-emerald-400" />
                      Pays
                    </Label>
                    <Input
                      id="hq-country"
                      value={formData.headquartersCountry}
                      onChange={(e) => setFormData({ ...formData, headquartersCountry: e.target.value })}
                      className="mt-3 h-14 bg-black border-slate-700 text-white"
                    />
                  </div>

                  <div className="border-t border-slate-800 pt-6">
                    <h3 className="text-white font-semibold text-lg mb-4">Contact</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-white font-semibold flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-emerald-400" />
                          Email professionnel *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          onBlur={() => markFieldTouched('email')}
                          className={`mt-2 h-12 bg-black border-slate-700 text-white ${
                            getFieldError('email') ? 'border-red-500' : ''
                          }`}
                          required
                        />
                        {getFieldError('email') && (
                          <p className="text-red-500 text-sm mt-1">{getFieldError('email')}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-white font-semibold flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                          Téléphone
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="06 12 34 56 78"
                          className="mt-2 h-12 bg-black border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website" className="text-white font-semibold flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-emerald-400" />
                          Site web
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://monsite.fr"
                          className="mt-2 h-12 bg-black border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${STEPS[3].gradient} mb-4`}>
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {formData.firstName ? `Dernière étape ${formData.firstName} !` : 'Comptabilité'}
                  </h2>
                  <p className="text-slate-400">Informations pour vos paiements</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-300 text-sm flex items-start gap-3">
                      <Landmark className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>
                        Ces informations sont <strong>essentielles pour recevoir vos paiements</strong>.
                        Vos virements seront automatisés après chaque événement.
                      </span>
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="iban" className="text-white font-semibold text-lg flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-amber-400" />
                      IBAN (Compte bancaire) *
                    </Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                      placeholder="FR76 1234 5678 9012 3456 7890 123"
                      className="mt-3 h-14 bg-black border-slate-700 text-white font-mono text-lg placeholder:text-slate-500 focus:border-amber-500 transition-all"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Format: FR + 25 chiffres (espaces optionnels)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="vat" className="text-white font-semibold text-lg flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-amber-400" />
                      Numéro de TVA intracommunautaire
                    </Label>
                    <Input
                      id="vat"
                      value={formData.vatNumber}
                      onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value.toUpperCase() })}
                      placeholder="FR12345678901"
                      className="mt-3 h-14 bg-black border-slate-700 text-white font-mono placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Obligatoire si vous êtes assujetti à la TVA
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="registration" className="text-white font-semibold text-lg flex items-center">
                      <Building className="w-5 h-5 mr-2 text-amber-400" />
                      SIRET / SIREN
                    </Label>
                    <Input
                      id="registration"
                      value={formData.companyRegistration}
                      onChange={(e) => setFormData({ ...formData, companyRegistration: e.target.value })}
                      placeholder="123 456 789 00010"
                      className="mt-3 h-14 bg-black border-slate-700 text-white font-mono placeholder:text-slate-500"
                    />
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mt-8">
                    <h3 className="text-green-300 font-bold text-lg mb-3 flex items-center">
                      <Check className="w-5 h-5 mr-2" />
                      Presque terminé !
                    </h3>
                    <ul className="space-y-2 text-sm text-green-200">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-green-400" />
                        <span>Votre profil sera créé automatiquement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-green-400" />
                        <span>Votre boutique en ligne sera accessible via: <strong>/boutique/{generateSlug(formData.companyName || 'mon-organisation')}</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-green-400" />
                        <span>Vous pourrez créer vos événements immédiatement</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-slate-800">
              {!canGoNext() && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-400 text-sm">
                    Veuillez remplir tous les champs obligatoires marqués d'un astérisque (*) pour continuer
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1}
                  className="h-14 px-8 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Retour
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    onClick={goToNextStep}
                    disabled={!canGoNext()}
                    className={`h-14 px-12 text-lg font-bold text-black bg-gradient-to-r ${STEPS[currentStep - 1].gradient} hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-xl`}
                  >
                    Continuer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !canGoNext()}
                  className="h-14 px-12 text-lg font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-2xl shadow-green-500/50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Finalisation...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Finaliser mon espace
                    </>
                  )}
                </Button>
              )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Vos données sont sécurisées et ne seront jamais partagées
          </p>
        </div>
      </div>
    </div>
  );
}

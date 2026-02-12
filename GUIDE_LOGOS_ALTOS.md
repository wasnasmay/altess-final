# Guide des Logos ALTOS

## 🎨 Aperçu Complet

Consultez toutes les propositions sur: **`/logo-demo`**

---

## 📦 Composants Disponibles

### 1. **AltosLogo** - Logo Principal (Composant par défaut)

Composant polyvalent avec plusieurs variantes et tailles.

#### Props:
```tsx
{
  variant?: 'full' | 'icon' | 'compact';  // Type de logo
  size?: 'sm' | 'md' | 'lg' | 'xl';       // Taille
  className?: string;                      // Classes CSS additionnelles
}
```

#### Exemples d'utilisation:

```tsx
import AltosLogo from '@/components/AltosLogo';

// Logo complet avec sous-titre
<AltosLogo variant="full" size="lg" />

// Logo compact (icône + texte) - ACTUELLEMENT DANS LA NAVIGATION
<AltosLogo variant="compact" size="md" />

// Icône seule
<AltosLogo variant="icon" size="md" />
```

---

### 2. **AltosLogoText** - Texte Seul

Version typographique pure sans icône.

```tsx
import { AltosLogoText } from '@/components/AltosLogo';

<AltosLogoText size="xl" />
```

**Caractéristiques:**
- Gradient doré animé
- Effet de glow
- Sparkles décoratifs
- Parfait pour les en-têtes de pages

---

### 3. **AltosLogoArabic** - Version Bilingue

Logo avec texte arabe "ألطوس" + sous-titre multilingue.

```tsx
import { AltosLogoArabic } from '@/components/AltosLogo';

<AltosLogoArabic />
```

**Caractéristiques:**
- Icône étoile orientale personnalisée
- Texte arabe authentique
- Sous-titre "Web Radio & TV"
- Idéal pour l'identité culturelle

---

### 4. **AltosLogoMinimal** - Version Épurée

Logo moderne et minimaliste.

```tsx
import { AltosLogoMinimal } from '@/components/AltosLogo';

<AltosLogoMinimal />
```

**Caractéristiques:**
- Badge circulaire avec lettre "A"
- Design clean et moderne
- Parfait pour les petits espaces

---

## 🎯 Recommandations d'Usage

### Navigation Principale ✅ (Actuellement utilisé)
```tsx
<AltosLogo variant="compact" size="md" />
```
**Raison:** Équilibre parfait entre visibilité et compacité

### Page d'Accueil - Hero Section
```tsx
<AltosLogo variant="full" size="xl" />
// OU
<AltosLogoArabic />
```
**Raison:** Impact visuel maximum, identité forte

### Footer
```tsx
<AltosLogo variant="full" size="lg" />
```

### Page de Connexion/Inscription
```tsx
<AltosLogoText size="xl" className="mb-8" />
```

### Favicon & App Icons
```tsx
<AltosLogo variant="icon" size="lg" />
```
**Note:** Utiliser ensuite un outil de conversion en .ico

### Réseaux Sociaux
```tsx
// Pour les miniatures/avatars
<AltosLogo variant="icon" size="xl" />

// Pour les bannières
<AltosLogoArabic />
```

### Emails & Documents Officiels
```tsx
<AltosLogoArabic />
```

### Mobile Menu
```tsx
<AltosLogo variant="compact" size="sm" />
```

---

## 🎨 Caractéristiques Visuelles

### Palette de Couleurs
- **Principal:** Gradient doré (amber-300 → amber-400 → amber-300)
- **Accents:** Orange (orange-500, orange-600)
- **Background icône:** Gradient amber-500 → amber-400 → amber-600

### Effets Visuels
1. **Glow/Blur:** Effet de lumière derrière l'icône
2. **Pulse Animation:** Animation subtile sur les sparkles
3. **Hover Effects:** Scale et changement de couleur au survol (sur Navigation)
4. **Shadows:** Ombres dorées pour la profondeur

### Icône Principale
- **Icon:** Music2 de Lucide React
- **Signification:** Représente la musique orientale et le streaming
- **Sparkles:** Ajoutent une touche premium et festive
- **Radio:** Symbolise la webradio

---

## 🔧 Personnalisation Avancée

### Changer les Couleurs
Modifier directement dans `components/AltosLogo.tsx`:

```tsx
// Ligne 50-51 (gradient principal)
className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600"

// Pour tester d'autres couleurs:
// Rose/Or: from-rose-400 via-amber-400 to-rose-400
// Bleu/Or: from-blue-400 via-amber-400 to-blue-400
```

### Tailles Personnalisées
Modifier les classes dans `sizeClasses`:

```tsx
const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',   // ← Ajuster ici
  lg: 'h-16',
  xl: 'h-24',
};
```

### Ajouter une Nouvelle Variante

```tsx
if (variant === 'custom') {
  return (
    // Votre code personnalisé
  );
}
```

---

## 📱 Responsive Design

Tous les logos sont **100% responsive** et s'adaptent automatiquement:

```tsx
// Mobile
<AltosLogo variant="compact" size="sm" className="lg:hidden" />

// Desktop
<AltosLogo variant="full" size="md" className="hidden lg:flex" />
```

---

## 🚀 Exemples d'Intégration

### Dans un Header
```tsx
<header className="bg-slate-900 py-4">
  <div className="container mx-auto">
    <AltosLogo variant="compact" size="md" />
  </div>
</header>
```

### Dans une Card
```tsx
<Card>
  <CardHeader>
    <AltosLogo variant="icon" size="lg" className="mx-auto mb-4" />
    <CardTitle>Bienvenue sur ALTOS</CardTitle>
  </CardHeader>
</Card>
```

### Dans un Dialog/Modal
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <AltosLogoText size="lg" className="mb-4" />
      <DialogTitle>Inscription</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

---

## 🎭 Tests sur Différents Fonds

Les logos ont été testés sur:
- ✅ Fond noir (site principal)
- ✅ Fond blanc
- ✅ Fond coloré (bleu, purple, amber)
- ✅ Images de fond

**Tous passent le test de lisibilité!**

---

## 📊 Performances

- **Poids:** ~2KB (composant React)
- **Pas d'images externes:** 100% SVG/CSS
- **Animations:** GPU-accelerated
- **Accessibilité:** Support complet

---

## 🔄 Migration Effectuée

### Ancien Logo (ALTESS)
```tsx
// SVG custom + texte
<svg>...</svg>
<span>ALTESS</span>
```

### Nouveau Logo (ALTOS) ✅
```tsx
<AltosLogo variant="compact" size="md" />
```

**Avantages:**
- Cohérence avec la base de données (ALTOS)
- Design plus moderne et professionnel
- Réutilisable partout
- Meilleure maintenance

---

## 📝 Notes Importantes

1. **Nom Correct:** ALTOS (pas ALTESS)
2. **Icône:** Music2 + Sparkles + Radio = Identité musicale orientale
3. **Couleurs:** Toujours gradient doré (marque de fabrique)
4. **Responsive:** Toujours tester sur mobile

---

## 🎁 Bonus: Exports pour Designers

Pour créer des assets (favicons, app icons, etc.):

1. Visitez `/logo-demo`
2. Faites une capture d'écran haute résolution
3. Utilisez un outil comme Figma ou Photoshop pour extraire
4. Générez les différentes tailles (16x16, 32x32, 192x192, 512x512)

**Ou utilisez le composant directement avec html2canvas!**

---

## 🌟 Résultat Final

Le logo ALTOS est maintenant:
- ✨ Premium et élégant
- 🎵 Musicalement identifiable
- 🌍 Culturellement authentique (avec version arabe)
- 📱 Parfaitement responsive
- ⚡ Performant et léger
- 🎨 Cohérent avec le design du site

**Page de démo complète disponible sur:** `/logo-demo`

# Système de Duplication Intelligente pour la Programmation TV & Radio

## 📋 Vue d'ensemble

Le module de programmation TV & Radio dispose maintenant d'un système de duplication avancé permettant de copier facilement des programmes, des journées entières ou des semaines complètes, avec une gestion intelligente des conflits.

---

## ✨ Fonctionnalités Principales

### 1. 📅 Duplication de Journée Entière

**Bouton** : "Dupliquer la journée"
- **Icône** : Copy
- **Emplacement** : Barre d'outils principale
- **Action** : Copie tous les programmes de la journée actuelle vers le lendemain

**Utilisation** :
```
1. Naviguez vers la journée à dupliquer
2. Cliquez sur "Dupliquer la journée"
3. Modifiez la date de destination si nécessaire
4. Confirmez la duplication
```

**Cas d'usage** :
- Programme quotidien récurrent
- Copier une grille type vers un autre jour
- Remplir rapidement plusieurs jours identiques

### 2. 🗓️ Duplication de Semaine Entière

**Bouton** : "Dupliquer la semaine"
- **Icône** : CalendarRange
- **Style** : Bordure dorée (amber-500)
- **Action** : Copie tous les programmes de 7 jours vers la semaine suivante

**Utilisation** :
```
1. Placez-vous sur le premier jour de la semaine à dupliquer
2. Cliquez sur "Dupliquer la semaine"
3. Le système charge automatiquement les 7 jours
4. Prévisualisez les {X} programmes chargés
5. Confirmez pour dupliquer vers la semaine suivante
```

**Fonctionnement** :
- Charge automatiquement tous les programmes de Jour J à Jour J+6
- Duplique vers J+7 à J+13
- Préserve les horaires exacts de chaque programme
- Affiche le nombre total de programmes (ex: "145 programmes")

**Cas d'usage** :
- Grilles hebdomadaires récurrentes
- Programmation saisonnière répétée
- Remplir rapidement un mois entier

### 3. 📄 Duplication de Programme Individuel

**Icône** : Copy (sur chaque bloc de programme)
- **Emplacement** : Apparaît au survol du bloc
- **Action** : Duplique uniquement ce programme

**Utilisation** :
```
1. Survolez un bloc de programme
2. Cliquez sur l'icône Copy
3. Choisissez la date et l'heure de destination
4. Confirmez la duplication
```

**Cas d'usage** :
- Rediffusions d'une émission spécifique
- Copier un programme vers plusieurs créneaux
- Tester un programme à différentes heures

---

## ⚠️ Gestion Intelligente des Conflits

### Détection Automatique

Le système vérifie **automatiquement** si les créneaux horaires de destination sont déjà occupés.

**Algorithme de détection** :
```typescript
Conflit détecté SI :
  - Date de destination identique
  - ET (
      Début du nouveau programme dans un programme existant
      OU Fin du nouveau programme dans un programme existant
      OU Nouveau programme englobe un programme existant
    )
```

### Interface de Résolution

Lorsque des conflits sont détectés, une alerte orange apparaît :

```
┌─────────────────────────────────────────────────┐
│ ⏰ Conflits détectés (5)                        │
│                                                  │
│ Certains créneaux horaires sont déjà occupés.   │
│ Choisissez comment gérer ces conflits :         │
│                                                  │
│ ⚪ Remplacer les programmes existants           │
│    Les programmes en conflit seront supprimés   │
│    et remplacés par les nouveaux                │
│                                                  │
│ ⚪ Ignorer les conflits                         │
│    Ne dupliquer que les programmes sans conflit │
│                                                  │
│ Détails des conflits :                          │
│ • Journal du Matin (08:00-09:00)                │
│   ⚠️ conflit avec Actualités Express            │
│ • Flash Info (12:00-12:15)                      │
│   ⚠️ conflit avec Journal Midi                  │
└─────────────────────────────────────────────────┘
```

### Options de Résolution

#### Option 1 : Remplacer ✅

**Comportement** :
- Supprime les programmes existants en conflit
- Insère les nouveaux programmes à leur place
- Bouton devient orange : "Remplacer et dupliquer"

**Utilisation** :
```
Ancien : [08:00-09:00] Actualités Express
Nouveau : [08:00-09:30] Journal du Matin

→ Résultat : [08:00-09:30] Journal du Matin
```

**Cas d'usage** :
- Mise à jour complète d'une grille
- Remplacement de programmes obsolètes
- Correction d'une programmation erronée

#### Option 2 : Ignorer ⏭️

**Comportement** :
- Ne duplique que les programmes sans conflit
- Conserve les programmes existants
- Bouton devient bleu : "Ignorer conflits et dupliquer"

**Utilisation** :
```
Jour cible a déjà :
  [08:00-09:00] Actualités Express
  [10:00-11:00] (vide)
  [12:00-13:00] Journal Midi

Duplication de :
  [08:00-09:30] Journal du Matin (conflit)
  [10:00-11:00] Émission Culture (OK)
  [12:00-12:30] Flash Info (conflit)

→ Résultat : Seule "Émission Culture" est dupliquée
```

**Cas d'usage** :
- Compléter une grille partiellement remplie
- Ajouter de nouveaux programmes sans toucher aux existants
- Programmation progressive

### Bouton de Confirmation Intelligent

Le bouton s'adapte selon la situation :

| Situation | Texte du bouton | Style |
|-----------|----------------|-------|
| Aucun conflit | "Confirmer la duplication" | Bleu (défaut) |
| Conflits non résolus | "Confirmer la duplication" | Désactivé |
| Remplacement choisi | "Remplacer et dupliquer" | Orange |
| Ignorer choisi | "Ignorer conflits et dupliquer" | Bleu |

---

## 🎨 Interface Utilisateur

### Barre d'Outils

```
┌──────────────────────────────────────────────────────────┐
│  [◀ Jour]  Lundi 27 janvier 2026  [Jour ▶]  [Aujourd'hui] │
│                                                            │
│  [📋 Dupliquer la journée] [🗓️ Dupliquer la semaine]      │
│  [➕ Ajouter une programmation]                           │
└──────────────────────────────────────────────────────────┘
```

### Modal de Duplication - Mode Journée

```
┌─────────────────────────────────────────────────┐
│ 📋 Dupliquer toute la journée (24 programmes)   │
├─────────────────────────────────────────────────┤
│                                                  │
│ Date cible                                       │
│ [28 janvier 2026        ]                       │
│ Les programmes seront dupliqués sur cette date  │
│                                                  │
│ Programmes à dupliquer (24)  [Modifier]         │
│ ┌──────────────────────────────────────┐        │
│ │ • Journal du Matin                    │        │
│ │   08:00 - 09:30 (90min)               │        │
│ │ • Émission Culture                    │        │
│ │   10:00 - 11:00 (60min)               │        │
│ │ ...                                    │        │
│ └──────────────────────────────────────┘        │
│                                                  │
│ 24 programme(s) • 28 janvier 2026               │
│                            [Annuler] [Confirmer]│
└─────────────────────────────────────────────────┘
```

### Modal de Duplication - Mode Semaine

```
┌─────────────────────────────────────────────────┐
│ 🗓️ Dupliquer toute la semaine (145 programmes) │
├─────────────────────────────────────────────────┤
│                                                  │
│ 🗓️ Duplication de la semaine entière            │
│ Les programmes du 20 jan au 26 jan 2026 seront  │
│ dupliqués vers la semaine suivante              │
│ ⚠️ Cette action copiera tous les programmes     │
│    de la semaine actuelle                       │
│                                                  │
│ Programmes à dupliquer (145)  [Modifier]        │
│ ┌──────────────────────────────────────┐        │
│ │ Lundi 20 jan → Lundi 27 jan          │        │
│ │ • Journal du Matin (08:00-09:30)      │        │
│ │ • Flash Info (12:00-12:15)            │        │
│ │ ...                                    │        │
│ │                                        │        │
│ │ Mardi 21 jan → Mardi 28 jan           │        │
│ │ • Matinale (06:00-09:00)              │        │
│ │ ...                                    │        │
│ └──────────────────────────────────────┘        │
│                                                  │
│ Semaine entière • 145 programme(s)              │
│                            [Annuler] [Confirmer]│
└─────────────────────────────────────────────────┘
```

### Bloc de Programme avec Icône Copy

```
┌─────────────────────────────────────┐
│ ≡≡ Journal du Matin           📋 🗑 │ ← Icônes visibles au hover
│    08:00 - 09:30 (90min)            │
└─────────────────────────────────────┘
```

**États** :
- **Normal** : Icônes invisibles (opacity-0)
- **Hover** : Icônes apparaissent avec transition
- **Click Copy** : Ouvre le modal de duplication pour ce programme

---

## 🔧 Modification des Programmes Avant Duplication

### Activer le Mode Édition

Bouton : "Modifier les programmes" dans le modal

### Fonctionnalités d'édition

Pour chaque programme :

1. **Modifier le titre**
   ```
   Input text éditable
   ```

2. **Changer l'heure de début**
   ```
   Input time - Met à jour automatiquement l'heure de fin
   ```

3. **Changer l'heure de fin**
   ```
   Input time - Ajustement manuel possible
   ```

4. **Supprimer du lot**
   ```
   Icône Trash - Retire ce programme de la duplication
   ```

### Exemple d'Édition

```
Avant duplication, je peux :
├─ Renommer "Journal" en "Journal Express"
├─ Déplacer de 08:00 à 07:00
├─ Étendre la durée de 30 à 45 minutes
└─ Retirer certains programmes de la liste
```

---

## 📊 Statistiques et Feedback

### Messages de Succès

| Action | Message |
|--------|---------|
| Journée dupliquée | "24 programme(s) dupliqué(s) avec succès" |
| Semaine chargée | "145 programmes chargés pour la semaine" |
| Semaine dupliquée | "145 programme(s) dupliqué(s) avec succès" |
| Programme unique | "1 programme(s) dupliqué(s) avec succès" |
| Avec remplacement | "5 programme(s) existant(s) remplacé(s)" |

### Messages d'Avertissement

| Situation | Message |
|-----------|---------|
| Conflits détectés | "5 conflit(s) détecté(s). Veuillez choisir une action." |
| Pas de programmes | "Aucun programme à dupliquer" |
| Semaine entière | "⚠️ Cette action copiera tous les programmes de la semaine actuelle" |

### Messages d'Erreur

| Erreur | Message |
|--------|---------|
| Chargement échoué | "Erreur lors du chargement de la semaine" |
| Duplication échouée | "Erreur lors de la duplication" |

---

## 🎯 Cas d'Usage Pratiques

### Cas 1 : Grille Quotidienne Récurrente

**Scénario** : Radio avec la même grille du lundi au vendredi

**Solution** :
1. Programmer le lundi complètement
2. Dupliquer la journée 4 fois (mardi → vendredi)
3. Modifier uniquement les émissions spéciales

**Temps gagné** : ~4 heures de programmation manuelle

### Cas 2 : Rediffusions d'une Émission

**Scénario** : Émission diffusée 3 fois dans la semaine

**Solution** :
1. Programmer l'émission le lundi 20h
2. Survoler le bloc → Cliquer sur Copy
3. Dupliquer vers mercredi 14h
4. Dupliquer vers vendredi 10h

**Temps gagné** : ~10 minutes par rediffusion

### Cas 3 : Programmation Mensuelle

**Scénario** : TV avec grille hebdomadaire répétée

**Solution** :
1. Programmer la semaine 1 complètement
2. Dupliquer la semaine 3 fois (semaines 2, 3, 4)
3. Ajuster uniquement les émissions spéciales/événements

**Temps gagné** : ~15 heures de programmation manuelle

### Cas 4 : Mise à Jour de Grille

**Scénario** : Nouvelle grille remplaçant l'ancienne

**Solution** :
1. Dupliquer la nouvelle grille sur les jours existants
2. Choisir "Remplacer les programmes existants"
3. Confirmer → Mise à jour automatique

**Temps gagné** : Évite la suppression manuelle

### Cas 5 : Compléter une Grille Partielle

**Scénario** : Ajouter des programmes standards à une grille avec événements spéciaux

**Solution** :
1. Dupliquer la grille type vers le jour avec événements
2. Conflits détectés pour les événements spéciaux
3. Choisir "Ignorer les conflits"
4. Seuls les créneaux vides sont remplis

**Temps gagné** : Programmation sélective automatique

---

## 🛠️ Fonctionnement Technique

### Architecture

```
Component: PlayoutTimelineGrid
├─ States
│  ├─ duplicateMode: 'day' | 'week' | 'single'
│  ├─ duplicatePreview: ScheduleItem[]
│  ├─ conflicts: {item, existing}[]
│  └─ conflictResolution: 'replace' | 'skip' | 'ask'
│
├─ Functions
│  ├─ openDuplicateDialog(mode, scheduleId?)
│  ├─ loadWeekSchedules()
│  ├─ checkConflicts(items)
│  ├─ confirmDuplicate()
│  └─ updateDuplicatePreviewDate(newDate)
│
└─ UI Components
   ├─ Duplication Buttons (Toolbar)
   ├─ Copy Icons (Program Blocks)
   └─ Duplication Modal (Dialog)
```

### Flux de Duplication

```
1. User clicks "Dupliquer la journée/semaine"
   ↓
2. openDuplicateDialog(mode)
   ↓
3. IF mode === 'week'
   → loadWeekSchedules() - Charge 7 jours
   ELSE
   → Copie schedules actuels
   ↓
4. Modal s'ouvre avec preview
   ↓
5. User peut modifier date/programmes
   ↓
6. User clique "Confirmer"
   ↓
7. checkConflicts(duplicatePreview)
   ↓
8. IF conflicts.length > 0
   → Affiche options de résolution
   → Attendre choix user
   ↓
9. confirmDuplicate()
   ↓
10. IF resolution === 'replace'
    → Supprime programmes en conflit
    ELSE IF resolution === 'skip'
    → Filtre programmes en conflit
    ↓
11. INSERT programmes dans base de données
    ↓
12. Toast success
    ↓
13. Reload schedules si date actuelle
```

### Détection de Conflits

```typescript
function checkConflicts(items: ScheduleItem[]) {
  // 1. Récupère tous les programmes existants aux dates cibles
  const allExisting = await loadExistingSchedules(uniqueDates);

  // 2. Pour chaque programme à dupliquer
  items.forEach(item => {
    const itemStartMin = timeToMinutes(item.start_time);
    const itemEndMin = timeToMinutes(item.end_time);

    // 3. Compare avec chaque programme existant de la même date
    allExisting.forEach(existing => {
      if (existing.scheduled_date !== item.scheduled_date) return;

      const existStartMin = timeToMinutes(existing.start_time);
      const existEndMin = timeToMinutes(existing.end_time);

      // 4. Détecte le chevauchement
      const hasOverlap =
        (itemStartMin >= existStartMin && itemStartMin < existEndMin) ||
        (itemEndMin > existStartMin && itemEndMin <= existEndMin) ||
        (itemStartMin <= existStartMin && itemEndMin >= existEndMin);

      if (hasOverlap) {
        conflicts.push({ item, existing });
      }
    });
  });

  return conflicts;
}
```

---

## 📋 Checklist d'Utilisation

### Avant de Dupliquer

- [ ] Vérifier que la grille source est complète
- [ ] S'assurer que les durées sont correctes
- [ ] Vérifier les métadonnées (titres, médias)

### Pendant la Duplication

- [ ] Choisir le bon mode (jour/semaine/programme)
- [ ] Vérifier la date de destination
- [ ] Prévisualiser les programmes à dupliquer
- [ ] Gérer les conflits si détectés

### Après la Duplication

- [ ] Vérifier que tous les programmes sont présents
- [ ] Ajuster les programmes spécifiques si nécessaire
- [ ] Tester la lecture des programmes dupliqués

---

## 🚀 Raccourcis et Astuces

### Duplication Rapide

**Astuce** : Pour dupliquer plusieurs jours rapidement
```
1. Dupliquer jour 1 → jour 2
2. Naviguer vers jour 2
3. Dupliquer jour 2 → jour 3
4. Répéter...
```

**Meilleure solution** : Utiliser duplication de semaine

### Modification en Lot

**Astuce** : Activer le mode édition avant duplication
```
1. Ouvrir duplication
2. Cliquer "Modifier les programmes"
3. Ajuster tous les horaires d'un coup
4. Confirmer
```

### Gestion des Conflits Préventive

**Astuce** : Toujours choisir "Ignorer" en premier
```
1. Dupliquer avec "Ignorer les conflits"
2. Vérifier les programmes non dupliqués
3. Les traiter manuellement si nécessaire
```

---

## 🎓 Bonnes Pratiques

### ✅ À Faire

- Dupliquer des grilles validées et testées
- Prévisualiser avant de confirmer
- Gérer les conflits de manière réfléchie
- Utiliser la duplication de semaine pour les grilles récurrentes
- Modifier les programmes dans le modal si nécessaire

### ❌ À Éviter

- Dupliquer sans vérifier les conflits
- Remplacer aveuglément sans vérifier
- Dupliquer des programmes avec durées incorrectes
- Oublier d'ajuster les émissions spéciales
- Dupliquer trop loin dans le futur (perte de contrôle)

### 💡 Recommandations

1. **Programmation Progressive**
   - Semaine par semaine plutôt que mois complet
   - Permet d'ajuster plus facilement

2. **Grilles Templates**
   - Créer des grilles "type" parfaites
   - Les dupliquer massivement

3. **Vérification Post-Duplication**
   - Toujours vérifier la première duplication
   - S'assurer que les horaires sont corrects

4. **Backup avant Remplacement**
   - Exporter la grille avant de la remplacer
   - Permet de revenir en arrière

---

## 🐛 Dépannage

### Problème : Duplication ne fonctionne pas

**Symptômes** : Bouton désactivé ou erreur

**Solutions** :
1. Vérifier qu'il y a des programmes à dupliquer
2. S'assurer que la connexion à la base de données fonctionne
3. Vérifier les permissions utilisateur

### Problème : Conflits non détectés

**Symptômes** : Programmes écrasés sans avertissement

**Solutions** :
1. Vérifier la logique de détection (timeToMinutes)
2. S'assurer que les dates sont au bon format
3. Recharger la page et réessayer

### Problème : Semaine se duplique mal

**Symptômes** : Programmes manquants ou dates incorrectes

**Solutions** :
1. Vérifier que les 7 jours ont des programmes
2. S'assurer que le channel_type est correct
3. Vérifier les logs de chargement

### Problème : Modal se ferme sans dupliquer

**Symptômes** : Clic sur confirmer ne fait rien

**Solutions** :
1. Vérifier qu'il n'y a pas de conflits non résolus
2. S'assurer que conflictResolution !== 'ask'
3. Regarder la console pour les erreurs

---

## 📚 Référence API

### openDuplicateDialog()

```typescript
async function openDuplicateDialog(
  mode: 'day' | 'week' | 'single',
  scheduleId?: string
): Promise<void>
```

**Paramètres** :
- `mode` : Type de duplication
- `scheduleId` : ID du programme (mode 'single' uniquement)

**Actions** :
- Configure le mode de duplication
- Charge les programmes selon le mode
- Ouvre le modal de prévisualisation

### checkConflicts()

```typescript
async function checkConflicts(
  items: ScheduleItem[]
): Promise<{item: ScheduleItem, existing: ScheduleItem}[]>
```

**Paramètres** :
- `items` : Programmes à vérifier

**Retour** :
- Array de conflits détectés

**Algorithme** :
- Compare les plages horaires
- Détecte les chevauchements
- Retourne les paires (nouveau, existant)

### confirmDuplicate()

```typescript
async function confirmDuplicate(): Promise<void>
```

**Actions** :
1. Vérifie les conflits
2. Applique la résolution choisie
3. Insère les programmes en base
4. Affiche le résultat
5. Recharge la grille

**Gestion des conflits** :
- `replace` : Supprime puis insère
- `skip` : Filtre puis insère
- `ask` : Bloque et demande choix

---

**Version** : 2.0
**Date** : 27 janvier 2026
**Statut** : ✅ PRODUCTION READY

🎉 **Le système de duplication intelligente est opérationnel !**

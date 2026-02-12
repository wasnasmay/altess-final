# SOLUTION DÉFINITIVE - Erreur "table not found"

**Date** : 5 Février 2026  
**Erreur** : "❌ ERREUR SQL: Could not find the table 'public.playout_schedules' in the schema cache"

---

## ❌ PROBLÈME

Lorsque vous essayez d'ajouter un programme au planning, vous obtenez :

```
Erreur: ❌ ERREUR SQL: Could not find the table 
'public.playout_schedules' in the schema cache
```

**Cause** : La table `playout_schedules` n'existe pas dans votre base Supabase.

Le code a été corrigé pour utiliser `playout_schedules` (avec 's'), mais la table n'a jamais été créée dans Supabase.

---

## ✅ SOLUTION : Appliquer la migration

### Étape 1 : Aller sur Supabase

1. Connectez-vous sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Allez dans **SQL Editor** (menu de gauche)

---

### Étape 2 : Copier le SQL

Copiez tout le contenu du fichier :
```
supabase/migrations/20260205155440_sync_playout_system_complete.sql
```

Ou copiez directement ce SQL complet :

```sql
-- ================================================
-- 1. PLAYOUT_CHANNELS
-- ================================================

CREATE TABLE IF NOT EXISTS playout_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('tv', 'radio', 'web')),
  is_active boolean DEFAULT true,
  auto_advance boolean DEFAULT true,
  current_item_id uuid,
  status text DEFAULT 'off_air' CHECK (status IN ('on_air', 'off_air', 'standby')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_channels_status ON playout_channels(status, is_active);
CREATE INDEX IF NOT EXISTS idx_playout_channels_type ON playout_channels(type);

ALTER TABLE playout_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view channels" ON playout_channels;
CREATE POLICY "Public can view channels" ON playout_channels FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert channels" ON playout_channels;
CREATE POLICY "Public can insert channels" ON playout_channels FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update channels" ON playout_channels;
CREATE POLICY "Public can update channels" ON playout_channels FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ================================================
-- 2. PLAYOUT_MEDIA_LIBRARY
-- ================================================

CREATE TABLE IF NOT EXISTS playout_media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('video', 'audio', 'jingle', 'ad', 'live')),
  category text,
  media_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  file_size_mb numeric,
  metadata jsonb DEFAULT '{}',
  tags text[],
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_media_type ON playout_media_library(type, is_active);
CREATE INDEX IF NOT EXISTS idx_playout_media_category ON playout_media_library(category);
CREATE INDEX IF NOT EXISTS idx_playout_media_tags ON playout_media_library USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_playout_media_created ON playout_media_library(created_at DESC);

ALTER TABLE playout_media_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view media" ON playout_media_library;
CREATE POLICY "Public can view media" ON playout_media_library FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert media" ON playout_media_library;
CREATE POLICY "Public can insert media" ON playout_media_library FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update media" ON playout_media_library;
CREATE POLICY "Public can update media" ON playout_media_library FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete media" ON playout_media_library;
CREATE POLICY "Public can delete media" ON playout_media_library FOR DELETE TO public USING (true);

-- ================================================
-- 3. PLAYOUT_SCHEDULES
-- ================================================

CREATE TABLE IF NOT EXISTS playout_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES playout_channels(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES playout_media_library(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  scheduled_datetime timestamptz NOT NULL,
  duration_seconds integer NOT NULL,
  order_position integer NOT NULL DEFAULT 0,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'playing', 'completed', 'cancelled', 'error')),
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_schedules_channel ON playout_schedules(channel_id, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_playout_schedules_date ON playout_schedules(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_playout_schedules_status ON playout_schedules(status);
CREATE INDEX IF NOT EXISTS idx_playout_schedules_order ON playout_schedules(channel_id, scheduled_date, order_position);

ALTER TABLE playout_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view schedules" ON playout_schedules;
CREATE POLICY "Public can view schedules" ON playout_schedules FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert schedules" ON playout_schedules;
CREATE POLICY "Public can insert schedules" ON playout_schedules FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update schedules" ON playout_schedules;
CREATE POLICY "Public can update schedules" ON playout_schedules FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete schedules" ON playout_schedules;
CREATE POLICY "Public can delete schedules" ON playout_schedules FOR DELETE TO public USING (true);

-- ================================================
-- 4. DONNÉES DE TEST
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM playout_channels WHERE type = 'tv') THEN
    INSERT INTO playout_channels (name, type, is_active, status)
    VALUES ('Web TV', 'tv', true, 'on_air');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM playout_channels WHERE type = 'radio') THEN
    INSERT INTO playout_channels (name, type, is_active, status)
    VALUES ('Web Radio', 'radio', true, 'on_air');
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
```

---

### Étape 3 : Exécuter le SQL

1. Dans le **SQL Editor** de Supabase
2. Créez une nouvelle requête (New Query)
3. Collez tout le SQL ci-dessus
4. Cliquez sur **Run** (ou Ctrl+Enter)

**Résultat attendu** :
```
Success. No rows returned
```

---

### Étape 4 : Vérifier la création

Dans le SQL Editor, exécutez :

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'playout%'
ORDER BY table_name;
```

**Résultat attendu** :
```
playout_channels
playout_media_library
playout_schedules
```

---

### Étape 5 : Vérifier les canaux

```sql
-- Voir les canaux créés
SELECT id, name, type, is_active, status 
FROM playout_channels;
```

**Résultat attendu** :
```
Web TV    | tv    | true | on_air
Web Radio | radio | true | on_air
```

---

## 🧪 TESTER L'AJOUT DE PROGRAMME

### Test 1 : Rechargez la page

1. Allez sur `/playout/schedule`
2. Rechargez la page (F5 ou Ctrl+R)
3. Vérifiez qu'il n'y a plus d'erreur au chargement

---

### Test 2 : Ajouter un programme

1. Sélectionnez un canal (Web TV)
2. Choisissez une date (aujourd'hui)
3. Cliquez sur "Ajouter un média"
4. Sélectionnez une vidéo
5. Cliquez sur "Ajouter au planning"

**Résultat attendu** :
```
✅ Programme ajouté avec succès
```

Le programme devrait apparaître dans la liste.

---

### Test 3 : Vérifier dans la base

Dans Supabase SQL Editor :

```sql
-- Voir les programmes ajoutés
SELECT 
  ps.id,
  ps.scheduled_date,
  ps.scheduled_time,
  ps.duration_seconds,
  ps.status,
  pc.name as channel_name,
  pm.title as media_title
FROM playout_schedules ps
JOIN playout_channels pc ON ps.channel_id = pc.id
JOIN playout_media_library pm ON ps.media_id = pm.id
ORDER BY ps.scheduled_datetime DESC
LIMIT 10;
```

Vous devriez voir vos programmes programmés.

---

## 📋 CE QUI A ÉTÉ CRÉÉ

### Tables créées : 3

1. **playout_channels**
   - Stocke les canaux (TV, Radio)
   - 2 canaux créés par défaut : Web TV et Web Radio

2. **playout_media_library**
   - Bibliothèque de médias (vidéos, audios)
   - Vide au départ (vous ajoutez via l'interface)

3. **playout_schedules**
   - Planning de diffusion
   - Vide au départ (vous programmez via l'interface)

### Sécurité (RLS)

- ✅ RLS activé sur les 3 tables
- ✅ Policies publiques permissives (développement)
- ✅ SELECT, INSERT, UPDATE, DELETE autorisés

**Note** : En production, il faudra restreindre l'accès aux admins authentifiés.

---

## 🚀 APRÈS LA MIGRATION

### Ce qui fonctionne maintenant :

1. ✅ **Programmation**
   - Ajouter des programmes au planning
   - Sélectionner la date et l'heure
   - Auto-programmation disponible

2. ✅ **Affichage**
   - Page principale affiche "Programme en cours"
   - "Programme à venir" visible
   - Vidéos se chargent correctement

3. ✅ **Duplication**
   - Dupliquer un programme
   - Dupliquer une journée
   - Dupliquer une semaine

4. ✅ **Gestion**
   - Déplacer les programmes
   - Supprimer des programmes
   - Modifier l'ordre

---

## ⚠️ IMPORTANT

### Si vous aviez des programmes dans l'ancienne table

Si vous aviez programmé des choses avant et qu'elles étaient dans `playout_schedule` (sans 's'), vous pouvez les migrer :

```sql
-- Migrer depuis l'ancienne table (si elle existe)
INSERT INTO playout_schedules (
  channel_id, 
  media_id, 
  scheduled_date, 
  scheduled_time, 
  scheduled_datetime,
  duration_seconds, 
  order_position, 
  status, 
  created_by
)
SELECT 
  (SELECT id FROM playout_channels WHERE type = 'tv' LIMIT 1) as channel_id,
  media_id,
  scheduled_date,
  start_time as scheduled_time,
  (scheduled_date || ' ' || start_time)::timestamptz as scheduled_datetime,
  COALESCE(duration_seconds, 180) as duration_seconds,
  row_number() OVER (PARTITION BY scheduled_date ORDER BY start_time) as order_position,
  status,
  created_by
FROM playout_schedule
WHERE NOT EXISTS (
  SELECT 1 FROM playout_schedules 
  WHERE playout_schedules.media_id = playout_schedule.media_id
    AND playout_schedules.scheduled_date = playout_schedule.scheduled_date
);
```

---

## 💡 RÉSUMÉ

**Problème** : Table `playout_schedules` introuvable  
**Solution** : Exécuter la migration SQL dans Supabase  
**Résultat** : 3 tables créées avec RLS  
**Temps** : ~2 minutes  

**Actions** :
1. ✅ Copier le SQL
2. ✅ Ouvrir SQL Editor sur Supabase
3. ✅ Coller et exécuter
4. ✅ Vérifier avec les requêtes de test
5. ✅ Tester l'ajout de programme

**Date** : 5 Février 2026  
**Fichier migration** : `supabase/migrations/20260205155440_sync_playout_system_complete.sql`  
**Status** : ✅ SOLUTION PRÊTE  

---

# Système de Proxy Stream Radio - Architecture Anti-Coupure

## Vue d'ensemble

Le système de streaming radio utilise une architecture en trois couches pour garantir une diffusion stable et sans interruption :

### 1. Edge Function Proxy (`stream-radio-proxy`)

**Localisation :** `supabase/functions/stream-radio-proxy/index.ts`

**Fonctionnalités :**
- Proxy côté serveur pour tous les flux radio
- Reconnexion automatique transparente (5 tentatives)
- Backoff exponentiel : 1s → 2s → 4s → 8s → 16s
- Gestion des erreurs DNS, CORS et Mixed Content
- Streaming en chunks avec keep-alive
- Headers optimisés pour compatibilité maximale

**Avantages :**
- ✅ Résout les problèmes CORS définitivement
- ✅ Gère HTTP/HTTPS automatiquement
- ✅ Récupération automatique en cas de déconnexion
- ✅ Les erreurs 404 sont gérées côté serveur
- ✅ Connexion persistante avec le flux source

### 2. Lecteur Audio Client

**Localisation :** `app/page.tsx`

**Configuration du Buffer :**
```javascript
audio.preload = 'auto';  // Buffer automatique ~10 secondes
audio.crossOrigin = 'anonymous';
```

**Système de Reconnexion Client :**
- Détection automatique des erreurs (error, ended, stalled)
- 5 tentatives de reconnexion maximum
- Backoff exponentiel : 1s → 2s → 4s → 8s → 10s (max)
- Reset automatique du stream en cas d'échec
- Monitoring du buffer en temps réel

**Event Listeners :**
- `canplay` : Stream prêt, reset des tentatives
- `error` : Déclenchement reconnexion automatique
- `ended` : Reconnexion si fin inattendue
- `stalled` : Rechargement après 2s
- `waiting` : Log de buffering
- `progress` : Monitoring du buffer (<2s = warning)

### 3. Flux de Données

```
┌─────────────────┐
│  Radio Stream   │ (HTTP/HTTPS externe)
│  Source (Hit    │
│  Radio, etc.)   │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────────────┐
│  Edge Function: stream-radio-proxy              │
│  • Fetch avec keep-alive                        │
│  • Auto-reconnect (5x avec backoff)             │
│  • Streaming transparent                        │
│  • Gestion erreurs DNS/CORS/404                 │
└────────┬────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────┐
│  Navigateur Client                              │
│  • Audio element avec preload='auto'            │
│  • Buffer ~10 secondes                          │
│  • Reconnexion locale (5x avec backoff)         │
│  • Monitoring buffer en temps réel              │
└─────────────────────────────────────────────────┘
```

## Gestion des Pannes

### Scénario 1 : Perte de connexion Internet (Client)

**Détection :** Event `error` ou `stalled`

**Action :**
1. Tentative 1 après 1 seconde
2. Tentative 2 après 2 secondes
3. Tentative 3 après 4 secondes
4. Tentative 4 après 8 secondes
5. Tentative 5 après 10 secondes
6. Arrêt après 5 échecs

**Résultat :** Reprise automatique dès que la connexion revient

### Scénario 2 : Le flux radio tombe (Source externe)

**Détection :** Edge function reçoit une erreur 404/500

**Action (Edge Function) :**
1. Tentative 1 après 1 seconde
2. Tentative 2 après 2 secondes
3. Tentative 3 après 4 secondes
4. Tentative 4 après 8 secondes
5. Tentative 5 après 16 secondes

**Résultat :** Le client ne voit rien, reconnexion transparente

### Scénario 3 : Buffer vide (Buffering)

**Détection :** Event `waiting` ou buffer < 2s

**Action :**
1. Log du buffering
2. Le navigateur gère automatiquement
3. Si stalled > 2s, rechargement forcé

**Résultat :** Reprise fluide dès que le buffer se remplit

### Scénario 4 : Changement de station

**Action :**
1. Reset des tentatives de reconnexion
2. Arrêt des timeouts en cours
3. Chargement du nouveau flux via proxy
4. Lecture immédiate

**Résultat :** Transition rapide et propre

## Configuration Optimale

### Variables d'Environnement

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Paramètres Audio (Recommandés)

```javascript
// Buffer maximum (~10 secondes)
audio.preload = 'auto';

// CORS
audio.crossOrigin = 'anonymous';

// Volume
audio.volume = 0.0 - 1.0;

// Reconnexion
maxReconnectAttempts = 5;
```

## Monitoring et Logs

### Logs Console (Production Ready)

**Connexion réussie :**
```
🔗 Using robust proxy stream: https://...
📡 Loading radio stream...
✅ Radio stream ready to play - Buffer: ~10s
▶️ Radio is playing
```

**Reconnexion automatique :**
```
❌ Radio stream error: {...}
🔄 Connection lost, attempting to reconnect...
🔄 Auto-reconnecting 1/5 in 1000ms...
✅ Reconnection successful! Stream restored.
```

**Buffer bas :**
```
⚠️ Low buffer detected: 1.2s
```

**Échec définitif :**
```
❌ Max reconnection attempts reached. Stream may be offline.
```

## Performance

### Latence

- **Première connexion :** ~2-3 secondes
- **Changement de station :** ~1-2 secondes
- **Reconnexion auto :** ~1-5 secondes (selon tentative)

### Bande Passante

- **Flux audio :** ~128 kbps (typique)
- **Buffer :** ~160 KB pour 10 secondes
- **Overhead proxy :** <5%

### Compatibilité

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (desktop + mobile)
- ✅ Opera
- ✅ Brave

## Maintenance

### Vérifier le statut de l'Edge Function

```bash
# Via Supabase Dashboard
https://app.supabase.com/project/[PROJECT]/functions

# Logs en temps réel
[Proxy] Connecting to stream: https://...
[Proxy] Connected successfully. Content-Type: audio/mpeg
[Proxy] Stream ended, attempting reconnection...
```

### Dépannage

**Problème :** Aucun son

**Solutions :**
1. Vérifier les variables d'environnement
2. Tester l'Edge Function directement
3. Vérifier les logs console
4. Tester le flux source directement

**Problème :** Coupures fréquentes

**Solutions :**
1. Vérifier la qualité du flux source
2. Augmenter maxReconnectAttempts à 10
3. Vérifier la connexion Internet du serveur
4. Contacter le fournisseur du flux

## Améliorations Futures

### Court Terme

- [ ] Métriques de qualité de streaming
- [ ] Dashboard de monitoring des flux
- [ ] Cache des métadonnées

### Long Terme

- [ ] Support HLS/DASH
- [ ] Streaming adaptatif (qualité variable)
- [ ] CDN pour les flux populaires
- [ ] Fallback sur flux secondaires

## Support

Pour toute question ou problème :
- Vérifier les logs console
- Consulter les logs Edge Function
- Tester avec curl : `curl -I "https://your-project.supabase.co/functions/v1/stream-radio-proxy?url=STREAM_URL"`

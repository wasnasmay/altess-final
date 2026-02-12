# 📡 SYSTÈME DE PROXY RADIO COMPLET

## Vue d'ensemble

Le système de proxy radio transforme TOUS les flux audio (HTTP/HTTPS) en flux HTTPS sécurisés et résout les problèmes de CORS, Mixed Content et restrictions mobiles.

## Architecture

```
Station Radio (HTTP/HTTPS)
         ↓
Edge Function Proxy (stream-radio-proxy)
         ↓
Client (HTTPS sécurisé)
```

## Fonctionnalités

### 1. Transformation SSL/HTTPS
- Tous les flux HTTP sont transformés en HTTPS
- Élimine les erreurs "Mixed Content"
- Sécurise la connexion

### 2. Résolution CORS
- En-têtes CORS configurés sur le proxy
- `Access-Control-Allow-Origin: *`
- Supporte Range, streaming continu

### 3. Identity Mobile
- User-Agent aléatoire (iPhone, Android, iPad)
- Contourne les restrictions "mobile-only"
- Débloque les flux locaux/régionaux

### 4. Suivi des Redirections
- `redirect: 'follow'` automatique
- Gère les redirections 301/302
- Stable sur les CDN

### 5. Reconnexion Automatique
- Retry avec backoff exponentiel
- 5 tentatives maximum
- Buffer de 10 secondes

## Utilisation

### Edge Function
```typescript
// URL du flux à proxifier
const streamUrl = 'http://station-radio.com/stream';

// URL proxifiée
const proxiedUrl = `${SUPABASE_URL}/functions/v1/stream-radio-proxy?url=${encodeURIComponent(streamUrl)}`;
```

### Client (React)
```typescript
function getProxiedStreamUrl(streamUrl: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const encodedUrl = encodeURIComponent(streamUrl);
  return `${baseUrl}/functions/v1/stream-radio-proxy?url=${encodedUrl}`;
}

// Utilisation
audio.src = getProxiedStreamUrl(station.streamUrl);
```

## Affichage sur Fond d'Écran Bleu

Les métadonnées (titre, artiste, artwork) s'affichent automatiquement sur le fond d'écran dynamique :

```tsx
{radioMetadata.title && (
  <div className="mt-4 bg-black/40 backdrop-blur-sm rounded-xl px-6 py-4">
    <p className="text-amber-400 font-semibold text-xl">
      {radioMetadata.title}
    </p>
    <p className="text-gray-300 text-base">
      {radioMetadata.artist}
    </p>
  </div>
)}
```

## Configuration des Stations

Les stations sont gérées dans `/admin/radio-stations` :

```typescript
{
  name: "Radio Orient",
  streamUrl: "http://radioorient.ice.infomaniak.ch/radioorient-128.mp3",
  logo: "https://...",
  is_active: true
}
```

## Flux Supportés

- ✅ MP3 Streams (Icecast/Shoutcast)
- ✅ AAC Streams
- ✅ HLS Streams (.m3u8)
- ✅ HTTP/HTTPS
- ✅ Redirections
- ✅ Mobile-only streams

## Métadonnées Live

Le système récupère automatiquement :
- Titre de la chanson
- Artiste
- Album
- Artwork
- Station

Rafraîchissement toutes les 30 secondes via `get-radio-metadata`.

## Persistance Multi-Pages

Le lecteur flottant (`GlobalRadioPlayer`) reste actif même en changeant de page :
- État global via `PlayerContext`
- Position fixe en bas à droite
- Contrôles volume/play/pause
- Métadonnées en temps réel

## Débogage

### Logs Console
```
🔗 Using robust proxy stream: https://...
📡 Loading stream via proxy...
✅ Radio playing via proxy!
```

### Tests
Tester avec différentes stations :
1. Grande station (BBC) → devrait fonctionner
2. Station locale (Radio Orient) → devrait fonctionner avec proxy mobile
3. Station HLS (.m3u8) → devrait utiliser HLS.js

## Troubleshooting

### Problème : Station ne se lance pas
- ✅ Vérifier que l'URL du stream est correcte
- ✅ Tester l'URL directement dans un lecteur
- ✅ Vérifier les logs du proxy dans Supabase

### Problème : Coupures fréquentes
- ✅ Augmenter le buffer (actuellement 30s)
- ✅ Vérifier la qualité du stream source
- ✅ Consulter les logs de reconnexion

### Problème : Pas de métadonnées
- ✅ Vérifier que la station supporte Icy-Metadata
- ✅ Tester manuellement `get-radio-metadata`
- ✅ Certaines stations ne fournissent pas de métadonnées

## Performance

- **Latence** : ~2-5 secondes (buffer + proxy)
- **Bande passante** : Identique au flux direct
- **CPU** : Minimal (proxy streaming, pas de transcodage)
- **Mémoire** : ~10-30 MB par connexion

## Sécurité

- ✅ Toutes les connexions sont HTTPS
- ✅ Pas de stockage de données utilisateur
- ✅ CORS restreint aux domaines autorisés (production)
- ✅ Pas d'authentification requise (lecture publique)

## Évolution Future

- [ ] Support WebRTC pour latence ultra-faible
- [ ] Cache CDN pour streams populaires
- [ ] Transcodage on-the-fly (MP3 → AAC)
- [ ] Analytics d'écoute
- [ ] Système de favoris utilisateur

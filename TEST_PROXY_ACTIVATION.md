# Test d'Activation du Proxy Stream - Checklist

## ✅ Corrections Appliquées

### 1. **Bouton Play - Proxy Activé** ✅

**Avant :**
```javascript
if (!audio.src && currentRadioStation) {
  // Ne chargeait le proxy que si pas de source
}
```

**Après :**
```javascript
if (currentRadioStation) {
  // TOUJOURS recharger via proxy
  audio.pause();
  audio.src = '';  // Vider le cache
  audio.load();    // Réinitialiser

  const proxiedUrl = getProxiedStreamUrl(currentRadioStation.streamUrl);
  audio.src = proxiedUrl;  // ✅ URL PROXIFIÉE
}
```

**Résultat :** Le proxy est maintenant **TOUJOURS** utilisé, jamais l'URL directe.

---

### 2. **Réinitialisation Complète audio.src** ✅

**Séquence de nettoyage ajoutée :**
```javascript
audio.pause();      // 1. Arrêter la lecture
audio.src = '';     // 2. Vider la source (cache effacé)
audio.load();       // 3. Reset de l'élément audio

// Puis charger le nouveau flux
audio.src = proxiedUrl;  // 4. Nouvelle source propre
audio.preload = 'auto';  // 5. Buffer 10s activé
audio.load();           // 6. Chargement du nouveau flux
```

**Résultat :** Cache vidé, flux frais à chaque changement.

---

### 3. **Volume Non-Zéro Garanti** ✅

**Configuration avant load :**
```javascript
// Volume configuré AVANT audio.load()
audio.volume = isMuted ? 0 : volume / 100;
console.log('🔊 Volume configured:', audio.volume, 'Muted:', isMuted);
```

**Valeurs par défaut vérifiées :**
- `volume` : État React (50% par défaut)
- `isMuted` : État React (false par défaut)
- Ordre : Volume → Load → Play

**Résultat :** Le son sort immédiatement si non muté.

---

### 4. **Headers Content-Type Renforcés** ✅

**Edge Function Headers :**
```javascript
{
  'Content-Type': 'audio/mpeg',              // ✅ Type audio forcé
  'X-Content-Type-Options': 'nosniff',       // ✅ Pas de détection auto
  'Cache-Control': 'no-cache',                // ✅ Pas de cache
  'Pragma': 'no-cache',                       // ✅ HTTP/1.0 compat
  'Expires': '0',                             // ✅ Expiration immédiate
  'Accept-Ranges': 'bytes',                   // ✅ Support partial content
  'Connection': 'keep-alive',                 // ✅ Connexion persistante
}
```

**Résultat :** Le navigateur reconnaît immédiatement le flux comme audio/mpeg.

---

## 🧪 Test Manuel - Interface Publique

### Étape 1 : Vérifier le Proxy dans la Console

**Ouvrir la console du navigateur (F12) et chercher :**

```
✅ Log attendu au clic sur Play :
📡 Loading stream via proxy...
🔗 Proxied URL: https://[PROJECT].supabase.co/functions/v1/stream-radio-proxy?url=https%3A%2F%2F...
🔊 Volume configured: 0.5 Muted: false
▶️ Starting playback...
✅ Radio playing via proxy!
```

**❌ Si vous voyez une URL directe (sans proxy), le problème persiste.**

---

### Étape 2 : Tester Jawhara FM

1. Aller sur la page d'accueil
2. Sélectionner **Jawhara FM** dans le sélecteur de stations
3. Cliquer sur le bouton **Play** ▶️
4. Vérifier les logs console
5. Écouter le son

**Résultat attendu :**
- ✅ Logs proxy affichés
- ✅ Son audible
- ✅ Pas d'erreur 404/CORS
- ✅ Volume réglable

---

### Étape 3 : Test de Reconnexion

1. Jouer une station
2. Simuler une coupure (Network throttling → Offline pendant 2s)
3. Remettre en ligne

**Résultat attendu :**
```
❌ Radio stream error: {...}
🔄 Connection lost, attempting to reconnect...
🔄 Auto-reconnecting 1/5 in 1000ms...
✅ Reconnection successful! Stream restored.
```

---

### Étape 4 : Test de Changement de Station

1. Jouer Station A
2. Changer pour Station B

**Logs attendus :**
```
📻 Changing radio station to: Station B
📡 Loading stream via proxy...
🔗 Proxied URL: https://...stream-radio-proxy?url=STATION_B_URL
✅ Radio playing via proxy!
```

---

## 🔍 Diagnostic des Problèmes

### Problème : Pas de son

**Vérifier dans la console :**

1. **URL utilisée :**
   ```javascript
   // ✅ BON : Contient "stream-radio-proxy"
   https://xxx.supabase.co/functions/v1/stream-radio-proxy?url=...

   // ❌ MAUVAIS : URL directe
   https://stream.jawhara.ma:8000/jawhara
   ```

2. **Volume configuré :**
   ```javascript
   // ✅ BON : Volume > 0
   🔊 Volume configured: 0.5 Muted: false

   // ❌ MAUVAIS : Volume = 0
   🔊 Volume configured: 0 Muted: true
   ```

3. **État de lecture :**
   ```javascript
   // ✅ BON
   ✅ Radio playing via proxy!

   // ❌ MAUVAIS
   ❌ Error playing radio: NotAllowedError
   ```

---

### Problème : Erreur NotAllowedError

**Cause :** Interaction utilisateur requise

**Solution :** Cliquer une première fois sur la page avant de jouer

---

### Problème : Erreur 404 dans la console

**Cause :** Edge Function pas déployée ou mauvais endpoint

**Vérifier :**
```bash
# Test direct de l'edge function
curl -I "https://[PROJECT].supabase.co/functions/v1/stream-radio-proxy?url=https://stream.jawhara.ma:8000/jawhara"

# Doit retourner :
HTTP/2 200
content-type: audio/mpeg
```

---

### Problème : Son haché / coupures

**Cause :** Buffer insuffisant

**Vérifier dans les logs :**
```javascript
⚠️ Low buffer detected: 1.2s  // Si < 2s = problème

// Solution : Le buffer 10s est activé avec preload='auto'
```

---

## 🎯 URLs de Test Directes

### Test de l'Edge Function (sans interface)

```bash
# Jawhara FM
https://[PROJECT].supabase.co/functions/v1/stream-radio-proxy?url=https://stream.jawhara.ma:8000/jawhara

# Hit Radio
https://[PROJECT].supabase.co/functions/v1/stream-radio-proxy?url=http://stream.hitradio.ma/hit

# Méditerranée Internationale
https://[PROJECT].supabase.co/functions/v1/stream-radio-proxy?url=http://str81.creacast.com:80/mediplus
```

**Comment tester :**
1. Copier l'URL (remplacer [PROJECT] par votre ID Supabase)
2. Ouvrir dans un nouvel onglet
3. Le navigateur devrait jouer le flux audio directement

---

## 📊 Résumé des Changements

| Composant | Avant | Après | Impact |
|-----------|-------|-------|--------|
| **togglePlayPause()** | Charge proxy seulement si `!audio.src` | TOUJOURS charge via proxy | ✅ Proxy actif |
| **Réinitialisation** | Garde source existante | `audio.src = ''; audio.load()` | ✅ Cache vidé |
| **Volume** | Configuré après load | Configuré AVANT load | ✅ Son garanti |
| **Headers Proxy** | `Content-Type: audio/mpeg` | + `Pragma`, `X-Content-Type-Options` | ✅ Reconnaissance optimale |
| **Preload** | `'none'` | `'auto'` | ✅ Buffer 10s actif |

---

## ✅ Validation Finale

**Le proxy est activé si TOUS ces points sont verts :**

- [ ] Log `🔗 Proxied URL:` contient `stream-radio-proxy`
- [ ] Log `🔊 Volume configured:` montre un volume > 0
- [ ] Log `✅ Radio playing via proxy!` s'affiche
- [ ] Le son est audible dans les enceintes
- [ ] Aucune erreur 404/CORS dans la console
- [ ] Le changement de station fonctionne instantanément
- [ ] La reconnexion automatique fonctionne après coupure

---

## 🚀 Test Final

**Commande pour tester l'edge function directement :**

```bash
curl -v "https://$(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d'=' -f2 | sed 's|https://||')/functions/v1/stream-radio-proxy?url=https://stream.jawhara.ma:8000/jawhara" \
  -H "Authorization: Bearer $(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env | cut -d'=' -f2)"
```

**Réponse attendue :**
```
< HTTP/2 200
< content-type: audio/mpeg
< access-control-allow-origin: *
...
[Stream audio binaire]
```

---

## 📞 Support

**Si le problème persiste après ces corrections :**

1. Vérifier les variables d'environnement `.env`
2. Redémarrer le serveur de développement
3. Vider le cache navigateur (Ctrl+Shift+Del)
4. Tester en navigation privée
5. Consulter les logs Supabase Edge Functions dans le dashboard

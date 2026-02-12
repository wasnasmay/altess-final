/*
  # Système d'Activation Automatique des Vidéos Premium

  1. Fonction & Trigger
    - Fonction `activate_premium_videos_on_subscription`
      - Active automatiquement les vidéos du prestataire quand son abonnement devient actif
      - Désactive les vidéos quand l'abonnement expire ou est annulé
    - Trigger sur la table `user_subscriptions`
      - Se déclenche sur INSERT et UPDATE du champ status
      - Appelle la fonction d'activation automatique

  2. Logique
    - Si status = 'active' → is_active = true pour toutes les vidéos du user_id
    - Si status = 'canceled', 'expired', 'suspended' → is_active = false
    
  3. Sécurité
    - Fonction SECURITY DEFINER pour permettre l'exécution automatique
    - Gestion des erreurs avec EXCEPTION
*/

-- Fonction pour activer/désactiver automatiquement les vidéos selon le statut d'abonnement
CREATE OR REPLACE FUNCTION activate_premium_videos_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'abonnement devient actif, activer toutes les vidéos du prestataire
  IF NEW.status = 'active' THEN
    UPDATE provider_social_videos
    SET 
      is_active = true,
      updated_at = now()
    WHERE provider_id = NEW.user_id;
    
    RAISE NOTICE 'Vidéos activées pour le prestataire %', NEW.user_id;
  
  -- Si l'abonnement est annulé, expiré ou suspendu, désactiver les vidéos
  ELSIF NEW.status IN ('canceled', 'expired', 'suspended') THEN
    UPDATE provider_social_videos
    SET 
      is_active = false,
      updated_at = now()
    WHERE provider_id = NEW.user_id;
    
    RAISE NOTICE 'Vidéos désactivées pour le prestataire %', NEW.user_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de l''activation des vidéos: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_subscription_status_change ON user_subscriptions;

-- Créer le trigger qui s'exécute après INSERT ou UPDATE du statut
CREATE TRIGGER on_subscription_status_change
  AFTER INSERT OR UPDATE OF status
  ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION activate_premium_videos_on_subscription();

-- Fonction helper pour vérifier si un utilisateur est premium actif
CREATE OR REPLACE FUNCTION is_user_premium_active(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_subscriptions 
    WHERE user_id = user_id_param 
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

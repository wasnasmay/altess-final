// Configuration Stripe - Solution d'urgence
// Cette configuration contourne le système d'environnement

export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'MA_CLE_SECRETE',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

// Fonction pour vérifier si Stripe est configuré
export function isStripeConfigured(): boolean {
  return !!STRIPE_CONFIG.secretKey && STRIPE_CONFIG.secretKey.startsWith('sk_');
}

// Fonction pour obtenir la clé Stripe
export function getStripeKey(): string {
  if (!isStripeConfigured()) {
    throw new Error('Stripe n\'est pas configuré correctement');
  }
  return STRIPE_CONFIG.secretKey;
}

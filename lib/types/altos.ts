// =====================================================
// TYPES ALTOS - Plateforme "Le sens du partage"
// =====================================================

// =====================================================
// MODULE ÉVÉNEMENTIEL
// =====================================================

export type EventProviderCategory = 'traiteur' | 'photographe' | 'decorateur' | 'dj' | 'autre';
export type EventProviderStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type PricingRange = 'budget' | 'moderate' | 'premium' | 'luxury';

export interface EventProvider {
  id: string;
  provider_id: string;
  company_name: string;
  slug: string;
  category: EventProviderCategory;
  subcategory?: string;
  short_description: string;
  full_description: string;

  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;

  main_image?: string;
  gallery_images: string[];
  logo_url?: string;

  phone?: string;
  email?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;

  address?: string;
  city?: string;
  postal_code?: string;
  service_area: string[];

  services: string[];
  pricing_range?: PricingRange;
  min_price?: number;
  max_price?: number;

  rating: number;
  total_reviews: number;
  view_count: number;

  status: EventProviderStatus;
  is_verified: boolean;
  is_featured: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;
}

export interface EventProviderReview {
  id: string;
  event_provider_id: string;
  client_id: string;
  rating: number;
  comment?: string;
  service_date?: string;
  is_verified: boolean;
  is_published: boolean;
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

export type QuoteRequestStatus = 'pending' | 'contacted' | 'quoted' | 'accepted' | 'declined' | 'expired';

export interface EventQuoteRequest {
  id: string;
  client_id?: string;
  event_provider_id: string;

  client_name: string;
  client_email: string;
  client_phone?: string;

  event_type: string;
  event_date: string;
  event_location?: string;
  guest_count?: number;
  budget_range?: string;

  message?: string;
  attachments: any[];

  status: QuoteRequestStatus;
  provider_response?: string;
  quoted_price?: number;

  created_at: string;
  updated_at: string;
}

// =====================================================
// MODULE BONNES ADRESSES
// =====================================================

export type AddressCategory = 'restaurant' | 'bar' | 'cafe' | 'culture' | 'loisirs' | 'shopping' | 'autre';
export type PriceRange = '€' | '€€' | '€€€' | '€€€€';

export interface GoodAddress {
  id: string;
  name: string;
  slug: string;
  category: AddressCategory;
  subcategory?: string;
  cuisine_type?: string;

  short_description: string;
  full_description: string;

  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;

  main_image?: string;
  gallery_images: string[];

  phone?: string;
  email?: string;
  website?: string;
  address: string;
  city: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;

  facebook_url?: string;
  instagram_url?: string;

  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;

  price_range?: PriceRange;
  features: string[];

  rating: number;
  total_reviews: number;
  view_count: number;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;
}

export interface AddressReview {
  id: string;
  address_id: string;
  client_id: string;
  rating: number;
  comment?: string;
  visit_date?: string;
  is_verified: boolean;
  is_published: boolean;
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// MODULE VOYAGES
// =====================================================

export interface TravelAgency {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;

  phone?: string;
  email?: string;
  website?: string;
  address?: string;

  description?: string;
  specialties: string[];

  is_partner: boolean;
  contract_start_date?: string;
  contract_end_date?: string;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export type TravelOfferType = 'promotion' | 'package' | 'tip' | 'destination_highlight';
export type TravelInquiryStatus = 'pending' | 'contacted' | 'quoted' | 'booked' | 'cancelled';

export interface TravelOffer {
  id: string;
  agency_id: string;

  title: string;
  slug: string;
  offer_type: TravelOfferType;

  destination: string;
  country?: string;
  continent?: string;

  short_description: string;
  full_description: string;

  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;

  main_image?: string;
  gallery_images: string[];
  video_url?: string;

  price_from?: number;
  original_price?: number;
  currency: string;

  duration_days?: number;
  includes: string[];
  highlights: string[];

  valid_from?: string;
  valid_until?: string;
  departure_dates: string[];

  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  view_count: number;

  created_at: string;
  updated_at: string;
}

export interface TravelInquiry {
  id: string;
  offer_id?: string;
  agency_id: string;

  client_name: string;
  client_email: string;
  client_phone?: string;

  travel_dates?: string;
  travelers_count?: number;
  message?: string;

  status: TravelInquiryStatus;
  agency_response?: string;

  created_at: string;
  updated_at: string;
}

// =====================================================
// MODULE RENDEZ-VOUS (AGENDA)
// =====================================================

export type PublicEventType = 'concert' | 'festival' | 'soiree' | 'spectacle' | 'conference' | 'atelier' | 'autre';
export type PublicEventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  event_type: PublicEventType;

  short_description: string;
  full_description: string;

  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;

  main_image?: string;
  gallery_images: string[];

  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;

  venue_name?: string;
  venue_address?: string;
  city: string;
  latitude?: number;
  longitude?: number;

  organizer_name?: string;
  organizer_contact?: string;
  organizer_website?: string;

  ticket_url?: string;
  price_info?: string;
  is_free: boolean;

  artists: string[];
  tags: string[];

  is_active: boolean;
  is_featured: boolean;
  status: PublicEventStatus;
  view_count: number;

  created_by?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// MODULE PUBLICITÉ PREMIUM
// =====================================================

export type AdContentType = 'event_provider' | 'travel_offer' | 'good_address' | 'partner' | 'custom';
export type AdPlacement = 'home_hero' | 'home_sidebar' | 'category_top' | 'event_sidebar' | 'travel_banner' | 'address_banner';
export type AdBillingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one_time';
export type AdStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface PremiumAd {
  id: string;
  content_type: AdContentType;
  content_id?: string;
  placement: AdPlacement;

  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  cta_text: string;

  price: number;
  billing_period?: AdBillingPeriod;

  start_date: string;
  end_date: string;

  impressions: number;
  clicks: number;

  status: AdStatus;
  is_paid: boolean;

  advertiser_id?: string;

  created_at: string;
  updated_at: string;
}

export type AdEventType = 'impression' | 'click';

export interface AdAnalytics {
  id: string;
  ad_id: string;
  event_type: AdEventType;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  created_at: string;
}

export interface AdStats {
  impressions_total: number;
  clicks_total: number;
  ctr: number;
  impressions_today: number;
  clicks_today: number;
}

// =====================================================
// TYPES UTILITAIRES
// =====================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface FilterParams {
  category?: string;
  city?: string;
  priceRange?: string;
  rating?: number;
  featured?: boolean;
  search?: string;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// =====================================================
// TYPES DE RÉPONSE API
// =====================================================

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number;
  page?: number;
  total?: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// =====================================================
// MODULE ACADEMY - ABONNEMENT PROFESSEURS
// =====================================================

export type SubscriptionTier = 'pro' | 'premium';
export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'cancelled' | 'incomplete' | 'trialing';
export type SubscriptionInterval = 'month' | 'year';
export type ContactMethod = 'email' | 'phone' | 'whatsapp';
export type ContactRequestStatus = 'pending' | 'contacted' | 'completed' | 'spam';

export interface TeacherProfile {
  id: string;
  profile_id: string;

  biography?: string;
  qualifications: string[];
  specialties: string[];
  years_experience?: number;

  profile_image?: string;
  portfolio_images: string[];
  demo_video_url?: string;

  phone?: string;
  whatsapp?: string;
  website?: string;

  total_students: number;
  average_rating: number;
  total_reviews: number;

  is_public: boolean;
  is_verified: boolean;

  display_order: number;
  view_count: number;

  created_at: string;
  updated_at: string;
}

export interface TeacherSubscription {
  id: string;
  teacher_id: string;

  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;

  subscription_tier: SubscriptionTier;
  status: SubscriptionStatus;

  current_period_start?: string;
  current_period_end?: string;
  cancel_at?: string;
  cancelled_at?: string;
  trial_end?: string;

  price_amount: number;
  currency: string;
  interval: SubscriptionInterval;

  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
}

export interface TeacherReview {
  id: string;
  teacher_id: string;
  student_id: string;

  rating: number;
  comment?: string;

  is_verified: boolean;
  course_id?: string;

  is_published: boolean;
  teacher_response?: string;

  profiles?: {
    full_name?: string;
  };

  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  id: string;
  teacher_id: string;
  student_id?: string;

  student_name: string;
  student_email: string;
  student_phone?: string;

  message: string;
  preferred_contact_method?: ContactMethod;

  status: ContactRequestStatus;
  teacher_response?: string;
  contacted_at?: string;

  ip_address?: string;
  user_agent?: string;

  created_at: string;
  updated_at: string;
}

export interface TeacherWithSubscription extends TeacherProfile {
  full_name?: string;
  email?: string;
  subscription_status: SubscriptionStatus | 'none';
  subscription_tier?: SubscriptionTier;
  current_period_end?: string;
  is_subscribed: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  is_popular?: boolean;
}

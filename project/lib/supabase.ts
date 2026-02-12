import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Orchestra = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_range: string;
  members_count: number;
  specialties: string[];
  created_at: string;
  updated_at?: string;
};

export type Musician = {
  id: string;
  name: string;
  email: string;
  phone: string;
  instrument: string;
  orchestra_id: string | null;
  availability: Record<string, any>;
  photo_url: string;
  bio: string;
  created_at: string;
  updated_at?: string;
};

export type ChatMessage = {
  id: string;
  user_name: string;
  user_email: string;
  message: string;
  response: string;
  is_admin_response: boolean;
  created_at: string;
  updated_at?: string;
};

export type Quote = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  event_type: string;
  event_date: string;
  budget: number;
  guests_count: number;
  orchestra_id: string | null;
  status: string;
  total_price: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'audio';
  category: string | null;
  media_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  duration_ms?: number;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'organizer' | 'partner' | 'provider' | 'client';
  avatar_url: string | null;
  created_at: string;
  updated_at?: string;
};

import { User } from "@supabase/supabase-js";

// Tipos baseados no schema do Supabase
export type Profile = {
  id: string; // UUID do auth.users
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'writer' | 'admin';
  subscription_status: 'free' | 'premium'; // Novo campo adicionado
  updated_at: string | null;
};

export type Page = {
  id: string;
  author_id: string | null;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  language_code: string;
};

export type Verse = {
  id: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
  language_code: string;
  version: string;
  created_at: string;
};

export type DailyVerse = {
  id: string;
  date: string;
  book: string;
  chapter: number;
  verse_number: number;
  language_code: string;
  version: string | null;
  created_at: string | null;
};

export type BlogPost = {
  id: string;
  author_id: string | null;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  scheduled_for: string | null;
  created_at: string | null;
  updated_at: string | null;
  language_code: string;
};

export type UserFavorite = {
  id: string;
  user_id: string | null;
  verse_id: string | null;
  book: string;
  chapter: number;
  verse_number: number;
  language_code: string;
  created_at: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export type UserReadingPlan = {
  id: string;
  user_id: string;
  plan_id: string | null;
  custom_plan_name: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'paused';
  daily_reading_schedule: Record<string, { book: string; chapter: number; }[]>;
  created_at: string | null;
};

export type WebStory = {
  id: string;
  author_id: string | null;
  title: string;
  slug: string;
  story_data: any; // JSON complexo do editor
  poster_image_src: string | null;
  status: 'draft' | 'published' | 'archived';
  language_code: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WebStoryTranslation = {
  id: string;
  story_id: string;
  language_code: string;
  title: string;
  story_data: any;
  created_at: string;
  updated_at: string;
};

// Tipos combinados para uso no frontend
export interface UserWithProfile extends User {
  profile: Profile | null;
}
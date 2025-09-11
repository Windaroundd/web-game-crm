-- Website & Game Management System Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable Row Level Security on all tables
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 1. Create websites table
CREATE TABLE IF NOT EXISTS public.websites (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  "desc" TEXT,
  category TEXT,
  is_gsa BOOLEAN DEFAULT false,
  is_index BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  traffic INTEGER DEFAULT 0,
  domain_rating INTEGER DEFAULT 0,
  backlinks INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,
  is_wp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for websites
CREATE INDEX IF NOT EXISTS idx_websites_category ON public.websites (category);
CREATE INDEX IF NOT EXISTS idx_websites_traffic ON public.websites (traffic DESC);
CREATE INDEX IF NOT EXISTS idx_websites_domain_rating ON public.websites (domain_rating DESC);
CREATE INDEX IF NOT EXISTS idx_websites_is_featured ON public.websites (is_featured);
CREATE INDEX IF NOT EXISTS idx_websites_is_gsa ON public.websites (is_gsa);
CREATE INDEX IF NOT EXISTS idx_websites_is_index ON public.websites (is_index);
CREATE INDEX IF NOT EXISTS idx_websites_is_wp ON public.websites (is_wp);
CREATE INDEX IF NOT EXISTS idx_websites_backlinks ON public.websites (backlinks DESC);
CREATE INDEX IF NOT EXISTS idx_websites_referring_domains ON public.websites (referring_domains DESC);

-- 2. Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  "desc" TEXT,
  category TEXT,
  game_url TEXT,
  game_icon TEXT,
  game_thumb TEXT,
  game_developer TEXT,
  game_publish_year INTEGER,
  game_controls JSONB,
  game TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for games
CREATE INDEX IF NOT EXISTS idx_games_category ON public.games (category);
CREATE INDEX IF NOT EXISTS idx_games_is_featured ON public.games (is_featured);
CREATE INDEX IF NOT EXISTS idx_games_developer ON public.games (game_developer);
CREATE INDEX IF NOT EXISTS idx_games_publish_year ON public.games (game_publish_year);

-- 3. Create cloudflare_accounts table
CREATE TABLE IF NOT EXISTS public.cloudflare_accounts (
  id BIGSERIAL PRIMARY KEY,
  account_name TEXT NOT NULL,
  email TEXT NOT NULL,
  api_token TEXT NOT NULL,
  account_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Create cloudflare_purge_logs table
CREATE TABLE IF NOT EXISTS public.cloudflare_purge_logs (
  id BIGSERIAL PRIMARY KEY,
  cloudflare_account_id BIGINT REFERENCES public.cloudflare_accounts(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK (mode IN ('url','hostname','tag','prefix')),
  payload JSONB NOT NULL,
  exclusions JSONB,
  status_code INTEGER,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. Create textlinks table
CREATE TABLE IF NOT EXISTS public.textlinks (
  id BIGSERIAL PRIMARY KEY,
  link TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  target TEXT DEFAULT '_blank',
  rel TEXT DEFAULT '',
  title TEXT,
  website_id BIGINT REFERENCES public.websites(id) ON DELETE SET NULL,
  custom_domain TEXT,
  show_on_all_pages BOOLEAN DEFAULT true,
  include_paths TEXT,
  exclude_paths TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for textlinks
CREATE INDEX IF NOT EXISTS idx_textlinks_website_id ON public.textlinks (website_id);
CREATE INDEX IF NOT EXISTS idx_textlinks_custom_domain ON public.textlinks (custom_domain);
CREATE INDEX IF NOT EXISTS idx_textlinks_show_on_all_pages ON public.textlinks (show_on_all_pages);

-- Add constraint to ensure website_id or custom_domain is provided
ALTER TABLE public.textlinks 
ADD CONSTRAINT check_website_or_domain 
CHECK (website_id IS NOT NULL OR custom_domain IS NOT NULL);

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trg_websites_updated 
  BEFORE UPDATE ON public.websites
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_games_updated 
  BEFORE UPDATE ON public.games
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_textlinks_updated 
  BEFORE UPDATE ON public.textlinks
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

-- 7. Enable Row Level Security
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloudflare_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloudflare_purge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textlinks ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies based on user role

-- Function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    'viewer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Websites policies
CREATE POLICY "websites_select_policy" ON public.websites
  FOR SELECT USING (true); -- All authenticated users can read

CREATE POLICY "websites_insert_policy" ON public.websites
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "websites_update_policy" ON public.websites
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "websites_delete_policy" ON public.websites
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() = 'admin'
  );

-- Games policies
CREATE POLICY "games_select_policy" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "games_insert_policy" ON public.games
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "games_update_policy" ON public.games
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "games_delete_policy" ON public.games
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() = 'admin'
  );

-- Cloudflare accounts policies (admin only)
CREATE POLICY "cloudflare_accounts_select_policy" ON public.cloudflare_accounts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() = 'admin'
  );

CREATE POLICY "cloudflare_accounts_insert_policy" ON public.cloudflare_accounts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    get_user_role() = 'admin'
  );

CREATE POLICY "cloudflare_accounts_update_policy" ON public.cloudflare_accounts
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() = 'admin'
  );

CREATE POLICY "cloudflare_accounts_delete_policy" ON public.cloudflare_accounts
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() = 'admin'
  );

-- Cloudflare purge logs policies
CREATE POLICY "cloudflare_purge_logs_select_policy" ON public.cloudflare_purge_logs
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "cloudflare_purge_logs_insert_policy" ON public.cloudflare_purge_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

-- Textlinks policies
CREATE POLICY "textlinks_select_policy" ON public.textlinks
  FOR SELECT USING (true);

CREATE POLICY "textlinks_insert_policy" ON public.textlinks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "textlinks_update_policy" ON public.textlinks
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "textlinks_delete_policy" ON public.textlinks
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role() = 'admin'
  );

-- 9. Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('games', 'games', true),
  ('games-icons', 'games/icons', true),
  ('games-thumbs', 'games/thumbs', true),
  ('avatars', 'avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 10. Create storage policies
CREATE POLICY "Games storage read policy" ON storage.objects
  FOR SELECT USING (bucket_id IN ('games', 'games-icons', 'games-thumbs'));

CREATE POLICY "Games storage write policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('games', 'games-icons', 'games-thumbs') AND 
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Games storage update policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('games', 'games-icons', 'games-thumbs') AND 
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Games storage delete policy" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('games', 'games-icons', 'games-thumbs') AND 
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

-- Avatar policies (users can manage their own avatars)
CREATE POLICY "Avatar storage read policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar storage write policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Avatar storage update policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Avatar storage delete policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid() IS NOT NULL
  );

-- Document policies (admin/editor only)
CREATE POLICY "Document storage read policy" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Document storage write policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid() IS NOT NULL AND 
    get_user_role() IN ('admin', 'editor')
  );

-- 11. Insert sample data (optional)
INSERT INTO public.websites (url, title, "desc", category, is_gsa, is_index, is_featured, traffic, domain_rating, backlinks, referring_domains, is_wp) VALUES
  ('https://example.com', 'Example Website', 'A sample website for demonstration', 'blog', true, true, false, 15000, 65, 1200, 890, true),
  ('https://techblog.dev', 'Tech Blog', 'Technology focused blog', 'tech', false, true, true, 45000, 78, 3400, 2100, false),
  ('https://gamereviews.net', 'Game Reviews', 'Video game reviews and news', 'gaming', true, true, true, 28000, 72, 2100, 1450, true)
ON CONFLICT (url) DO NOTHING;

INSERT INTO public.games (url, title, "desc", category, game_url, game_developer, game_publish_year, game_controls, is_featured) VALUES
  ('retro-bowl', 'Retro Bowl', 'American football game with retro graphics', 'sports', 'https://games.example.com/retro-bowl', 'New Star Games', 2020, '{"keyboard": true, "mouse": true, "touch": false}', true),
  ('puzzle-master', 'Puzzle Master', 'Challenging puzzle game for all ages', 'puzzle', 'https://games.example.com/puzzle-master', 'Brain Games Studio', 2023, '{"keyboard": false, "mouse": true, "touch": true}', false),
  ('space-shooter', 'Space Shooter', 'Classic arcade-style space shooting game', 'arcade', 'https://games.example.com/space-shooter', 'Retro Arcade', 2022, '{"keyboard": true, "mouse": false, "touch": true}', true)
ON CONFLICT (url) DO NOTHING;
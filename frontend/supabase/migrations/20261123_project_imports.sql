-- ============================================================================
-- CodeSentra AI: Project Management & Archive Storage Migration
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY DEFAULT ('proj_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('github_oauth', 'github_url', 'local_upload')),
  repo_url TEXT,
  default_branch TEXT DEFAULT 'main',
  base_ref TEXT NOT NULL DEFAULT 'main',
  target_ref TEXT NOT NULL,
  language TEXT DEFAULT 'TypeScript',
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'uploading', 'parsing', 'ready', 'analyzed', 'failed')),
  files_count INTEGER DEFAULT 0,
  storage_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_source_type ON public.projects(source_type);

-- 3. Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow users to manage only their own project records
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'public_guest');

CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'public_guest');

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = 'public_guest');

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = 'public_guest');

-- 4. Storage Bucket for Project Archives
-- Note: Run in Supabase SQL editor or CLI
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-archives',
  'project-archives',
  false,
  104857600, -- 100 MB max file size
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/x-tar', 'application/gzip']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600;

-- Storage RLS: Users can only upload and read files inside their user_id directory
CREATE POLICY "Users can upload their own project archives"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-archives'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'guest')
  );

CREATE POLICY "Users can read their own project archives"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-archives'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'guest')
  );

CREATE POLICY "Users can delete their own project archives"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-archives'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'guest')
  );

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

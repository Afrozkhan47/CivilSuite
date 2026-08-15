-- CivilSuite Phase 7B Hardening Migration: Idempotent RLS Policies & Automated Trigger
-- Safely hardens existing public.projects table without dropping data, rows, or tables.

-- 1. Ensure Table & Indexes Exist (Non-destructive)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_name TEXT,
    client TEXT,
    engineer TEXT,
    concrete_grade TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    input_data JSONB NOT NULL,
    result_data JSONB,
    redesign_metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_favorite ON public.projects(user_id, is_favorite);

-- 2. Ensure RLS is Enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. Idempotent RLS Policy Re-creation (Safely handles existing policies)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects" 
    ON public.projects FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" 
    ON public.projects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" 
    ON public.projects FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" 
    ON public.projects FOR DELETE 
    USING (auth.uid() = user_id);

-- 4. CivilSuite-Specific Trigger Function for Automated updated_at
CREATE OR REPLACE FUNCTION civilsuite_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION civilsuite_set_updated_at();

-- 5. Explicit Permissions Grant
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

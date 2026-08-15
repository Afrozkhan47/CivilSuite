-- CivilSuite Phase 4 Migration: Projects Table & Row Level Security (RLS)
-- Enables multi-tenant isolated project history per authenticated user

-- 1. Create Projects Table
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

-- 2. Create Optimized Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_favorite ON public.projects(user_id, is_favorite);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 4. Create User Ownership RLS Policies
-- Users can only SELECT their own projects
CREATE POLICY "Users can view own projects" 
    ON public.projects FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can only INSERT projects owned by themselves
CREATE POLICY "Users can insert own projects" 
    ON public.projects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own projects and cannot reassign ownership to another user
CREATE POLICY "Users can update own projects" 
    ON public.projects FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own projects
CREATE POLICY "Users can delete own projects" 
    ON public.projects FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. Grant Permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;


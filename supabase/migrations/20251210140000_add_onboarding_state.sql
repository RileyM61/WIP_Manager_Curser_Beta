-- Add onboarding_state to profiles
-- This stores user progression (newbie/ninja) and gamification stats
-- JSONB structure allows flexibility for future delight features

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'onboarding_state'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN onboarding_state JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

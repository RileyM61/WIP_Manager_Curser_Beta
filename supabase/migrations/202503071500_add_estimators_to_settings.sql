-- Migration: Add estimators column to settings table
-- This allows companies to maintain a separate list of estimators

-- Add estimators column to settings table (text array, default empty)
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS estimators text[] DEFAULT '{}';


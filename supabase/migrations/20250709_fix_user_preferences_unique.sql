-- Add unique constraint to user_id in user_preferences table to prevent duplicate rows
-- First, remove any duplicate rows that might already exist
DELETE FROM public.user_preferences 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM public.user_preferences 
    ORDER BY user_id, updated_at DESC
);

-- Add unique constraint on user_id
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);

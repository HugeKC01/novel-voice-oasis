
-- Add book_series column to voice_collections table
ALTER TABLE voice_collections ADD COLUMN book_series TEXT;

-- Update the user_preferences table to include dark_mode if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' AND column_name = 'dark_mode') THEN
        ALTER TABLE user_preferences ADD COLUMN dark_mode BOOLEAN DEFAULT false;
    END IF;
END $$;

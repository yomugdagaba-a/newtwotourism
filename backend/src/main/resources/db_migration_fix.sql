-- Run this script manually to fix missing columns
-- Connect to PostgreSQL and run: psql -U postgres -d tourism -f db_migration_fix.sql

-- =====================================================
-- FIX: email_verification_tokens table - add attempt_count column
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_verification_tokens' AND column_name = 'attempt_count') THEN
        ALTER TABLE email_verification_tokens ADD COLUMN attempt_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added attempt_count column to email_verification_tokens table';
    ELSE
        RAISE NOTICE 'attempt_count column already exists';
    END IF;
END $$;

-- =====================================================
-- FIX: users table - add email_verified columns
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added email_verified column to users table';
    ELSE
        RAISE NOTICE 'email_verified column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
        RAISE NOTICE 'Added email_verified_at column to users table';
    ELSE
        RAISE NOTICE 'email_verified_at column already exists';
    END IF;
END $$;

-- Update existing users to have email_verified = false if null
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;

-- =====================================================
-- Verify the changes
-- =====================================================
SELECT 'email_verification_tokens columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_verification_tokens' 
ORDER BY ordinal_position;

SELECT 'users columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

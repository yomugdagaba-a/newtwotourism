-- Quick fix for missing attempt_count column
-- Run this in psql or pgAdmin:
-- psql -U postgres -d tourism -c "ALTER TABLE email_verification_tokens ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0;"

ALTER TABLE email_verification_tokens ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;

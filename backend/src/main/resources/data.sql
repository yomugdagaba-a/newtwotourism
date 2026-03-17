-- ================= ROLES =================
INSERT INTO roles (name, created_at, updated_at)
VALUES ('ADMIN', NOW(), NOW()),
       ('CLIENT', NOW(), NOW()),
       ('HOTEL_OWNER', NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;

-- ================= USERS =================
INSERT INTO users (username, password_hash, email, full_name, active, created_at, updated_at)
VALUES
    ('admin', '$2b$10$ZdOC9INd8wGvpCF5hYUFOuzCQ/.vWS3XypOFxl7/SJkJz6bVKLuJa', 'admin@northwollo.et', 'System Administrator', TRUE, NOW(), NOW()),
    ('client', '$2b$10$ZdOC9INd8wGvpCF5hYUFOuzCQ/.vWS3XypOFxl7/SJkJz6bVKLuJa', 'client@northwollo.et', 'Default Client', TRUE, NOW(), NOW()),
    ('hotelowner', '$2b$10$ZdOC9INd8wGvpCF5hYUFOuzCQ/.vWS3XypOFxl7/SJkJz6bVKLuJa', 'hotelowner@northwollo.et', 'Default Hotel Owner', TRUE, NOW(), NOW())
    ON CONFLICT (username) DO NOTHING;

-- ================= ASSIGN ROLES =================
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE (u.username = 'admin' AND r.name = 'ADMIN')
   OR (u.username = 'client' AND r.name = 'CLIENT')
   OR (u.username = 'hotelowner' AND r.name = 'HOTEL_OWNER')
    ON CONFLICT DO NOTHING;

-- ================= BOOKING STATUSES =================
INSERT INTO booking_statuses (name)
VALUES
    ('REQUESTED'),
    ('OWNER_ACCEPTED'),
    ('COST_PROPOSED'),
    ('PAID'),
    ('APPROVED'),
    ('REJECTED')
    ON CONFLICT (name) DO NOTHING;

-- ================= HOTELS =================
INSERT INTO hotels (name, description, contact_info, star_rating, active, created_at, updated_at)
VALUES
    ('North Wollo Hotel', 'Comfortable stay in Woldia', '0965432345', 4, TRUE, NOW(), NOW()),
    ('Blue Nile Inn', 'Cozy hotel near the Blue Nile', '0912345678', 3, TRUE, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;

-- ================= HOTEL IMAGES =================
INSERT INTO hotel_images (hotel_id, image_url, is_main)
SELECT h.id, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', TRUE
FROM hotels h
WHERE h.name = 'North Wollo Hotel'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_images (hotel_id, image_url, is_main)
SELECT h.id, 'https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=800&q=80', TRUE
FROM hotels h
WHERE h.name = 'Blue Nile Inn'
ON CONFLICT DO NOTHING;

-- ================= TOURISM PLACES =================
INSERT INTO tourism_places (name, description, wereda, kebele, category, best_time, peace_info, viewers_count, status, created_at, updated_at)
VALUES
    ('Lalibela Rock Churches', 'UNESCO World Heritage site featuring 11 medieval monolithic rock-hewn churches. A masterpiece of human creative genius.', 'Lalibela', 'Lalibela Town', 'HERITAGE', 'October to March', 'Very safe and welcoming destination', 1250, 'ACTIVE', NOW(), NOW()),
    ('Simien Mountains', 'Stunning highland scenery with endemic wildlife including Gelada baboons and Walia ibex. Perfect for trekking.', 'Debark', 'Simien', 'HIGHLAND', 'September to November', 'Safe with local guides recommended', 980, 'ACTIVE', NOW(), NOW()),
    ('Gishen Mariam', 'Ancient monastery believed to house a piece of the True Cross. Important pilgrimage site.', 'Ambassel', 'Gishen', 'HERITAGE', 'Year-round', 'Very peaceful religious site', 756, 'ACTIVE', NOW(), NOW()),
    ('Lake Hayk', 'Beautiful highland lake surrounded by monasteries. Great for bird watching and peaceful retreats.', 'Hayk', 'Hayk Town', 'AQUATICS', 'October to February', 'Safe and serene environment', 543, 'ACTIVE', NOW(), NOW()),
    ('Yemrehanna Kristos Church', 'Remarkable Aksumite-style church built inside a cave. Predates Lalibela churches.', 'Lalibela', 'Bilbala', 'CAVERN', 'October to March', 'Safe with local guides', 432, 'ACTIVE', NOW(), NOW()),
    ('Woldia Cultural Center', 'Modern cultural center showcasing North Wollo traditions, music, and crafts.', 'Woldia', 'Woldia Town', 'CULTURE', 'Year-round', 'Very safe urban area', 321, 'ACTIVE', NOW(), NOW()),
    ('Asheton Maryam Monastery', 'Mountain-top monastery with breathtaking views. Requires a challenging hike.', 'Lalibela', 'Asheton', 'HERITAGE', 'October to March', 'Safe with proper preparation', 289, 'ACTIVE', NOW(), NOW()),
    ('Meket Highlands', 'Scenic highland area with traditional villages and stunning landscapes.', 'Meket', 'Filakit', 'HIGHLAND', 'September to December', 'Safe rural area', 198, 'ACTIVE', NOW(), NOW()),
    ('Bilbala Cave', 'Natural cave system with historical significance and unique geological formations.', 'Lalibela', 'Bilbala', 'CAVERN', 'Year-round', 'Safe with local guides', 156, 'ACTIVE', NOW(), NOW()),
    ('Woldia Modern Park', 'Contemporary urban park with recreational facilities and green spaces.', 'Woldia', 'Woldia Town', 'MODERN', 'Year-round', 'Very safe urban area', 234, 'ACTIVE', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ================= HOTEL BOOKINGS =================
-- Get IDs dynamically
INSERT INTO hotel_bookings (hotel_id, user_ref, check_in_date, check_out_date, status, receipt_image_url, total_cost, created_at, updated_at)
SELECT
    h.id,
    u.id,
    NOW() + INTERVAL '7 day',
    NOW() + INTERVAL '10 day',
    bs.id,
    NULL,
    0,
    NOW(),
    NOW()
FROM hotels h
    JOIN users u ON u.username = 'client'
    JOIN booking_statuses bs ON bs.name = 'REQUESTED'
WHERE h.name = 'North Wollo Hotel'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_bookings (hotel_id, user_ref, check_in_date, check_out_date, status, receipt_image_url, total_cost, created_at, updated_at)
SELECT
    h.id,
    u.id,
    NOW() + INTERVAL '15 day',
    NOW() + INTERVAL '18 day',
    bs.id,
    NULL,
    0,
    NOW(),
    NOW()
FROM hotels h
    JOIN users u ON u.username = 'client'
    JOIN booking_statuses bs ON bs.name = 'REQUESTED'
WHERE h.name = 'Blue Nile Inn'
ON CONFLICT DO NOTHING;

-- ================= PASSWORD RESET TOKENS =================
-- Table will be auto-created by Hibernate, but we can add indexes for performance
-- CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
-- CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
-- CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_tokens(expires_at);
-- CREATE INDEX IF NOT EXISTS idx_password_reset_ip_created ON password_reset_tokens(ip_address, created_at);

-- Note: The password_reset_tokens table will be automatically created by Hibernate
-- with the following structure:
-- - id (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
-- - token (VARCHAR(255), UNIQUE, NOT NULL)
-- - user_id (BIGINT, NOT NULL)
-- - expires_at (TIMESTAMP, NOT NULL)
-- - used (BOOLEAN, DEFAULT FALSE)
-- - ip_address (VARCHAR(45))
-- - user_agent (VARCHAR(500))
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
-- ================= EMAIL VERIFICATION TOKENS =================
-- Table will be auto-created by Hibernate, but we can add indexes for performance
-- CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token);
-- CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id);
-- CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification_tokens(email);
-- CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at ON email_verification_tokens(expires_at);
-- CREATE INDEX IF NOT EXISTS idx_email_verification_ip_created ON email_verification_tokens(ip_address, created_at);

-- Note: The email_verification_tokens table will be automatically created by Hibernate
-- with the following structure:
-- - id (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
-- - token (VARCHAR(255), UNIQUE, NOT NULL)
-- - user_id (BIGINT, NOT NULL)
-- - email (VARCHAR(255), NOT NULL)
-- - expires_at (TIMESTAMP, NOT NULL)
-- - verified (BOOLEAN, DEFAULT FALSE)
-- - ip_address (VARCHAR(45))
-- - user_agent (VARCHAR(500))
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- Note: The users table will be updated with new columns:
-- - email_verified (BOOLEAN, DEFAULT FALSE)
-- - email_verified_at (TIMESTAMP)
-- ================= REFRESH TOKENS =================
-- Table will be auto-created by Hibernate, but we can add indexes for performance
-- CREATE INDEX IF NOT EXISTS idx_refresh_token ON refresh_tokens(token);
-- CREATE INDEX IF NOT EXISTS idx_refresh_user_id ON refresh_tokens(user_id);
-- CREATE INDEX IF NOT EXISTS idx_refresh_expires_at ON refresh_tokens(expires_at);
-- CREATE INDEX IF NOT EXISTS idx_refresh_ip_created ON refresh_tokens(ip_address, created_at);

-- Note: The refresh_tokens table will be automatically created by Hibernate
-- with the following structure:
-- - id (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
-- - token (VARCHAR(255), UNIQUE, NOT NULL)
-- - user_id (BIGINT, NOT NULL)
-- - expires_at (TIMESTAMP, NOT NULL)
-- - revoked (BOOLEAN, DEFAULT FALSE)
-- - ip_address (VARCHAR(45))
-- - user_agent (VARCHAR(500))
-- - device_info (VARCHAR(100))
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
-- ================= LOGIN ATTEMPTS =================
-- Table will be auto-created by Hibernate, but we can add indexes for performance
-- CREATE INDEX IF NOT EXISTS idx_login_attempt_identifier ON login_attempts(identifier);
-- CREATE INDEX IF NOT EXISTS idx_login_attempt_ip ON login_attempts(ip_address);
-- CREATE INDEX IF NOT EXISTS idx_login_attempt_time ON login_attempts(attempt_time);
-- CREATE INDEX IF NOT EXISTS idx_login_attempt_user_id ON login_attempts(user_id);
-- CREATE INDEX IF NOT EXISTS idx_login_attempt_successful ON login_attempts(successful);

-- Note: The login_attempts table will be automatically created by Hibernate
-- with the following structure:
-- - id (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
-- - identifier (VARCHAR(100), NOT NULL)
-- - attempt_time (TIMESTAMP, NOT NULL)
-- - successful (BOOLEAN, DEFAULT FALSE)
-- - ip_address (VARCHAR(45), NOT NULL)
-- - user_agent (VARCHAR(500))
-- - failure_reason (VARCHAR(100))
-- - user_id (BIGINT)
-- - attempt_type (VARCHAR(20))
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- ================= ACCOUNT LOCKOUTS =================
-- Table will be auto-created by Hibernate, but we can add indexes for performance
-- CREATE INDEX IF NOT EXISTS idx_account_lockout_user_id ON account_lockouts(user_id);
-- CREATE INDEX IF NOT EXISTS idx_account_lockout_active ON account_lockouts(active);
-- CREATE INDEX IF NOT EXISTS idx_account_lockout_unlock_at ON account_lockouts(unlock_at);
-- CREATE INDEX IF NOT EXISTS idx_account_lockout_trigger_ip ON account_lockouts(trigger_ip_address);

-- Note: The account_lockouts table will be automatically created by Hibernate
-- with the following structure:
-- - id (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
-- - user_id (BIGINT, NOT NULL)
-- - locked_at (TIMESTAMP, NOT NULL)
-- - unlock_at (TIMESTAMP, NOT NULL)
-- - reason (VARCHAR(200))
-- - lockout_count (INTEGER, DEFAULT 1)
-- - active (BOOLEAN, DEFAULT TRUE)
-- - trigger_ip_address (VARCHAR(45))
-- - lockout_type (VARCHAR(100))
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
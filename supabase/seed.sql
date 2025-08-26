-- Seed data for Masonic Traveler
-- This script populates the database with test data for development

-- IMPORTANT: For login to work, you must first create users in Supabase Auth
-- Method 1 (Recommended): Use the setup script
--   npm run setup:auth-users
-- 
-- Method 2 (Manual): Create users in Supabase Dashboard
--   1. Go to Authentication > Users in your Supabase dashboard
--   2. Create users with these emails (password: masonic123):
--      secretary.sf@example.com, brother1@example.com, newbro1@example.com, admin@masonictraveler.com
--   3. Copy their UUIDs and update the INSERT statements below to match

-- Insert badges first
INSERT INTO badges (code, label, kind, threshold, icon_url) VALUES
('traveling_man', 'Traveling Man', 'visit', 1, '/badges/traveling-man.svg'),
('wandering_mason', 'Wandering Mason', 'visit', 6, '/badges/wandering-mason.svg'),
('globetrotter', 'Globetrotter', 'visit', 16, '/badges/globetrotter.svg'),
('master_traveler', 'Master Traveler', 'visit', 31, '/badges/master-traveler.svg'),
('helping_hand', 'Helping Hand', 'charity', 1, '/badges/helping-hand.svg'),
('charity_builder', 'Charity Builder', 'charity', 5, '/badges/charity-builder.svg'),
('beacon_of_light', 'Beacon of Light', 'charity', 15, '/badges/beacon-of-light.svg');

-- Insert sample users first (without lodge_id to avoid circular dependency)
INSERT INTO users (id, email, first_name, obfuscated_handle, lodge_id, role, is_verified) VALUES
-- Secretaries (verified by default) - lodge_id will be updated later
('11111111-1111-1111-1111-111111111111', 'secretary.sf@example.com', 'Robert', 'RSF001', null, 'secretary', true),
('22222222-2222-2222-2222-222222222222', 'secretary.la@example.com', 'Michael', 'MLA002', null, 'secretary', true),
('33333333-3333-3333-3333-333333333333', 'secretary.ny@example.com', 'David', 'DNY003', null, 'secretary', true),
('44444444-4444-4444-4444-444444444444', 'secretary.bk@example.com', 'James', 'JBK004', null, 'secretary', true),
('55555555-5555-5555-5555-555555555555', 'secretary.hou@example.com', 'William', 'WHou005', null, 'secretary', true),
('66666666-6666-6666-6666-666666666666', 'secretary.dal@example.com', 'John', 'JDal006', null, 'secretary', true),

-- Regular brothers (lodge_id will be updated later)
('77777777-7777-7777-7777-777777777777', 'brother1@example.com', 'Thomas', 'TSF007', null, 'brother', true),
('88888888-8888-8888-8888-888888888888', 'brother2@example.com', 'Charles', 'CLA008', null, 'brother', true),
('99999999-9999-9999-9999-999999999999', 'brother3@example.com', 'Andrew', 'ANY009', null, 'brother', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'brother4@example.com', 'Richard', 'RBK010', null, 'brother', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'brother5@example.com', 'Daniel', 'DHou011', null, 'brother', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'brother6@example.com', 'Joseph', 'JDal012', null, 'brother', true),

-- Unverified brothers (lodge_id will be updated later)
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'newbro1@example.com', 'Matthew', 'MSF013', null, 'brother', false),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'newbro2@example.com', 'Christopher', 'CLA014', null, 'brother', false),

-- Admin
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'admin@masonictraveler.com', 'Admin', 'Admin', null, 'admin', true);

-- Insert sample lodges (now that users exist)
INSERT INTO lodges (id, name, number, grand_lodge, district, address, city, country, lat, lng, created_by) VALUES
-- Grand Lodge of California
('11111111-1111-1111-1111-111111111111', 'San Francisco Lodge', '3', 'California', 'District 1', '1111 California St', 'San Francisco', 'USA', 37.7749, -122.4194, '11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', 'Los Angeles Lodge', '42', 'California', 'District 2', '123 Hope St', 'Los Angeles', 'USA', 34.0522, -118.2437, '22222222-2222-2222-2222-222222222222'),

-- Grand Lodge of New York
('33333333-3333-3333-3333-333333333333', 'Manhattan Lodge', '1', 'New York', 'District 1', '71 W 23rd St', 'New York', 'USA', 40.7128, -74.0060, '33333333-3333-3333-3333-333333333333'),
('44444444-4444-4444-4444-444444444444', 'Brooklyn Lodge', '20', 'New York', 'District 2', '67 Livingston St', 'Brooklyn', 'USA', 40.6892, -73.9442, '44444444-4444-4444-4444-444444444444'),

-- Grand Lodge of Texas
('55555555-5555-5555-5555-555555555555', 'Houston Lodge', '1', 'Texas', 'District 1', '1218 W Clay St', 'Houston', 'USA', 29.7604, -95.3698, '55555555-5555-5555-5555-555555555555'),
('66666666-6666-6666-6666-666666666666', 'Dallas Lodge', '14', 'Texas', 'District 2', '1314 Elm St', 'Dallas', 'USA', 32.7767, -96.7970, '66666666-6666-6666-6666-666666666666');

-- Update users with their lodge_id now that lodges exist
UPDATE users SET lodge_id = '11111111-1111-1111-1111-111111111111' WHERE id IN ('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
UPDATE users SET lodge_id = '22222222-2222-2222-2222-222222222222' WHERE id IN ('22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
UPDATE users SET lodge_id = '33333333-3333-3333-3333-333333333333' WHERE id IN ('33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999');
UPDATE users SET lodge_id = '44444444-4444-4444-4444-444444444444' WHERE id IN ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
UPDATE users SET lodge_id = '55555555-5555-5555-5555-555555555555' WHERE id IN ('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
UPDATE users SET lodge_id = '66666666-6666-6666-6666-666666666666' WHERE id IN ('66666666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Insert lodge secretaries relationships
INSERT INTO lodge_secretaries (lodge_id, user_id) VALUES
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333'),
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444'),
('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555'),
('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666');

-- Insert sample events (meetings and charity events in the next 7 days)
INSERT INTO events (id, lodge_id, type, title, description, start_time, end_time, visibility, status, created_by, approved_by) VALUES
-- Regular meetings
('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'meeting', 'Stated Meeting', 'Monthly stated meeting with degree work', NOW() + INTERVAL '2 days' + INTERVAL '7 hours', NOW() + INTERVAL '2 days' + INTERVAL '9 hours', 'members', 'approved', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'meeting', 'Fellowship Dinner', 'Monthly fellowship dinner for all brethren', NOW() + INTERVAL '3 days' + INTERVAL '6 hours', NOW() + INTERVAL '3 days' + INTERVAL '8 hours', 'public', 'approved', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'meeting', 'Entered Apprentice Degree', 'EA degree conferral', NOW() + INTERVAL '4 days' + INTERVAL '7 hours', NOW() + INTERVAL '4 days' + INTERVAL '9 hours', 'members', 'approved', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333'),
('e4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'meeting', 'Table Lodge', 'Formal table lodge with visiting brethren', NOW() + INTERVAL '5 days' + INTERVAL '6 hours 30 minutes', NOW() + INTERVAL '5 days' + INTERVAL '9 hours', 'public', 'approved', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444'),

-- Charity events
('e5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'charity', 'Food Bank Volunteer Day', 'Help sort and distribute food at the local food bank', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '13 hours', 'public', 'approved', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555'),
('e6666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'charity', 'Children''s Hospital Visit', 'Visit children at local hospital with books and games', NOW() + INTERVAL '6 days' + INTERVAL '10 hours', NOW() + INTERVAL '6 days' + INTERVAL '12 hours', 'public', 'approved', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666'),
('e7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'charity', 'Community Clean-up', 'Help clean up the local park and neighborhood', NOW() + INTERVAL '7 days' + INTERVAL '8 hours', NOW() + INTERVAL '7 days' + INTERVAL '12 hours', 'public', 'approved', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

-- Insert sample RSVPs
INSERT INTO event_rsvps (event_id, user_id, status) VALUES
('e1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'yes'),
('e1111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'maybe'),
('e2222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'yes'),
('e2222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', 'yes'),
('e3333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', 'yes'),
('e4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'yes'),
('e5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'yes'),
('e5555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'yes'),
('e6666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'maybe'),
('e7777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'yes');

-- Insert sample presence data (fuzzed coordinates around lodge locations)
INSERT INTO presence (user_id, approx_lat, approx_lng, radius_km) VALUES
('77777777-7777-7777-7777-777777777777', 37.7751, -122.4196, 10), -- Near SF Lodge
('88888888-8888-8888-8888-888888888888', 34.0524, -118.2439, 10), -- Near LA Lodge  
('99999999-9999-9999-9999-999999999999', 40.7130, -74.0062, 10), -- Near Manhattan Lodge
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 40.6894, -73.9444, 10), -- Near Brooklyn Lodge
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 29.7606, -95.3700, 10), -- Near Houston Lodge
('cccccccc-cccc-cccc-cccc-cccccccccccc', 32.7769, -96.7972, 10); -- Near Dallas Lodge

-- Insert sample counters and badges
INSERT INTO counters (user_id, visits, charity) VALUES
('77777777-7777-7777-7777-777777777777', 5, 3),
('88888888-8888-8888-8888-888888888888', 2, 1),
('99999999-9999-9999-9999-999999999999', 8, 4),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 0),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 12, 8),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 20, 12);

-- Award badges based on counters
INSERT INTO user_badges (user_id, badge_id) VALUES
-- Thomas (5 visits, 3 charity)
('77777777-7777-7777-7777-777777777777', (SELECT id FROM badges WHERE code = 'traveling_man')),
('77777777-7777-7777-7777-777777777777', (SELECT id FROM badges WHERE code = 'helping_hand')),

-- Charles (2 visits, 1 charity)  
('88888888-8888-8888-8888-888888888888', (SELECT id FROM badges WHERE code = 'traveling_man')),
('88888888-8888-8888-8888-888888888888', (SELECT id FROM badges WHERE code = 'helping_hand')),

-- Andrew (8 visits, 4 charity)
('99999999-9999-9999-9999-999999999999', (SELECT id FROM badges WHERE code = 'traveling_man')),
('99999999-9999-9999-9999-999999999999', (SELECT id FROM badges WHERE code = 'wandering_mason')),
('99999999-9999-9999-9999-999999999999', (SELECT id FROM badges WHERE code = 'helping_hand')),

-- Richard (1 visit, 0 charity)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM badges WHERE code = 'traveling_man')),

-- Daniel (12 visits, 8 charity)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM badges WHERE code = 'traveling_man')),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM badges WHERE code = 'wandering_mason')),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM badges WHERE code = 'helping_hand')),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM badges WHERE code = 'charity_builder')),

-- Joseph (20 visits, 12 charity)
('cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM badges WHERE code = 'traveling_man')),
('cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM badges WHERE code = 'wandering_mason')),
('cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM badges WHERE code = 'helping_hand')),
('cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM badges WHERE code = 'charity_builder')),
('cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM badges WHERE code = 'beacon_of_light'));

-- Insert sample businesses
INSERT INTO businesses (name, category, city, country, lodge_proximity_km, contact, website) VALUES
('Masonic Supply Co.', 'regalia', 'San Francisco', 'USA', 2, 'info@masonicsupply.com', 'https://masonicsupply.com'),
('The Square & Compass Hotel', 'hotel', 'Los Angeles', 'USA', 1, '+1-213-555-0123', 'https://squarecompasshotel.com'),
('Brotherhood Café', 'restaurant', 'New York', 'USA', 0, '+1-212-555-0456', 'https://brotherhoodcafe.com'),
('Cornerstone Books', 'bookstore', 'Brooklyn', 'USA', 3, 'books@cornerstone.com', 'https://cornerstonebooks.com'),
('Acacia Jewelers', 'jewelry', 'Houston', 'USA', 1, '+1-713-555-0789', 'https://acaciajewelers.com'),
('Freemason Financial Services', 'financial', 'Dallas', 'USA', 2, 'info@freemasonfinancial.com', 'https://freemasonfinancial.com');

-- Populate leaderboards
-- Global leaderboard
INSERT INTO leaderboard_global (user_id, visits, charity, score, rank)
SELECT 
    user_id,
    visits,
    charity,
    visits + (charity * 2) as score,
    ROW_NUMBER() OVER (ORDER BY visits + (charity * 2) DESC) as rank
FROM counters
ORDER BY score DESC;

-- Grand Lodge leaderboards
INSERT INTO leaderboard_by_gl (grand_lodge, user_id, visits, charity, score, rank)
SELECT 
    l.grand_lodge,
    c.user_id,
    c.visits,
    c.charity,
    c.visits + (c.charity * 2) as score,
    ROW_NUMBER() OVER (PARTITION BY l.grand_lodge ORDER BY c.visits + (c.charity * 2) DESC) as rank
FROM counters c
JOIN users u ON c.user_id = u.id
JOIN lodges l ON u.lodge_id = l.id
ORDER BY l.grand_lodge, score DESC;

-- District leaderboards  
INSERT INTO leaderboard_by_district (district, user_id, visits, charity, score, rank)
SELECT 
    l.district,
    c.user_id,
    c.visits,
    c.charity,
    c.visits + (c.charity * 2) as score,
    ROW_NUMBER() OVER (PARTITION BY l.district ORDER BY c.visits + (c.charity * 2) DESC) as rank
FROM counters c
JOIN users u ON c.user_id = u.id
JOIN lodges l ON u.lodge_id = l.id
ORDER BY l.district, score DESC;

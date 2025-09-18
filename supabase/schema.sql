-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    obfuscated_handle TEXT,
    lodge_id UUID,
    role TEXT CHECK (role IN ('brother', 'secretary', 'admin')) DEFAULT 'brother',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lodges table
CREATE TABLE IF NOT EXISTS lodges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    grand_lodge TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    created_by UUID NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lodge secretaries junction table
CREATE TABLE IF NOT EXISTS lodge_secretaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lodge_id UUID NOT NULL REFERENCES lodges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lodge_id, user_id)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lodge_id UUID NOT NULL REFERENCES lodges(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('meeting', 'charity')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    visibility TEXT CHECK (visibility IN ('public', 'members')) DEFAULT 'public',
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('yes', 'no', 'maybe')) NOT NULL,
    checkin_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Verifications table
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method TEXT CHECK (method IN ('secretary', 'vouch')) NOT NULL,
    lodge_id UUID NOT NULL REFERENCES lodges(id),
    verifier_user_id UUID NOT NULL REFERENCES users(id),
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);

-- Vouches table (supporting evidence for vouch verifications)
CREATE TABLE IF NOT EXISTS vouches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    voucher_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(verification_id, voucher_user_id)
);

-- Presence table (fuzzed coordinates)
CREATE TABLE IF NOT EXISTS presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approx_lat DOUBLE PRECISION NOT NULL,
    approx_lng DOUBLE PRECISION NOT NULL,
    radius_km INTEGER DEFAULT 10,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visit confirmations table
CREATE TABLE IF NOT EXISTS visit_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lodge_id UUID NOT NULL REFERENCES lodges(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id),
    confirmed_by UUID NOT NULL REFERENCES users(id),
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charity confirmations table
CREATE TABLE IF NOT EXISTS charity_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    confirmed_by UUID NOT NULL REFERENCES users(id),
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Counters table
CREATE TABLE IF NOT EXISTS counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visits INTEGER DEFAULT 0,
    charity INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    kind TEXT CHECK (kind IN ('visit', 'charity')) NOT NULL,
    threshold INTEGER NOT NULL,
    icon_url TEXT
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Leaderboard tables (materialized views)
CREATE TABLE IF NOT EXISTS leaderboard_global (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    visits INTEGER NOT NULL,
    charity INTEGER NOT NULL,
    score INTEGER NOT NULL,
    rank INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard_by_gl (
    grand_lodge TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visits INTEGER NOT NULL,
    charity INTEGER NOT NULL,
    score INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    PRIMARY KEY (grand_lodge, user_id)
);

CREATE TABLE IF NOT EXISTS leaderboard_by_district (
    district TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visits INTEGER NOT NULL,
    charity INTEGER NOT NULL,
    score INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    PRIMARY KEY (district, user_id)
);

-- Marketplace/businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    lodge_proximity_km INTEGER,
    contact TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key constraints (conditional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_lodge'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_lodge FOREIGN KEY (lodge_id) REFERENCES lodges(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lodges_created_by'
    ) THEN
        ALTER TABLE lodges ADD CONSTRAINT fk_lodges_created_by FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_lodge_id ON users(lodge_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

CREATE INDEX IF NOT EXISTS idx_lodges_grand_lodge ON lodges(grand_lodge);
CREATE INDEX IF NOT EXISTS idx_lodges_district ON lodges(district);
CREATE INDEX IF NOT EXISTS idx_lodges_city ON lodges(city);
CREATE INDEX IF NOT EXISTS idx_lodges_location ON lodges USING GIST (ST_Point(lng, lat));

CREATE INDEX IF NOT EXISTS idx_events_lodge_id ON events(lodge_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);

CREATE INDEX IF NOT EXISTS idx_verifications_subject_user_id ON verifications(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);

CREATE INDEX IF NOT EXISTS idx_presence_user_id ON presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_location ON presence USING GIST (ST_Point(approx_lng, approx_lat));
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence(last_seen);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_counters_user_id ON counters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lodges_updated_at ON lodges;
CREATE TRIGGER update_lodges_updated_at BEFORE UPDATE ON lodges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_counters_updated_at ON counters;
CREATE TRIGGER update_counters_updated_at BEFORE UPDATE ON counters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodge_secretaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_by_gl ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_by_district ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Verified users can view other verified users (limited fields)
CREATE POLICY "Verified users can view other verified users" ON users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND is_verified = true
        )
        AND is_verified = true
    );

-- Lodges policies
CREATE POLICY "Everyone can view lodges" ON lodges
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Secretaries can update their lodges" ON lodges
    FOR UPDATE USING (
        id IN (
            SELECT lodge_id FROM lodge_secretaries 
            WHERE user_id = auth.uid()
        )
    );

-- Events policies
CREATE POLICY "Everyone can view approved public events" ON events
    FOR SELECT USING (status = 'approved' AND visibility = 'public');

CREATE POLICY "Verified users can view approved member events" ON events
    FOR SELECT USING (
        status = 'approved' 
        AND visibility = 'members'
        AND auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND is_verified = true
        )
    );

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Secretaries can approve events for their lodges" ON events
    FOR UPDATE USING (
        lodge_id IN (
            SELECT lodge_id FROM lodge_secretaries 
            WHERE user_id = auth.uid()
        )
    );

-- RSVP policies
CREATE POLICY "Users can manage their own RSVPs" ON event_rsvps
    FOR ALL USING (auth.uid() = user_id);

-- Verification policies
CREATE POLICY "Users can view their own verifications" ON verifications
    FOR SELECT USING (
        auth.uid() = subject_user_id 
        OR auth.uid() = verifier_user_id
    );

CREATE POLICY "Users can request verification" ON verifications
    FOR INSERT WITH CHECK (auth.uid() = subject_user_id);

CREATE POLICY "Secretaries can approve verifications" ON verifications
    FOR UPDATE USING (
        lodge_id IN (
            SELECT lodge_id FROM lodge_secretaries 
            WHERE user_id = auth.uid()
        )
    );

-- Presence policies
CREATE POLICY "Users can manage their own presence" ON presence
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Verified users can view nearby presence" ON presence
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND is_verified = true
        )
    );

-- Messaging policies
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their conversation participations" ON conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() 
        OR conversation_id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id 
        AND conversation_id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Confirmation policies
CREATE POLICY "Secretaries can create visit confirmations" ON visit_confirmations
    FOR INSERT WITH CHECK (
        lodge_id IN (
            SELECT lodge_id FROM lodge_secretaries 
            WHERE user_id = auth.uid()
        )
        AND auth.uid() = confirmed_by
    );

CREATE POLICY "Secretaries can create charity confirmations" ON charity_confirmations
    FOR INSERT WITH CHECK (
        auth.uid() = confirmed_by
        AND event_id IN (
            SELECT e.id FROM events e
            JOIN lodge_secretaries ls ON e.lodge_id = ls.lodge_id
            WHERE ls.user_id = auth.uid()
        )
    );

-- Counters policies
CREATE POLICY "Users can view their own counters" ON counters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users' counters" ON counters
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND is_verified = true
        )
    );

-- Badges policies
CREATE POLICY "Everyone can view badges" ON badges
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users' badges" ON user_badges
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND is_verified = true
        )
    );

-- Leaderboard policies
CREATE POLICY "Verified users can view global leaderboard" ON leaderboard_global
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND is_verified = true
        )
    );

CREATE POLICY "Verified users can view GL leaderboard" ON leaderboard_by_gl
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND is_verified = true
        )
    );

CREATE POLICY "Verified users can view district leaderboard" ON leaderboard_by_district
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND is_verified = true
        )
    );

-- Businesses policies
CREATE POLICY "Everyone can view businesses" ON businesses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage businesses" ON businesses
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

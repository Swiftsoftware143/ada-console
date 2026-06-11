-- ADASwift User Management Database Schema
-- System tag is HARD-CODED to: adaswift-signuppage

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    system_tag TEXT NOT NULL DEFAULT 'adaswift-signuppage',
    plan_id TEXT NOT NULL CHECK (plan_id IN ('basic', 'business', 'agency')),
    mintbird_customer_id TEXT,
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_system_tag ON user_profiles(system_tag);
CREATE INDEX idx_user_profiles_plan_id ON user_profiles(plan_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(subscription_status);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can view all profiles" ON user_profiles FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin can update all profiles" ON user_profiles FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_profiles IS '
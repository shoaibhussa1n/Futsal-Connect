# Supabase Setup Guide - Manual Steps

Follow these steps to set up your Supabase database. This is the only part you need to do manually.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Futsal Hub Karachi (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (2-3 minutes)

## Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
3. Add these to your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

## Step 3: Run Database Schema SQL

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy and paste the SQL from the section below
4. Click **Run** (or press Ctrl+Enter)
5. Wait for all tables to be created

### Complete SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  captain_id UUID NOT NULL REFERENCES profiles(id),
  logo_url TEXT,
  age_group TEXT NOT NULL CHECK (age_group IN ('U16', 'U18', 'U21', 'Open')),
  team_level INTEGER NOT NULL CHECK (team_level >= 1 AND team_level <= 10),
  rating NUMERIC(3,1) DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 10.0),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 0,
  total_mvps INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position TEXT CHECK (position IN ('Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger', 'Any Position')),
  skill_level INTEGER NOT NULL CHECK (skill_level >= 1 AND skill_level <= 10),
  age INTEGER,
  height NUMERIC(5,2), -- Height in cm
  weight NUMERIC(5,2), -- Weight in kg
  experience TEXT, -- Experience level (e.g., 'Beginner (0-1 years)', 'Intermediate (1-3 years)', etc.)
  city TEXT DEFAULT 'Karachi',
  availability_days TEXT[],
  preferred_time TEXT CHECK (preferred_time IN ('morning', 'afternoon', 'evening')),
  bio TEXT,
  photo_url TEXT,
  matches_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  mvps INTEGER DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 10.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('captain', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_a_id UUID NOT NULL REFERENCES teams(id),
  team_b_id UUID NOT NULL REFERENCES teams(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  scheduled_date DATE,
  scheduled_time TIME,
  location TEXT,
  team_a_score INTEGER,
  team_b_score INTEGER,
  mvp_player_id UUID REFERENCES players(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_requests table
CREATE TABLE match_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_team_id UUID NOT NULL REFERENCES teams(id),
  requested_team_id UUID NOT NULL REFERENCES teams(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  proposed_date DATE,
  proposed_time TIME,
  proposed_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organizer_id UUID NOT NULL,
  organizer_type TEXT NOT NULL CHECK (organizer_type IN ('team', 'individual')),
  status TEXT NOT NULL CHECK (status IN ('pending_approval', 'open', 'filling', 'in_progress', 'completed', 'cancelled')),
  fee NUMERIC(10,2) DEFAULT 0,
  prize TEXT NOT NULL,
  start_date DATE NOT NULL,
  max_teams INTEGER NOT NULL,
  current_teams INTEGER DEFAULT 0,
  format TEXT NOT NULL DEFAULT '5v5',
  description TEXT,
  admin_approved BOOLEAN DEFAULT FALSE,
  admin_approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_registrations table
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK ((team_id IS NOT NULL AND player_id IS NULL) OR (team_id IS NULL AND player_id IS NOT NULL))
);

-- Create player_invitations table
CREATE TABLE player_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('team', 'match')),
  match_id UUID REFERENCES matches(id),
  match_fee NUMERIC(10,2),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_scorers table
CREATE TABLE goal_scorers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  goals INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_teams_captain_id ON teams(captain_id);
CREATE INDEX idx_teams_rating ON teams(rating DESC);
CREATE INDEX idx_players_profile_id ON players(profile_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_skill_level ON players(skill_level);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_player_id ON team_members(player_id);
CREATE INDEX idx_matches_team_a_id ON matches(team_a_id);
CREATE INDEX idx_matches_team_b_id ON matches(team_b_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_date ON matches(scheduled_date);
CREATE INDEX idx_match_requests_requester_team_id ON match_requests(requester_team_id);
CREATE INDEX idx_match_requests_requested_team_id ON match_requests(requested_team_id);
CREATE INDEX idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_admin_approved ON tournaments(admin_approved);
CREATE INDEX idx_player_invitations_player_id ON player_invitations(player_id);
CREATE INDEX idx_player_invitations_status ON player_invitations(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_scorers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Teams: Public read, captains can update
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Anyone can create teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Team captains can update their team" ON teams FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE id = teams.captain_id)
);

-- Players: Public read, players can update own
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Users can create own player profile" ON players FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM profiles WHERE id = players.profile_id)
);
CREATE POLICY "Players can update own profile" ON players FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE id = players.profile_id)
);

-- Team Members: Members can read, captains can manage
CREATE POLICY "Team members are viewable by everyone" ON team_members FOR SELECT USING (true);
CREATE POLICY "Team captains can add members" ON team_members FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (SELECT captain_id FROM teams WHERE id = team_members.team_id)
  )
);
CREATE POLICY "Team captains can remove members" ON team_members FOR DELETE USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (SELECT captain_id FROM teams WHERE id = team_members.team_id)
  )
);

-- Matches: Public read, captains can create/update
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Team captains can create matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Team captains can update matches" ON matches FOR UPDATE USING (true);

-- Match Requests: Teams can see their requests
CREATE POLICY "Teams can view their match requests" ON match_requests FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = match_requests.requester_team_id OR id = match_requests.requested_team_id
    )
  )
);
CREATE POLICY "Team captains can create match requests" ON match_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Team captains can update match requests" ON match_requests FOR UPDATE USING (true);

-- Tournaments: Public read, organizers can manage
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Anyone can create tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizers can update tournaments" ON tournaments FOR UPDATE USING (true);

-- Tournament Registrations: Public read, teams/players can register
CREATE POLICY "Registrations are viewable by everyone" ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Teams can register for tournaments" ON tournament_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizers can update registrations" ON tournament_registrations FOR UPDATE USING (true);

-- Player Invitations: Players can see their invitations
CREATE POLICY "Players can view their invitations" ON player_invitations FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (SELECT profile_id FROM players WHERE id = player_invitations.player_id)
  )
);
CREATE POLICY "Team captains can create invitations" ON player_invitations FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update invitation status" ON player_invitations FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (SELECT profile_id FROM players WHERE id = player_invitations.player_id)
  )
);

-- Goal Scorers: Public read, captains can add
CREATE POLICY "Goal scorers are viewable by everyone" ON goal_scorers FOR SELECT USING (true);
CREATE POLICY "Team captains can add goal scorers" ON goal_scorers FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_requests_updated_at BEFORE UPDATE ON match_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_invitations_updated_at BEFORE UPDATE ON player_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 4: Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket** for each:

### Bucket 1: `team-logos`
- **Name**: `team-logos`
- **Public bucket**: ✅ Yes
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/webp`

### Bucket 2: `player-photos`
- **Name**: `player-photos`
- **Public bucket**: ✅ Yes
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/webp`

### Bucket 3: `avatars`
- **Name**: `avatars`
- **Public bucket**: ✅ Yes
- **File size limit**: 1 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/webp`

## Step 5: Set Up Storage Policies (Optional but Recommended)

For each bucket, go to **Policies** and add:

### For `team-logos`:
```sql
-- Allow public read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'team-logos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'team-logos' AND auth.role() = 'authenticated');
```

### For `player-photos`:
```sql
-- Allow public read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'player-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'player-photos' AND auth.role() = 'authenticated');
```

### For `avatars`:
```sql
-- Allow public read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
```

## Step 6: (Optional) Create Database Functions

These functions help with rating calculations. You can create them later if needed:

```sql
-- Function to calculate team rating
CREATE OR REPLACE FUNCTION calculate_team_rating(team_id uuid)
RETURNS void AS $$
DECLARE
  team_wins integer;
  team_losses integer;
  team_mvps integer;
  new_rating numeric;
BEGIN
  SELECT wins, losses, total_mvps INTO team_wins, team_losses, team_mvps
  FROM teams WHERE id = team_id;
  
  -- Base rating: 5.0
  -- Win: +0.2, Loss: -0.1, MVP: +0.1
  new_rating := 5.0 + (team_wins * 0.2) - (team_losses * 0.1) + (team_mvps * 0.1);
  
  -- Cap between 1.0 and 10.0
  new_rating := GREATEST(1.0, LEAST(10.0, new_rating));
  
  UPDATE teams SET rating = new_rating WHERE id = team_id;
END;
$$ LANGUAGE plpgsql;
```

## Step 7: Verify Setup

1. Go to **Table Editor** in Supabase
2. You should see all tables:
   - profiles
   - teams
   - players
   - team_members
   - matches
   - match_requests
   - tournaments
   - tournament_registrations
   - player_invitations
   - goal_scorers

3. Go to **Storage**
4. You should see three buckets

## ✅ Done!

Your Supabase database is now set up. The app should work once you:
1. Have your `.env` file with credentials
2. Run `npm run dev`

## Troubleshooting

**Error: "relation does not exist"**
- Make sure you ran all the SQL in one go
- Check that all tables were created in Table Editor

**Error: "permission denied"**
- Check RLS policies are created
- Verify storage bucket policies

**Error: "bucket does not exist"**
- Make sure you created all three buckets
- Check bucket names match exactly

---

**Need help?** Check the main `SETUP.md` file or Supabase documentation.


# Futsal Hub Karachi - Setup Guide

This guide will help you set up the Futsal Hub Karachi web app with Supabase backend and PWA support.

## Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account (free tier works)
- Basic knowledge of React and TypeScript

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note your project URL and anon key from Settings > API

### 2.2 Set Up Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAIL=your_admin_email@example.com
```

### 2.3 Set Up Database Schema

Run the SQL scripts in Supabase SQL Editor. The schema is documented in `src/lib/database-schema.md`.

**Quick Setup SQL:**

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

-- Create indexes
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

-- Create RLS policies (basic - customize as needed)
-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Teams: Public read, captains can update
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Team captains can update their team" ON teams FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = captain_id));

-- Players: Public read, players can update own
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Players can update own profile" ON players FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = profile_id));

-- Matches: Public read, captains can create/update
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Team captains can create matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Team captains can update matches" ON matches FOR UPDATE USING (true);

-- Add more policies as needed for your security requirements
```

### 2.4 Set Up Storage Buckets

1. Go to Storage in Supabase dashboard
2. Create three buckets:
   - `team-logos` (public)
   - `player-photos` (public)
   - `avatars` (public)
3. Set up bucket policies to allow public read access

## Step 3: Create PWA Icons

Create icon files in the `public` directory:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `favicon.ico`

You can use a tool like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) to generate these.

## Step 4: Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 5: Build for Production

```bash
npm run build
```

The built files will be in the `build` directory.

## Next Steps

1. **Set up authentication flows** - Update `LoginSignup.tsx` to use the AuthContext
2. **Connect components to API** - Update components to use functions from `src/lib/api.ts`
3. **Implement rating system** - Create database functions for auto-updating ratings
4. **Add admin features** - Implement tournament approval system
5. **Set up notifications** - Use Supabase Realtime for live updates

## Database Functions to Create

You'll need to create these functions in Supabase:

1. `calculate_team_rating(team_id uuid)` - Updates team rating
2. `calculate_player_rating(player_id uuid)` - Updates player rating
3. `increment_team_wins(team_id uuid)` - Increments wins
4. `increment_team_losses(team_id uuid)` - Increments losses
5. `increment_team_draws(team_id uuid)` - Increments draws

See `src/lib/database-schema.md` for more details.

## Troubleshooting

### PWA not working
- Make sure you're serving over HTTPS (required for PWA)
- Check browser console for service worker errors
- Clear browser cache and re-register service worker

### Supabase connection issues
- Verify your environment variables are set correctly
- Check Supabase project is active
- Verify RLS policies allow your operations

### Build errors
- Make sure all dependencies are installed
- Check TypeScript errors
- Verify all environment variables are set

## Support

For issues or questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/)


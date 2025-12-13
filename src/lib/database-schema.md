# Database Schema Documentation

This document describes the Supabase database schema for Futsal Hub Karachi.

## Tables

### 1. `profiles`
User profile information linked to Supabase Auth.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users.id, unique)
- `full_name` (text, nullable)
- `email` (text, nullable)
- `phone` (text, nullable)
- `avatar_url` (text, nullable) - Supabase Storage URL
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Unique index on `user_id`

**RLS Policies:**
- Users can read their own profile
- Users can update their own profile
- Public read for basic info (name, avatar) for marketplace

---

### 2. `teams`
Team information and statistics.

**Columns:**
- `id` (uuid, primary key)
- `name` (text, required)
- `captain_id` (uuid, foreign key → profiles.id)
- `logo_url` (text, nullable) - Supabase Storage URL
- `age_group` (text) - 'U16' | 'U18' | 'U21' | 'Open'
- `team_level` (integer, 1-10)
- `rating` (numeric, default 5.0) - Calculated from wins, losses, and performance
- `wins` (integer, default 0)
- `losses` (integer, default 0)
- `draws` (integer, default 0)
- `total_goals` (integer, default 0)
- `total_mvps` (integer, default 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Index on `captain_id`
- Index on `rating` (for leaderboard queries)

**RLS Policies:**
- Public read access
- Team captain can update their team
- Team members can read their team details

**Rating Calculation:**
- Base rating: 5.0
- Win: +0.2 per win
- Loss: -0.1 per loss
- MVP in match: +0.1 per MVP
- Rating capped between 1.0 and 10.0

---

### 3. `players`
Individual player profiles and statistics.

**Columns:**
- `id` (uuid, primary key)
- `profile_id` (uuid, foreign key → profiles.id, unique)
- `position` (text, nullable) - 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward' | 'Winger' | 'Any Position'
- `skill_level` (integer, 1-10)
- `age` (integer, nullable)
- `city` (text, default 'Karachi')
- `availability_days` (text[], array of day names)
- `preferred_time` (text, nullable) - 'morning' | 'afternoon' | 'evening'
- `bio` (text, nullable)
- `photo_url` (text, nullable) - Supabase Storage URL
- `matches_played` (integer, default 0)
- `goals` (integer, default 0)
- `assists` (integer, default 0)
- `mvps` (integer, default 0)
- `rating` (numeric, default 5.0) - Calculated from performance
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Unique index on `profile_id`
- Index on `position` (for marketplace filtering)
- Index on `skill_level` (for marketplace filtering)
- Index on `city` (for location filtering)

**RLS Policies:**
- Public read access for marketplace
- Players can update their own profile
- Players can delete their own profile

---

### 4. `team_members`
Junction table for team-player relationships.

**Columns:**
- `id` (uuid, primary key)
- `team_id` (uuid, foreign key → teams.id)
- `player_id` (uuid, foreign key → players.id)
- `role` (text) - 'captain' | 'member'
- `joined_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Unique composite index on (`team_id`, `player_id`)
- Index on `team_id`
- Index on `player_id`

**RLS Policies:**
- Team members can read their team's members
- Team captain can add/remove members
- Players can see which teams they're in

---

### 5. `matches`
Match information and results.

**Columns:**
- `id` (uuid, primary key)
- `team_a_id` (uuid, foreign key → teams.id)
- `team_b_id` (uuid, foreign key → teams.id)
- `status` (text) - 'pending' | 'confirmed' | 'completed' | 'cancelled'
- `scheduled_date` (date, nullable)
- `scheduled_time` (time, nullable)
- `location` (text, nullable)
- `team_a_score` (integer, nullable)
- `team_b_score` (integer, nullable)
- `mvp_player_id` (uuid, nullable, foreign key → players.id)
- `notes` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Index on `team_a_id`
- Index on `team_b_id`
- Index on `status`
- Index on `scheduled_date` (for upcoming matches)

**RLS Policies:**
- Public read access
- Team captains can create matches
- Team captains can update their team's matches
- Both teams can submit results (with validation)

---

### 6. `match_requests`
Match requests between teams.

**Columns:**
- `id` (uuid, primary key)
- `requester_team_id` (uuid, foreign key → teams.id)
- `requested_team_id` (uuid, foreign key → teams.id)
- `status` (text) - 'pending' | 'accepted' | 'rejected' | 'cancelled'
- `proposed_date` (date, nullable)
- `proposed_time` (time, nullable)
- `proposed_location` (text, nullable)
- `notes` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Index on `requester_team_id`
- Index on `requested_team_id`
- Index on `status`

**RLS Policies:**
- Teams can read their own requests
- Team captains can create requests
- Requested team can accept/reject

---

### 7. `tournaments`
Tournament information.

**Columns:**
- `id` (uuid, primary key)
- `name` (text, required)
- `organizer_id` (uuid) - Can be team_id or profile_id depending on organizer_type
- `organizer_type` (text) - 'team' | 'individual'
- `status` (text) - 'pending_approval' | 'open' | 'filling' | 'in_progress' | 'completed' | 'cancelled'
- `fee` (numeric, default 0)
- `prize` (text)
- `start_date` (date)
- `max_teams` (integer)
- `current_teams` (integer, default 0)
- `format` (text) - '5v5', '7v7', etc.
- `description` (text, nullable)
- `admin_approved` (boolean, default false)
- `admin_approved_by` (uuid, nullable, foreign key → profiles.id)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Index on `organizer_id`
- Index on `status`
- Index on `admin_approved`
- Index on `start_date`

**RLS Policies:**
- Public read access
- Organizers can create tournaments
- Organizers can update their tournaments
- Only admins can approve tournaments

---

### 8. `tournament_registrations`
Team/player registrations for tournaments.

**Columns:**
- `id` (uuid, primary key)
- `tournament_id` (uuid, foreign key → tournaments.id)
- `team_id` (uuid, nullable, foreign key → teams.id)
- `player_id` (uuid, nullable, foreign key → players.id)
- `status` (text) - 'pending' | 'approved' | 'rejected'
- `created_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Unique composite index on (`tournament_id`, `team_id`) where team_id is not null
- Unique composite index on (`tournament_id`, `player_id`) where player_id is not null
- Index on `tournament_id`
- Index on `status`

**RLS Policies:**
- Public read access
- Teams/players can register
- Tournament organizers can approve/reject registrations

---

### 9. `player_invitations`
Team invitations to players (lifetime or per-match).

**Columns:**
- `id` (uuid, primary key)
- `team_id` (uuid, foreign key → teams.id)
- `player_id` (uuid, foreign key → players.id)
- `invitation_type` (text) - 'team' | 'match'
- `match_id` (uuid, nullable, foreign key → matches.id)
- `match_fee` (numeric, nullable)
- `status` (text) - 'pending' | 'accepted' | 'rejected'
- `message` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Index on `team_id`
- Index on `player_id`
- Index on `status`
- Index on `invitation_type`

**RLS Policies:**
- Players can read their invitations
- Team captains can create invitations
- Players can accept/reject invitations

---

### 10. `goal_scorers`
Goal scorer records for matches.

**Columns:**
- `id` (uuid, primary key)
- `match_id` (uuid, foreign key → matches.id)
- `player_id` (uuid, foreign key → players.id)
- `team_id` (uuid, foreign key → teams.id)
- `goals` (integer, default 1)
- `created_at` (timestamp)

**Indexes:**
- Primary key on `id`
- Index on `match_id`
- Index on `player_id`
- Index on `team_id`

**RLS Policies:**
- Public read access
- Team captains can add goal scorers for their matches

---

## Database Functions

### 1. `calculate_team_rating(team_id uuid)`
Calculates and updates team rating based on wins, losses, and MVPs.

### 2. `calculate_player_rating(player_id uuid)`
Calculates and updates player rating based on goals, assists, MVPs, and match performance.

### 3. `update_match_stats(match_id uuid)`
Updates team and player statistics after a match result is submitted.

### 4. `check_tournament_capacity(tournament_id uuid)`
Checks if tournament has available slots and updates status accordingly.

---

## Storage Buckets

### 1. `team-logos`
- Public access for reading
- Only team captains can upload
- Max file size: 2MB
- Allowed types: image/png, image/jpeg, image/webp

### 2. `player-photos`
- Public access for reading
- Only players can upload their own photos
- Max file size: 2MB
- Allowed types: image/png, image/jpeg, image/webp

### 3. `avatars`
- Public access for reading
- Users can upload their own avatars
- Max file size: 1MB
- Allowed types: image/png, image/jpeg, image/webp

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies are defined to:
- Allow public read access where appropriate (marketplace, leaderboard)
- Restrict write access to authorized users
- Ensure users can only modify their own data
- Allow team captains to manage their teams

---

## Triggers

### 1. `update_updated_at`
Automatically updates the `updated_at` timestamp on row updates.

### 2. `update_team_rating_on_match_complete`
Automatically recalculates team ratings when a match is completed.

### 3. `update_player_stats_on_match_complete`
Automatically updates player statistics when a match is completed.

---

## Notes

- All UUIDs are generated using `gen_random_uuid()`
- Timestamps use `now()` for defaults
- Rating calculations are done via database functions to ensure consistency
- Leaderboard queries use materialized views for performance (optional optimization)


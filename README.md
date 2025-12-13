# Futsal Connect - Production Ready 🚀

A fully functional futsal team and player matchmaking platform for Karachi, built with React, TypeScript, Vite, and Supabase.

## ✨ Features

- **User Authentication**: Email/password signup and login
- **Profile Management**: Complete user profiles with height, weight, skill level, experience, and position
- **Team Registration**: Create teams with logos, member management, and stats
- **Player Registration**: Register as individual players with detailed profiles
- **Matchmaking**: Find and request matches with other teams
- **Leaderboard**: Auto-updating rankings based on performance
- **Tournaments**: Create and join tournaments
- **Player Marketplace**: Browse and recruit players
- **PWA Support**: Installable web app with offline capabilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git (for deployment)

### Installation

1. **Clone and Install**:
   ```bash
   npm install
   ```

2. **Set Up Supabase**:
   - Follow the complete guide in `SUPABASE_SETUP_GUIDE.md`
   - Create your Supabase project
   - Run the SQL schema
   - Set up storage buckets
   - Get your API credentials

3. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ProfileCompletion.tsx    # Post-signup profile setup
│   │   ├── PathSelection.tsx        # Choose player/team path
│   │   ├── HomeScreen.tsx           # Main dashboard
│   │   ├── MatchmakingScreen.tsx    # Find matches
│   │   ├── TeamsScreen.tsx          # Browse teams
│   │   ├── TournamentsScreen.tsx     # Tournaments
│   │   ├── UserProfile.tsx          # User profile
│   │   └── ...                      # Other components
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication context
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   └── api.ts                    # API functions
│   └── App.tsx                      # Main app component
├── public/
│   └── manifest.json                # PWA manifest
├── SUPABASE_SETUP_GUIDE.md          # Database setup instructions
├── DEPLOYMENT.md                     # Deployment guide
└── PRODUCTION_READY.md               # Production checklist
```

## 🎯 User Flow

1. **Sign Up**: User creates account with email/password
2. **Profile Completion**: User fills in profile details (name, age, height, weight, skill, experience, position, photo)
3. **Path Selection**: User chooses:
   - Register as Individual Player
   - Create a Team
   - Join an Existing Team
4. **App Usage**: User can now:
   - Browse teams and request matches
   - View leaderboard
   - Join tournaments
   - Manage their profile/team
   - Recruit players (if team captain)

## 🗄️ Database Schema

The app uses Supabase with the following main tables:
- `profiles` - User profiles
- `players` - Player profiles with stats
- `teams` - Team information
- `matches` - Match records
- `tournaments` - Tournament information
- `player_requests` - Player join/hire requests
- `match_requests` - Match requests between teams

See `SUPABASE_SETUP_GUIDE.md` for complete schema.

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deploy!

See `DEPLOYMENT.md` for detailed instructions.

## 📝 Important Notes

### Mock Data Removed ✅
- All fake/hardcoded data has been removed
- All components now fetch real data from Supabase
- Empty states are shown when no data exists

### Database Updates Required
The database schema includes new fields:
- `height` (NUMERIC) - Player height in cm
- `weight` (NUMERIC) - Player weight in kg
- `experience` (TEXT) - Experience level

**Make sure to update your Supabase schema** with these fields. See `SUPABASE_SETUP_GUIDE.md` for the updated SQL.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router
- **PWA**: Vite PWA Plugin
- **Icons**: Lucide React

## 📚 Documentation

- `SUPABASE_SETUP_GUIDE.md` - Complete Supabase setup instructions
- `DEPLOYMENT.md` - Step-by-step deployment guide
- `PRODUCTION_READY.md` - Production checklist and features

## 🐛 Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (18+)
- Verify environment variables are set

### API Errors
- Check Supabase project is active
- Verify environment variables match Supabase credentials
- Check Supabase logs for database errors

### Authentication Issues
- Verify Supabase Auth is enabled
- Check email confirmation settings
- Ensure redirect URLs are configured

## 📄 License

This project is private and proprietary.

## 🙏 Support

For issues or questions:
1. Check the documentation files
2. Review Supabase logs
3. Check browser console for errors
4. Verify all setup steps are completed

---

**Ready to deploy!** 🎉 Just complete the Supabase setup and push to Vercel!

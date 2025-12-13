# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your project URL and anon key
3. Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Setup

1. Go to Supabase SQL Editor
2. Copy SQL from `SETUP.md` (Step 2.3)
3. Run the SQL script
4. Create storage buckets: `team-logos`, `player-photos`, `avatars`

### 4. Create PWA Icons

Create these files in `public/`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)
- `favicon.ico`

### 5. Run the App

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Key Files

- **`src/lib/supabase.ts`** - Supabase client
- **`src/lib/api.ts`** - All API functions
- **`src/contexts/AuthContext.tsx`** - Authentication
- **`SETUP.md`** - Detailed setup instructions
- **`PROJECT_STATUS.md`** - Current status and next steps

## 🔗 Quick Links

- [Full Setup Guide](./SETUP.md)
- [Project Status](./PROJECT_STATUS.md)
- [Database Schema](./src/lib/database-schema.md)

## ⚡ Next Steps

1. ✅ Infrastructure is ready
2. 🔄 Connect components to API (see `PROJECT_STATUS.md`)
3. 🎨 Test the UI
4. 🚀 Deploy!

---

**Need Help?** Check `SETUP.md` for detailed instructions.


# Family Task Tracker — Vercel Deploy Guide

## Files
| File | Purpose |
|---|---|
| `index.html` | Main app — all features |
| `inject-env.js` | Vercel serverless function that injects env vars |
| `vercel.json` | Routing config |

---

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/task-tracker.git
git push -u origin main
```

### 2. Import into Vercel
- Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
- Select your repo → Deploy

### 3. Set Environment Variables
In Vercel → Project → Settings → **Environment Variables**, add:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key from Google AI Studio |
| `ADMIN_PASSWORD` | Your chosen admin password (default: `family2025`) |

Then **Redeploy** after setting variables.

---

## Features

### ✅ Tamil Translation & Text-to-Speech
- Every task in **Dass's** sections shows an automatic Tamil translation below the English text
- The 🔊 button speaks the task aloud in Tamil using your device's TTS engine
- Translation priority: Static map → Gemini API → MyMemory fallback
- Grocery items also have a 🔊 Tamil speak button

### ✅ Admin Mode (Password Protected)
- Click **🔒 Admin** in the header
- Enter your admin password (set in Vercel env vars)
- Admin mode unlocks: Add task rows + Delete (🗑) buttons for all sections and grocery
- Click **Log out** in the admin banner to lock again

### ✅ Enhanced Grocery List
- Items grouped by category (Veggies, Dairy, Grains, Spices, etc.)
- Quantity badges, category tags, Tamil speak button per item
- "Clear bought" and "Clear all" action buttons
- Nicer card design with gradient header and icon

### ✅ All Original Features Preserved
- Weekly & Daily tabs
- Day navigation with dot strip
- Per-person progress bars
- Google Sheets sync
- Due date badges (overdue / today / upcoming)
- Inline double-click editing
- Local storage with Google Sheets sync

---

## Get a Gemini API Key
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in → Get API key
3. Create a new key → Copy it
4. Paste into Vercel environment variable `GEMINI_API_KEY`

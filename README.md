# 🏠 Household Tracker

A beautiful, real-time household task tracker for your family.

---

## 📁 File Structure

```
household-tracker/
├── index.html                  # Home — person selector
├── vercel.json                 # Vercel routing
├── supabase-schema.sql         # Run once in Supabase
│
├── pages/
│   ├── admin.html              # Owner dashboard
│   ├── person.html             # Individual task view
│   └── history.html            # Analytics + history
│
├── js/
│   ├── supabase.js             # All DB calls
│   ├── admin.js                # Admin logic
│   ├── person.js               # Person view logic
│   ├── history.js              # History logic
│   └── utils.js                # Shared helpers
│
├── css/
│   ├── base.css                # Variables, reset, shared
│   ├── admin.css               # Admin styles
│   ├── person.css              # Person view styles
│   └── history.css             # History styles
│
└── api/
    └── send-summary.js         # Vercel serverless — email via Resend
```

---

## 🚀 Deployment Guide

### Step 1 — Supabase Setup (~10 mins)

1. Go to [supabase.com](https://supabase.com) → create a free account
2. Click **New Project** → fill in name and password
3. Once ready, go to **SQL Editor** → paste the contents of `supabase-schema.sql` → click **Run**
4. Go to **Settings → API** → copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `anon / public` key → this is your `SUPABASE_ANON_KEY`

### Step 2 — Resend Setup (for email, ~5 mins)

1. Go to [resend.com](https://resend.com) → create free account
2. Add and verify your domain (or use the Resend sandbox for testing)
3. Go to **API Keys** → create a new key → copy it as `RESEND_API_KEY`
4. In `api/send-summary.js`, update the `from:` field with your verified domain email

### Step 3 — GitHub

1. Create a new GitHub repo (e.g. `household-tracker`)
2. Upload all files maintaining the folder structure
3. Commit and push

### Step 4 — Vercel (~3 mins)

1. Go to [vercel.com](https://vercel.com) → login with GitHub
2. Click **Add New Project** → import your `household-tracker` repo
3. **Before deploying**, go to **Environment Variables** and add:

| Variable Name       | Value                        |
|---------------------|------------------------------|
| `SUPABASE_URL`      | Your Supabase project URL    |
| `SUPABASE_ANON_KEY` | Your Supabase anon key       |
| `GEMINI_API_KEY`    | Your Google Gemini API key   |
| `RESEND_API_KEY`    | Your Resend API key          |

4. Click **Deploy** → done! You'll get a URL like `household-tracker.vercel.app`

### Step 5 — Inject ENV into HTML

Since this is a plain HTML project (no build step), you need to replace the
`%%VARIABLE%%` placeholders in the HTML files with your actual values, OR
use a simple Vercel Edge Middleware to inject them.

**Easiest approach — Replace directly in HTML before pushing:**

In each HTML file, replace:
```
'%%SUPABASE_URL%%'      → 'https://yourproject.supabase.co'
'%%SUPABASE_ANON_KEY%%' → 'your-anon-key-here'
'%%GEMINI_API_KEY%%'    → 'your-gemini-key-here'
```

> ⚠️ Note: `SUPABASE_ANON_KEY` and `GEMINI_API_KEY` will be visible in the browser.
> This is fine for the anon key (it's designed to be public + protected by RLS).
> For Gemini, consider rate-limiting or moving summarisation to the serverless function later.

---

## 🔗 URLs After Deploy

| Who        | URL                                          |
|------------|----------------------------------------------|
| Home       | `https://yoursite.vercel.app`                |
| Admin      | `https://yoursite.vercel.app/admin`          |
| History    | `https://yoursite.vercel.app/history`        |
| Dass       | `https://yoursite.vercel.app/person?person=dass`     |
| Karthiga   | `https://yoursite.vercel.app/person?person=karthiga` |
| Selvi      | `https://yoursite.vercel.app/person?person=selvi`    |
| Ajitha     | `https://yoursite.vercel.app/person?person=ajitha`   |
| Amma       | `https://yoursite.vercel.app/person?person=amma`     |
| Appa       | `https://yoursite.vercel.app/person?person=appa`     |

---

## 🔮 Future Enhancements

- [ ] Vercel cron job to auto-generate daily tasks at midnight
- [ ] WhatsApp summary via Twilio
- [ ] Push notifications (PWA)
- [ ] React Native / Expo mobile app (reuses same Supabase backend)
- [ ] Photo proof of task completion
- [ ] Gemini-powered smart task suggestions based on history

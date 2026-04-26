# Family Task Tracker — Deploy Guide

## Folder structure (push exactly this to GitHub)

```
/
├── index.html              ← Full app
├── inject-env.js           ← Vercel function: serves index with env vars
├── vercel.json             ← Routes + Vercel Cron schedule
├── supabase-schema.sql     ← Run once in Supabase SQL editor
└── api/
    ├── send-email.js       ← Resend email API
    └── cron-email.js       ← Called by Vercel Cron
```

---

## Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** → paste contents of `supabase-schema.sql` → **Run**
3. Go to **Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`

---

## Step 2 — Resend Setup

1. Go to [resend.com](https://resend.com) → Sign up (free)
2. **API Keys** → Create → copy the `re_...` key → `RESEND_API_KEY`
3. **Domains** → Add your domain → verify DNS
4. Set `EMAIL_FROM` to `Task Tracker <noreply@yourdomain.com>`
   - Testing without a domain: use `onboarding@resend.dev` and send only to your signup email

---

## Step 3 — Gemini API Key (Tamil translation)

1. Go to [aistudio.google.com](https://aistudio.google.com) → Get API key → Create
2. Copy key → `GEMINI_API_KEY`
3. **This is the key that powers Tamil translation AND TTS.**
   - Tamil text translation: uses Gemini API → static map → MyMemory fallback
   - Text-to-Speech: uses the **browser's built-in Web Speech API** (`ta-IN` voice)
   - On iOS/macOS: Tamil voice is built-in. On Android/Windows: install Tamil TTS in Settings.
   - The Gemini key is for translation only — TTS is always free via the browser.

---

## Step 4 — Push to GitHub

```bash
git init
git add .
git commit -m "Task Tracker v3"
git remote add origin https://github.com/YOUR_USERNAME/task-tracker.git
git push -u origin main
```

---

## Step 5 — Deploy on Vercel

1. [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. **Settings → Environment Variables** — add all of these:

| Variable           | Value                                      | Required |
|--------------------|--------------------------------------------|----------|
| `SUPABASE_URL`     | `https://xxxx.supabase.co`                 | ✅       |
| `SUPABASE_ANON_KEY`| `eyJ...` (anon public key)                 | ✅       |
| `ADMIN_PASSWORD`   | Your chosen admin password                 | ✅       |
| `RESEND_API_KEY`   | `re_...`                                   | ✅       |
| `EMAIL_FROM`       | `Task Tracker <noreply@yourdomain.com>`    | ✅       |
| `CRON_EMAIL_TO`    | `you@email.com,other@email.com`            | ✅       |
| `GEMINI_API_KEY`   | `AIza...`                                  | Optional |
| `CRON_SECRET`      | Any random string (protects cron endpoint) | Optional |

3. **Deploy** → done.

---

## Changing the Cron Schedule

The default in `vercel.json` is `"0 15 * * *"` = **9:00 PM IST** (3:30 PM UTC).

To change it, edit `vercel.json`:
```json
"crons": [
  {
    "path": "/api/cron-email",
    "schedule": "0 14 * * *"
  }
]
```

Common schedules (all UTC):
| Time (IST)  | Cron (UTC)      |
|-------------|-----------------|
| 7:00 AM     | `30 1 * * *`    |
| 8:00 PM     | `30 14 * * *`   |
| 9:00 PM     | `0 15 * * *`    |
| 10:00 PM    | `30 16 * * *`   |

Push the change to Git → Vercel picks it up automatically.
**No tab needs to stay open** — Vercel runs crons on their servers.

You can also use the **Admin → ⚙️ Admin tab** in the app to pick a schedule and get the exact snippet to paste.

---

## How Tasks Work (important!)

- **No default tasks** — every date and week starts blank.
- Tasks are stored **per date key** in Supabase, so moving dates shows only that date's tasks.
- Assign tasks via the **＋ Assign Task** button (admin only).
- Quick-add rows are also admin-only.

## Tamil TTS — Troubleshooting

The speak button uses your **device's built-in Text-to-Speech engine**:

| Device      | Fix if not working                                              |
|-------------|----------------------------------------------------------------|
| iPhone/iPad | Built-in Tamil voice. Works out of the box.                    |
| Android     | Settings → Accessibility → TTS → Install Google Tamil voice   |
| Windows     | Settings → Time & Language → Speech → Add Tamil (India) voice |
| Mac         | System Settings → Accessibility → Spoken Content → Tamil      |
| Chrome      | Most reliable browser for Web Speech API                       |

The Gemini API key handles **translation** (English → Tamil text).
TTS (speaking aloud) is always **free and local** via the browser — no API needed.

---

## Email — What Gets Sent

The daily summary email shows **only pending (not done) items**:
- Today's pending tasks, grouped by person
- This week's pending tasks, grouped by person  
- Grocery items still needed
- If everything is done → a celebratory "🎉 All done!" email

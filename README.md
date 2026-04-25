# Family Task Tracker — Vercel + Resend Deploy Guide

## Files in this repo

| File | Purpose |
|---|---|
| `index.html` | Full app (all features) |
| `inject-env.js` | Vercel function — injects env vars securely into the HTML |
| `api/send-email.js` | Vercel API route — sends summary email via Resend |
| `vercel.json` | Routing config |

---

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Task Tracker v2"
git remote add origin https://github.com/YOUR_USERNAME/task-tracker.git
git push -u origin main
```

## 2. Import into Vercel

Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub → select repo → Deploy.

## 3. Set Environment Variables

In Vercel → Project → Settings → **Environment Variables**:

| Name | Value | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | `your_password` | Password to unlock admin mode |
| `GEMINI_API_KEY` | `AIza...` | From [aistudio.google.com](https://aistudio.google.com) |
| `RESEND_API_KEY` | `re_...` | From [resend.com](https://resend.com) |
| `EMAIL_FROM` | `Task Tracker <noreply@yourdomain.com>` | Must be a verified Resend domain |

Then **Redeploy** after adding variables.

---

## Getting API Keys

### Gemini API Key (Tamil translation)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in → Get API key → Create key → Copy

### Resend API Key (Email)
1. Go to [resend.com](https://resend.com) → Sign up (free)
2. API Keys → Create API Key → Copy (`re_...`)
3. Domains → Add your domain → verify DNS records
4. Set `EMAIL_FROM` to `Name <noreply@yourdomain.com>` (must match verified domain)
   - **Testing without a domain:** Use `onboarding@resend.dev` as from address, but you can only send to the email you signed up with

---

## Features

### ➕ Rich Task Assignment (Admin Only)
After logging in as Admin, the **＋ Assign Task** button appears in the header.

Each task assignment includes:
- **Task Name** — what needs to be done
- **Assign To** — one or multiple people (Karthiga, Dass, Amma, Appa, Ajitha, Selvi)
- **Due Date** — deadline with overdue/today/upcoming visual badges
- **Add To** — Weekly board or Daily board
- **Priority** — 🔴 High / 🟡 Medium / 🔵 Low (shown as coloured badges)
- **Note / Extra Info** — context, instructions, reminders
- **Tamil Translation & TTS toggle** — per-task control for whether Tamil text and speak button appear

### 🌐 Tamil Language — User's Choice
A preference bar at the top of Daily Tasks lets anyone toggle:
- **Tamil Text** — shows translated Tamil text below each task (for Dass & Selvi sections)
- **🔊 Speak** — enables the speak button for TTS

These preferences persist across sessions. The per-task Tamil toggle in the assignment modal provides a second level of control (admin sets it per task).

Translation uses: Gemini API → static map → MyMemory (fallback). Always works.

### 📧 Daily Summary Email (Resend)
Located at the bottom of Daily Tasks:
- Enter recipient email → **📤 Send Now** to trigger manually anytime
- Toggle **Auto-send at 9 PM** (tab must be open)

The email includes:
- Overall progress bar
- Today's tasks per person (done/pending, priority, due date, notes)
- This week's tasks per person
- Grocery items still needed

### 🔒 Admin Mode (Password Protected)
- Click **🔒 Admin** → enter password → unlocks add rows + 🗑 delete buttons
- **＋ Assign Task** button appears for rich task assignment
- Quick-add rows still available per section for fast entry

### All original features preserved
- Weekly & Daily navigation
- Day-strip dots, progress bars
- Google Sheets sync
- Inline double-click editing
- Local storage persistence

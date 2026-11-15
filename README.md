# Adept — Elderly Care & Medication Platform
> Built for the **PromptWars x Catalyst** Hackathon.  
> Stack: **React + Vite + Tailwind CSS**, **Supabase** (Auth, Postgres, Edge Functions, Cron), **Resend** (Email), **Gemini API** (Vision OCR, Pre-Visit Brief, Baseline Insights).  
> **Zero cost**, **PWA**, **mobile-first**, **accessible AAA**.

---

## 👵 The Core Philosophy: Elder at the Centre of Every Decision

Most medication apps are built for frantic caregivers or clinical audits. They bombard elderly users with countdown timers, tiny clock-time alarms (e.g. `08:00 AM PO QD`), red blinking "MISSED" banners, complex dropdowns, and automated schedule changes they never consented to.

**Adept is the antidote.**  
It is built on four unbreakable **Design Laws**:

### 🛡️ The Adept Design Laws (Never Broken)
1. **Elder UI: One screen = one question = one big button.**
   - Body text **20px+** (`text-xl` to `text-3xl`).
   - Tap targets **64px+** (`min-h-[64px]` to `min-h-[76px]`).
   - Contrast **AAA** (> 7:1 ratio, deep slate typography, stark clear borders).
   - **No drag, no double-tap, no timeouts, no jargon.**
   - **No red "failure" states**: uses warm amber (`#d97706` / `bg-amber-50`), never shame or guilt. If a dose is delayed, the prompt gently asks: *"Would you like to take your time or rest first?"*
2. **Calm by default:**
   - Green and neutral states unless something truly deviates from baseline.
   - When everything is taken, the home screen reads: *"Everything is peaceful, Arthur. Your morning and afternoon medicines are all taken."*
3. **Every AI output is a PROPOSAL the elder confirms. Never auto-apply.**
   - When Gemini Vision parses a doctor's prescription, it does **NOT** modify Arthur's live routine.
   - It creates an `AIProposal` card with a single clear question: *"Dr. Vance proposed adding Vitamin D3 after lunch. Would you like to add it to your routine?"*
   - Arthur has complete authority: **"Yes, add to routine"** or **"No, keep routine as it is"**.
4. **Dose windows and meal anchors, not exact clock times:**
   - No anxiety-inducing minute timers. Medication is anchored to human rhythms:
     - 🌅 **Morning with breakfast** (7:00 AM – 10:00 AM)
     - ☀️ **After lunch** (12:00 PM – 2:30 PM)
     - 🌙 **Evening with dinner** (6:00 PM – 8:30 PM)
     - 🛌 **Before bedtime** (9:00 PM – 11:30 PM)

---

## 👥 Three Roles: Passcode-Based Shared Profile

A single shared household profile for **Arthur Davies (Age 78)** connects three stakeholders without confusing multi-step signups:

| Role | PIN | Experience |
|---|---|---|
| **Elder** (Arthur) | `1111` | Radical simplicity: One screen = one question = one big button. Large readable text, proposal confirmation, wellness check-in, Elder Veto power. |
| **Caretaker** (Sarah) | `2222` | Full care coordinator console: Prescription Scanner (Gemini OCR), Baseline Deviation Engine, 1-Tap Resend Email Dispatcher, Pre-Visit Doctor Brief, Schedule Editor. |
| **Family** (James) | `3333` | Peace of mind view: High-level calm status ("Dad had toast and took his morning medications"), Send Love notes directly to Arthur's screen, instant contact to Caregiver & Doctor. |

---

## 🚀 Hero Features

### 1. One-Tap Magic-Link Emails (Resend)
- Automated daily digest or baseline-deviation alerts dispatched via Resend.
- Features a **1-Tap passwordless magic link**: Caregivers and family members tap one button in their email to jump directly into Arthur's status with zero authentication friction.
- Interactive in-app live preview and simulated/live dispatching with fallback for zero-cost demos.

### 2. Baseline-Deviation Alerts + Caregiver Digest
- Continuous baseline tracking across all meal anchors over the past 30 days.
- **Calm Deviation Detection:** If a meal anchor window passes without confirmation, the system flags a **warm amber** alert (never red or shaming).
- Caregiver can dispatch a warm-amber check-in or send Arthur a gentle reminder prompt on his screen.

### 3. Doctor Handoff Loop (Prescription Photo ➔ Proposed Schedule & Pre-Visit Brief)
- **Camera / Paper Prescription Upload:** Gemini 2.5 Flash Vision extracts medication name, dosage, shape, clinical purpose, and automatically maps it to the closest elderly meal anchor.
- **Strict Proposal Law:** Output is stored as a pending proposal for Arthur to approve.
- **Pre-Visit Brief Generator:** In 1 click, Gemini synthesizes the last 30 days of window compliance, comfort notes (e.g. knee joint stiffness after walks), and prepares clinical questions for Dr. Evelyn Vance.

### ➕ Audit Log with Elder Veto
- Every prescription scan, schedule change, and dosage confirmation is logged in plain English.
- **Elder Veto Power:** If Sarah or the doctor changed a schedule that Arthur doesn't agree with, Arthur can tap **"Veto this change"** from his tablet, instantly reverting the change and notifying the team.

---

## 🛠️ Stack & Architecture

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide Icons.
- **Database & Backend:** Supabase (PostgreSQL schema in `supabase/schema.sql`, RLS policies, trigger-based audit logging, Supabase Cron jobs).
- **Edge Functions:** 
  - `supabase/functions/caregiver-digest/index.ts`
  - `supabase/functions/deviation-alert/index.ts`
  - `supabase/functions/magic-link-token/index.ts`
- **Email:** Resend API (HTML email templates with 1-tap links).
- **AI:** Gemini API (`gemini-2.5-flash` with structured JSON responses for vision OCR and clinical briefs).
- **Offline / PWA:** Standalone manifest (`public/manifest.webmanifest`), Service Worker (`public/sw.js`), local reactive storage fallback so it works 100% offline out-of-the-box with zero setup required.

---

## 🏁 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run unit & design-law test suite (10/10 passing)
npm test

# 3. Build for production (verified clean build)
npm run build

# 4. Start local development server
npm run dev
```

Visit `http://localhost:5173` to test the live application.
Use PIN `1111` for Arthur (Elder), `2222` for Sarah (Caretaker), or `3333` for James (Family).

---

## 🌐 Deploy Anywhere (Universal Multi-Environment Support)

Adept is configured with relative base asset paths (`base: './'`), SPA 404 fallback routing, and PWA service worker resilience so it runs out-of-the-box on any hosting provider without modification:

### 1. Vercel
- Import repository `https://github.com/Mrsoulgod/adept`.
- Framework preset: **Vite** (auto-detected).
- Build command: `npm run build`
- Output directory: `dist`
- Deep link routing is handled automatically by the included `vercel.json`.

### 2. GitHub Pages
- Go to repository **Settings** > **Pages**.
- Under **Build and deployment** > **Source**, choose **GitHub Actions**.
- The included `.github/workflows/deploy.yml` workflow automatically builds and deploys on every push to `main`.
- SPA navigation on subpaths (e.g. `https://mrsoulgod.github.io/adept/`) is supported by `public/404.html`.

### 3. Netlify / Cloudflare Pages / Render
- Build command: `npm run build`
- Publish directory: `dist`
- Hash router (`#/elder/today`, `#/caretaker/today`, `#/family/home`) ensures instant zero-configuration routing across all static hosts.

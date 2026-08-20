# Outreach AI — Command Deck

A freelancer/agency outreach and CRM dashboard built for **Anova**. It finds local businesses, tracks outreach across email/WhatsApp/calls, personalizes cold emails with AI, automates follow-ups, and schedules meetings synced to Google Calendar — all from one dashboard.

## What it does

- **Find leads** — search real businesses by category and location (Google Places), with optional email lookup via Hunter.io for businesses that have a website
- **Import leads** — bulk import from CSV (LinkedIn exports, event lists, spreadsheets)
- **Track leads** — a searchable, editable lead database with stage (new → contacted → replied → meeting scheduled → client → lost) and tags (hot/warm/cold/follow-up/client)
- **Log manual touches** — record calls, WhatsApp messages, or any contact that happens outside email
- **AI-personalized outreach** — generate short, genuinely personalized cold emails per lead using Google Gemini, with a selectable tone (friendly/formal/professional/simple)
- **Automated follow-ups** — a 3/7/14-day follow-up sequence runs automatically via a scheduled job if a lead hasn't replied
- **Schedule meetings** — book meetings by type (discovery call, follow-up, project review, other), synced automatically to Google Calendar, with confirmation and reminder emails
- **Analytics dashboard** — total leads, emails sent, reply rate, booking rate, conversion rate, monthly activity trend, and pipeline breakdown
- **Export** — download your full lead list as CSV at any time

## Tech stack

- **Framework:** Next.js (App Router, Server Components + Server Actions)
- **Database & Auth:** Supabase (Postgres, Row Level Security, Auth)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## APIs & integrations

| Service | Used for |
|---|---|
| Google Places API | Local business search (Client Finder) |
| Hunter.io | Domain-based email lookup for leads with a website |
| Google Gemini API | AI-generated, personalized cold email drafts |
| Resend | Transactional email sending, automated follow-ups, meeting confirmations/reminders |
| Google Calendar API (OAuth2) | Syncing booked meetings to the user's calendar |
| PapaParse | CSV import and export |

## Environment variables

See `.env.local.example` for the full list. At minimum you'll need:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — Google Calendar OAuth
- `GEMINI_API_KEY` — AI email drafting
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — email sending
- `HUNTER_API_KEY` — email lookup (optional; app degrades gracefully without it)
- `RESEND_WEBHOOK_SECRET` — verifying inbound Resend webhooks
- `CRON_SECRET` — securing the scheduled follow-up and reminder jobs

## Running locally

```bash
npm install
npm run dev
```
Live url : https://outreach-ai-fawn.vercel.app
Then open [http://localhost:3000](http://localhost:3000).

## Database schema

The full schema (leads, lead_touches, email_messages, meetings, google_tokens) lives in Supabase, managed via SQL run directly in the Supabase SQL Editor. RLS is enabled on every table, scoped to `owner_id`.
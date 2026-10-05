# 🏠 Rental Management

A full-stack app for managing a rental property — rooms, tenants, leases, utility meters, and invoices — that I built to replace the spreadsheet my family was using to track a real apartment building.

It started out as an invoice generator (bootstrapped with `v0`) and grew into something closer to a mini property-management system: a room-by-room dashboard, tenant/lease tracking, water & electric meter readings, and PDF invoices, all wrapped around actual login/auth instead of just being a public demo.

## What it does

- **Dashboard** — see every room at a glance (vacant / occupied / maintenance), plus KPIs like occupancy rate and outstanding rent
- **Two ways to view the building** — a flat grid ("cinema" view) or a floor-plan layout that mirrors the actual building's wings and stairwells
- **Tenants & leases** — assign a tenant to a room and track the agreed rent for that specific lease, so changing a room's asking price later doesn't rewrite history
- **Utility meters** — log water/electric meter readings per room and derive consumption between readings
- **Invoices** — generate an invoice from a lease, preview it, and export it as a PDF, with a running invoice history
- **Multi-currency** — USD and KHR (Cambodian riel), since this was built for a real building in Cambodia
- **Onboarding wizard + guided tour** — a first-run flow that walks a new landlord through setting up their property (including declaring floors and rooms-per-floor up front) instead of dropping them on an empty dashboard
- **Floor capacity** — each floor's Custom Layout grid size is a hard cap on room count, enforced server-side on both room creation and floor reassignment, not just a visual grid
- **Account Settings** (`/settings`) — a signed-in-only page for business/property info, utility rates, invoice note template, per-floor grid capacity, a Simple Mode default, and replaying the guided tour
- **Auth** — proper accounts (bcrypt + JWT sessions) so each landlord's data is scoped to them; there's also a shared "demo" dataset for anyone just poking around

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Prisma 7](https://www.prisma.io) with [Turso (libSQL)](https://turso.tech) — edge SQLite, no cold-start database
- [Zustand](https://github.com/pmndrs/zustand) for client state, [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) for forms/validation
- [dnd-kit](https://dndkit.com) for drag-and-drop room arrangement
- [jsPDF](https://github.com/parallax/jsPDF) for invoice PDFs

Deployed on Vercel.

## Running it locally

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL and AUTH_SECRET
pnpm dev
```

`DATABASE_URL` falls back to a local SQLite file by default, so you can get the app running without setting up Turso first. `AUTH_SECRET` just needs to be any random 32+ byte string (`openssl rand -base64 32`) for login/signup to work.

Then open [http://localhost:3000](http://localhost:3000).

## A design decision I'm proud of

The data model separates a **Room's current asking price** from a **Lease's agreed rent**, so bumping the rent for new tenants doesn't retroactively change what a past tenant owed. "Overdue" invoices are also computed on the fly (unpaid + past due date) instead of a background job flipping a status — one less moving part for what's still an MVP.

## Status

Actively evolving — this is my daily-driver project for actually managing the building, so features get added as I run into things the spreadsheet used to handle. Next up: payment reminders and a proper reports page.

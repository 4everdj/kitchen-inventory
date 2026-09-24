# Kitchen Inventory

A modern, photo-first household kitchen & refrigerator inventory app.

**Philosophy:** Take a picture → Add it → Forget about it → The app tells you what you need to buy.

## Stage 1 — Functional Local Prototype (Current)

This stage delivers a fully working single-device experience:

- Home dashboard with Must Buy / Running Low / Available
- Photo capture & upload (camera + gallery)
- Add / Edit / Delete items
- Status changes with one tap (Must Buy, Low, Purchased)
- Shopping list (auto-populated from Red items + manual add)
- Categories, locations, quantity levels, brand, notes, expiration
- Search & filters (status, location, category)
- Multiple households (local)
- Persistent storage (localStorage via Zustand)
- Mobile-first responsive UI with bottom navigation

### Run locally

```bash
cd kitchen-inventory
npm install
npm run dev
```

Open http://localhost:3000

The app auto-creates a demo household with sample items on first load.

### Data

All data is stored in the browser (localStorage key: kitchen-inventory-storage).
Clearing site data or clicking Reset / Log out in Settings wipes everything.

## Architecture Overview

| Layer        | Choice                          | Notes |
|--------------|---------------------------------|-------|
| Frontend     | Next.js 15 (App Router) + TS + Tailwind | PWA-ready |
| State        | Zustand + persist               | Local prototype; easy swap to Supabase |
| Icons        | Lucide React                    | |
| Future DB    | Supabase (Postgres + Auth + Realtime + Storage) | Schema ready in /supabase/schema.sql |

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    page.tsx            # Home dashboard
    add/                # Add item (camera-first)
    inventory/          # Full list + filters
    shopping/           # Shopping list
    settings/           # Households & about
  components/           # UI components
  lib/
    store.ts            # Zustand store (all business logic)
    utils.ts
  types/                # Shared TypeScript types
supabase/
  schema.sql            # Full production schema + RLS policies
```

## Roadmap

**Stage 2 — Shared & Real-time**
- Supabase Auth + multi-device sync
- Secure share links (Owner / Editor / Viewer)
- Real-time status updates across household members
- Image upload to Supabase Storage (compressed WebP)

**Stage 3 — Polish**
- PWA install + offline indicators
- Expiration warnings
- Item history timeline
- Duplicate detection
- Dark mode

**Stage 4 — Smart features**
- Optional AI vision suggestions on photo
- Frequently purchased quick-add
- Push reminders

## Design Principles

1. Speed over features — status change = 1–2 taps
2. Photos optional — text-only items fully supported
3. Color + text + icon for accessibility (never color alone)
4. Red is most important — Must Buy always first and most prominent
5. Family-friendly — large touch targets, clear language

## Production Notes

When connecting Supabase:

1. Create a project at supabase.com
2. Run /supabase/schema.sql in the SQL editor
3. Create a private Storage bucket item-images
4. Add env vars:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
5. Replace the Zustand store actions with Supabase client calls (keep the same component API)

---

Built as a clean foundation for a real shared household app.

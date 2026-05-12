# SwiftImpact ADA Console — PRD

## Original problem statement
Build a full-stack SaaS admin dashboard called "SwiftImpact ADA Console" — React frontend + Supabase backend. Dark UI with deep navy/slate palette and SwiftImpact Solutions branding. Manage ADA accessibility widget clients via CRUD on a Supabase `clients` table; generate per-client embed snippets.

## Architecture
- **Frontend**: React (CRA + craco), TailwindCSS, shadcn/ui, lucide-react, sonner toasts, react-router-dom v7
- **Backend**: Supabase REST API queried directly from React (no FastAPI in this project)
- **Auth**: None (open internal console)
- **Fonts**: Outfit (headings) + Inter (body) + JetBrains Mono (code)
- **Colors**: bg #0f1117 / sidebar #1a1d27 / cards #1e2130 / accent #007bff

## User personas
- Agency admin at SwiftImpact Solutions managing the ADA widget rollout for client websites.

## Core requirements (static)
1. Pages: Dashboard, Clients, Client Detail/Edit, Embed Code
2. Sortable/searchable clients table with row actions
3. Live-updating embed snippet on Client Detail page
4. Master Widget Status toggle (green/red, oversized)
5. 5 profile toggles + 10 feature toggles
6. Delete-confirm modal, toast notifications, empty states
7. Domain auto-strip (https://, www., trailing /)

## What's been implemented (2026-02)
- Sidebar nav (Dashboard / Clients / Embed Code) with SwiftImpact text logo
- Dashboard: 4 stat cards (Total / Active / Inactive / New this month) + recent clients table + quick-add CTA
- Clients page: searchable, sortable table; row actions (edit / toggle active / delete); empty + no-results states
- Add Client modal with name/domain/plan/notes; auto domain cleaning
- Client Detail: client info / widget settings / profiles / features / live embed code / oversized master toggle / save & delete
- Embed Code page: grid of per-client snippets with copy buttons
- Toast notifications wired throughout (sonner, bottom-right)
- 100% testing_agent_v3 frontend pass

## Prioritized backlog
### P1
- Auth gate (Supabase email/password or magic link) to lock down the console
- Optimistic UI rollback on toggleActive failure (Clients page)
- "Last updated" timestamp on the clients table
### P2
- Per-client analytics (widget impressions / sessions) once a backend pipeline exists
- Bulk activate/deactivate from Clients page
- CSV export of clients
- Realtime sync via Supabase channels (auto-refresh when another tab edits)

## Notes
- Supabase env vars live in /app/frontend/.env: REACT_APP_SUPABASE_URL + REACT_APP_SUPABASE_ANON_KEY
- `clients` table already exists in user's Supabase project with one seed row (bvpremiereproducts.com)

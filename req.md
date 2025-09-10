
# Website & Game Management System – Requirements (Next.js + Supabase)

**Owner**: Company Internal  
**Deliverable**: Full-stack web app built with **Next.js** (App Router) and **Supabase** (PostgreSQL, Auth, Storage).  
**Deployment**: Vercel (frontend + serverless API routes) + Supabase (DB, Auth, Storage).  
**Notes**: No PHP endpoints. All APIs are Next.js routes or Supabase Edge Functions.

---

## 1) High-Level Modules
1. **Website Management**
2. **Game Management**
3. **Cloudflare Management** (multiple accounts)
4. **Footer Textlink Management**
5. **Public APIs** (read-only, JSON)
6. **Admin UI** with RBAC (role-based access control)

---

## 2) Functional Requirements

### 2.1 Website Management
- CRUD: Add, edit, delete websites.
- List: filter & sort by category, traffic, domain rating, backlinks, referring domains, isFeatured, isIndex, isGSA, isWP.
- Detail view for a single website.
- Bulk actions: multi-select delete / update flags (optional v2).

**Fields**
- `url` (string, unique)
- `title` (string)
- `desc` (text)
- `category` (string)
- `isGSA` (boolean)
- `isIndex` (boolean)
- `isFeatured` (boolean)
- `traffic` (integer, default 0)
- `domain_rating` (integer, default 0)  // Ahrefs-like metric
- `backlinks` (integer, default 0)
- `referring_domains` (integer, default 0)
- `is_wp` (boolean, default false)  // WordPress site flag

### 2.2 Game Management
- CRUD: Add, edit, delete games.
- List: filter & sort by category, developer, publish year, isFeatured.
- Asset management: upload `gameIcon`, `gameThumb` via Supabase Storage.
- Support `game` as embed/iframe or file URL; render preview in admin UI.

**Fields**
- `url` (string, unique)
- `title` (string)
- `desc` (text)
- `category` (string)
- `game_url` (string)
- `game_icon` (storage URL, optional)
- `game_thumb` (storage URL, optional)
- `game_developer` (string, optional)
- `game_publish_year` (integer, optional)
- `game_controls` (json/text)
- `game` (text: embed/iframe/file URL)
- `isFeatured` (boolean, default false)

### 2.3 Cloudflare Management
- Store **multiple** Cloudflare accounts (API tokens/keys, account IDs).
- UI for **Custom Purge** with modes:
  - **By URL** (exact file URLs; optional single-file purge exclusions)
  - **By Hostname**
  - **By Tag** (Cache-Tag header)
  - **By Prefix** (directory prefix)
- Log every purge request (who, what, when, result).

### 2.4 Footer Textlink Management
- Manage textlinks to be placed on specified websites/domains.
- Options:
  - Assign to specific pages (paths) or **all pages** on a domain.
  - Support custom (non-managed) domains.
- Preview output JSON for audits.

**Textlink Fields**
- `link` (string)
- `anchor_text` (string)
- `target` (string, e.g., `_blank`)
- `rel` (string, e.g., `nofollow`)
- `title` (string, optional)
- `website_id` (FK → websites.id, nullable if `custom_domain` is used)
- `custom_domain` (string, optional)
- `show_on_all_pages` (boolean)
- `include_paths` (string[] / text, optional) — when not all pages
- `exclude_paths` (string[] / text, optional)

---

## 3) Non-Functional Requirements
- **Auth**: Supabase Auth (email/password + OAuth providers if needed). Roles: `admin`, `editor`, `viewer`.
- **RBAC**: Row Level Security (RLS) policies enforce read/write according to roles.
- **Audit**: Keep `created_at`, `updated_at`, `created_by`, `updated_by` columns where relevant.
- **Performance**: DB indexes on filters/sorts (traffic, domain_rating, category, isFeatured).
- **Rate limit** public APIs (IP-based; header-based hints). Vercel middleware or Edge Functions.
- **Observability**: Console + Supabase logs; optional Sentry integration.
- **Validation**: Zod schemas on API and forms; safe server actions.
- **i18n-ready** (EN baseline; later VN).

---

## 4) Database Schema (Supabase / PostgreSQL)

```sql
-- 4.1 websites
create table if not exists public.websites (
  id bigserial primary key,
  url text not null unique,
  title text not null,
  desc text,
  category text,
  is_gsa boolean default false,
  is_index boolean default true,
  is_featured boolean default false,
  traffic integer default 0,
  domain_rating integer default 0,
  backlinks integer default 0,
  referring_domains integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create index if not exists idx_websites_category on public.websites (category);
create index if not exists idx_websites_traffic on public.websites (traffic desc);
create index if not exists idx_websites_domain_rating on public.websites (domain_rating desc);
create index if not exists idx_websites_is_featured on public.websites (is_featured);

-- 4.2 games
create table if not exists public.games (
  id bigserial primary key,
  url text not null unique,
  title text not null,
  desc text,
  category text,
  game_url text,
  game_icon text,
  game_thumb text,
  game_developer text,
  game_publish_year int,
  game_controls jsonb,  -- or text
  game text,            -- embed/iframe/file URL or content
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create index if not exists idx_games_category on public.games (category);
create index if not exists idx_games_is_featured on public.games (is_featured);

-- 4.3 cloudflare_accounts
create table if not exists public.cloudflare_accounts (
  id bigserial primary key,
  account_name text not null,
  email text not null,
  api_token text not null,   -- store token; restrict access via RLS; encrypt at rest if possible
  account_id text not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- 4.4 cloudflare_purge_logs
create table if not exists public.cloudflare_purge_logs (
  id bigserial primary key,
  cloudflare_account_id bigint references public.cloudflare_accounts(id) on delete set null,
  mode text not null check (mode in ('url','hostname','tag','prefix')),
  payload jsonb not null,         -- what was purged (urls, hostnames, tags, prefixes)
  exclusions jsonb,               -- for single-file exclusions (url mode), optional
  status_code int,
  result jsonb,                   -- API response
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- 4.5 textlinks
create table if not exists public.textlinks (
  id bigserial primary key,
  link text not null,
  anchor_text text not null,
  target text default '_blank',
  rel text default '',
  title text,
  website_id bigint references public.websites(id) on delete set null,
  custom_domain text, -- if not using website_id
  show_on_all_pages boolean default true,
  include_paths text, -- newline- or comma-separated paths (optional)
  exclude_paths text, -- newline- or comma-separated paths (optional)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);
```

**Timestamps trigger (optional):**
```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_websites_updated before update on public.websites
for each row execute function set_updated_at();

create trigger trg_games_updated before update on public.games
for each row execute function set_updated_at();

create trigger trg_textlinks_updated before update on public.textlinks
for each row execute function set_updated_at();
```

**RLS (outline):**
- Enable RLS on all tables.
- Policies:
  - `admin`: full CRUD
  - `editor`: CRUD except destructive deletes on accounts/logs
  - `viewer`: read-only
- Implement via `auth.jwt()` claims: `role` in JWT.

---

## 5) Public APIs (JSON, read-only)
All implemented as **Next.js API routes** (`/app/api/.../route.ts`) or **Supabase Edge Functions**. No PHP.

### 5.1 GET `/api/public/backlinks?domain={domain}`
**Response**
```json
{
  "status": "success",
  "data": [
    {
      "url": "https://textlink.com/",
      "textlink": "textlink 1",
      "title": "textlink 1",
      "rel": "",
      "target": "_blank"
    }
  ]
}
```

**Behavior**
- Looks up `textlinks` by `website_id` joined from `websites.url` host match OR `custom_domain` match.
- Supports pagination: `?page=1&limit=100`.
- CORS: allow GET from any origin.

### 5.2 GET `/api/games`
**Query params**: `category`, `isFeatured`, `developer`, `year`, `limit`, `page`, `sort`  
**Response**: array of `games` with paging meta.  
**Sorting**: by `created_at` desc default; allow `sort=publish_year`, `sort=title`, etc.

### 5.3 GET `/api/websites`
**Query params**: `category`, `isFeatured`, `isIndex`, `minTraffic`, `minDR`, `sort` (`traffic`, `domain_rating`, `backlinks`, `referring_domains`), `limit`, `page`  
**Response**: array of `websites` with paging meta.

**Rate limiting**: per IP (e.g., 60 req/min).

---

## 6) Cloudflare API Integration
- Use **account-scoped API Token** with permissions:
  - Cache Purge: `#zone.cache_purge`
  - Zone Read (if needed)
- Store in `cloudflare_accounts.api_token` (RLS: only admins can read; encrypt at rest if possible).
- Implement server-side actions (Next.js Route Handlers) to call CF endpoints:
  - **Purge by URLs**: `POST zones/{zone_id}/purge_cache` with `{ "files": ["https://example.com/a.jpg", ...] }`
  - **Purge by Hostnames**: `{ "hosts": ["assets.example.com"] }`
  - **Purge by Tags**: `{ "tags": ["tag-1","tag-2"] }`
  - **Purge by Prefix**: `{ "prefixes": ["https://example.com/static/"] }`
- Log request & response to `cloudflare_purge_logs`.
- UI: select **Cloudflare Account**, **Zone**, **Mode**, **Payload**; render result + store log.

---

## 7) Admin UI (Next.js App Router)
- **Auth pages**: login/logout; enforce `admin`/`editor`/`viewer` roles.
- **Navigation**: Websites, Games, Cloudflare, Textlinks, API Docs.
- **Tables**: Data table with search, filters, multi-sort, pagination.
- **Forms**: Controlled forms with client+server validation (Zod).
- **Uploads**: `game_icon`, `game_thumb` to Supabase Storage buckets (`games/icons`, `games/thumbs`). Return public URLs.
- **Toasts** for success/error; **modals** for delete confirmations.
- **Theme**: light/dark (system).

---

## 8) Environment & Config
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `CF_API_TOKENS` stored in DB (do not put in .env), or per-request secret fetch.
- `SENTRY_DSN` (optional)

---

## 9) Validation & Types
- Define Zod schemas for:
  - WebsiteCreate/Update
  - GameCreate/Update
  - TextlinkCreate/Update
  - CloudflarePurgePayload (modes: url/hostname/tag/prefix)
- Generate TypeScript types from Zod or Supabase types.

---

## 10) Example Query Combos
- `/api/websites?category=blog&sort=traffic&minTraffic=10000`
- `/api/websites?isFeatured=1&sort=domain_rating`
- `/api/games?category=puzzle&isFeatured=1&limit=50`
- `/api/public/backlinks?domain=retrobowl.me`

---

## 11) Security
- **RLS** everywhere; only public endpoints bypass auth but are read-only.
- Sanitize and validate all inputs.
- CORS for public endpoints only.
- Server-side Supabase client for privileged operations.
- Do not expose Cloudflare tokens to the client.

---

## 12) Nice-to-Haves (v2)
- Bulk CSV import/export for websites & games.
- Tagging system for websites & games.
- Scheduled tasks to refresh metrics (traffic/DR/backlinks) via external APIs.
- Activity feed (who changed what).
- Webhooks for purge completion.

---

## 13) ERD (ASCII)
```
websites (1) ──< textlinks >── (0..1) custom_domain
   │  id                      website_id
   └──────────────┐
games             │
   id             │
cloudflare_accounts (1) ──< cloudflare_purge_logs
```

---

## 14) Definition of Done
- Working CRUD UIs for Websites, Games, Textlinks.
- Cloudflare purge works across all four modes; logs persisted.
- Public APIs return correct JSON with filters, sorting, pagination, and rate limiting.
- RLS + roles enforced; passing integration tests.
- Deployed on Vercel + Supabase with environment variables set.

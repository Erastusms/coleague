# 🏆 Coleague — Unified European Football Platform

Coleague is a modern football analytics platform that combines standings, statistics, and match fixtures across Europe's Top 5 leagues into a single, unified view:
- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Premier League**
- 🇪🇸 **La Liga**
- 🇮🇹 **Serie A**
- 🇩🇪 **Bundesliga**
- 🇫🇷 **Ligue 1**

Built with **Next.js 16 (Turbopack, React 19)**, **Prisma ORM**, **Tailwind CSS v4**, and **PostgreSQL**.

---

## 🚀 One-Click Deployment to Vercel

This repository is pre-configured for seamless deployment to [Vercel](https://vercel.com). When you import this project, Vercel will automatically:
1. Install dependencies and generate Prisma Client engines (`native`, `rhel-openssl-3.0.x`, `debian-openssl-3.0.x`).
2. Run database migrations (`prisma migrate deploy`) against your PostgreSQL database.
3. Automatically seed baseline data (Top 5 Leagues, Seasons 2023–2026, and default Admin account).
4. Build and optimize the Next.js application.
5. Set up an automated daily Vercel Cron Job to keep ESPN standings and stats up to date.

---

### Step-by-Step Vercel Setup

#### 1. Push your repository to GitHub
Ensure all files in this project are committed and pushed to your GitHub repository.

#### 2. Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Under **Import Git Repository**, select your GitHub repository (`coleague` or `combined-league`).
3. Leave **Framework Preset** as **Next.js**.
4. Leave Root Directory as `./`.

#### 3. Configure Environment Variables
Before clicking Deploy, expand the **Environment Variables** section in the Vercel Import modal and add:

| Variable Name | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | Recommended | Random secret string for signing admin session cookies | e.g. `openssl rand -base64 32` |
| `CRON_SECRET` | Recommended | Bearer token for Vercel Cron jobs | e.g. `openssl rand -base64 24` |
| `ADMIN_PASSWORD` | Optional | Initial password for the admin account (default: `admin123`) | `your-secure-admin-password` |

> **Recommended Free Serverless PostgreSQL Providers:**
> - [Neon Serverless Postgres](https://neon.tech) (Recommended — Works out of the box, auto-scaling, pooled connection string)
> - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (Built directly into Vercel)
> - [Supabase](https://supabase.com) (Use the Session/Direct connection string for migrations)
> - [Railway](https://railway.app)

#### 4. Click "Deploy"
Vercel will build the application, execute `prisma migrate deploy`, seed the baseline database records, and publish your production website.

---

## 🛠️ Post-Deployment: Populating Live Football Data

Once your site is deployed, your database contains all the necessary schemas, leagues, and seasons. You can populate live standings and player data using any of the following methods:

### Method A: Web Admin Portal (Zero Terminal Required)
1. Navigate to `https://your-deployment.vercel.app/admin` in your browser.
2. Sign in with:
   - **Username:** `admin` (or your custom `ADMIN_USERNAME`)
   - **Password:** `admin123` (or your custom `ADMIN_PASSWORD`)
3. Select season `2026` (or any season).
4. Click **"Sync ESPN Data"**.
5. Within seconds, standings, goal differences, and top scorers/assists will be fetched from ESPN API and stored in your PostgreSQL database.

### Method B: Automated Vercel Cron Job
A cron job is pre-configured in `vercel.json` (`/api/cron/sync`) running daily at `04:00 UTC`. It automatically refreshes standings and player statistics.

### Method C: Local Seeding Script
If you prefer to run a full sync across all 4 historical seasons and matches from your local terminal targeting the production database:
```bash
# In your local .env, set DATABASE_URL to your production PostgreSQL connection string:
npm run db:seed     # Fetches Top 5 leagues standings and stats for 2023-2026
npm run db:matches  # Fetches match fixtures and detailed summaries
```

---

## 📁 Repository Structure

```
├── prisma/
│   ├── migrations/             # Version-controlled SQL migrations
│   └── schema.prisma           # Prisma schema with PostgreSQL models & binaryTargets
├── scripts/
│   ├── vercel-build.mjs        # Automated Vercel deployment pipeline script
│   ├── seed-baseline.mjs       # Zero-dependency baseline seeder (Leagues, Seasons, Admin)
│   ├── seed.ts                 # Full ESPN sync across 2023–2026
│   ├── seed-admin.ts           # Admin user upsert script
│   └── seed-matches.ts         # Match fixtures sync script
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard & ESPN manual sync
│   │   ├── api/
│   │   │   ├── admin/          # Auth, status & sync API routes
│   │   │   ├── cron/sync/      # Vercel Cron endpoint with maxDuration = 60
│   │   │   ├── fixtures/       # Match fixtures endpoints
│   │   │   ├── leaders/        # Top scorers and assists endpoints
│   │   │   └── standings/      # Combined standings endpoints
│   │   ├── fixtures/           # Fixtures frontend view
│   │   ├── standings/          # Standings frontend view
│   │   └── stats/              # Player stats frontend view
│   └── lib/                    # Authentication, ESPN clients, and Prisma singleton
├── vercel.json                 # Vercel configuration & Cron schedule
└── .env.example                # Template for environment variables
```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit DATABASE_URL in .env to point to your local PostgreSQL instance

# 3. Apply migrations and seed baseline
npm run db:deploy
npm run db:baseline

# 4. Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

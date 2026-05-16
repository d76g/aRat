# Prieelo — Scrap to Snap

A social platform for DIY upcycling enthusiasts. Users document their transformation journey through a structured three-phase system: **Raw → Remaking → Reveal**, with the goal of fighting greenwashing through complete transparency.

Live site: [prieelo.com](https://prieelo.com)
Company: ARaT.eco B.V. (Netherlands) · KVK: 96388056

---

## Tech stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + Radix UI + Framer Motion
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (JWT sessions, user approval flow)
- **File storage**: AWS S3 in production / local filesystem on dev VPS
- **Hosting**: Ubuntu VPS (manual deploy via SSH + PM2 + Nginx)

For a deeper current documentation, check below documents

**application error handeling** --> DEBUGGING_GUIDE.md & ERROR_FIXES_SUMMARY.md
**Deployment Steps** --> DEPLOYMENT.md
**Technology used** --> app-technology.md
**Username** --> USERNAME_CHANGE_FEATURE.md

---

## Repository setup

This project lives in two places on GitHub:

- **`d76g/aRat`** — the canonical repo. **The production server pulls from this one.** Merging here is what ships changes.
- **`Aboushabana/aRat`** — fork used for development. Changes flow `fork → PR → d76g/aRat:main → server`.

You can only deploy by getting your commit into `d76g/aRat:main`.

---

## Local development setup

One-time setup on a fresh Mac.

### 1. Install tools

```bash
# Homebrew (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Core tools
brew install git node@18
brew install --cask docker visual-studio-code
brew link --overwrite --force node@18
```

Open Docker Desktop once and leave it running (whale icon in menu bar).

### 2. Clone

```bash
mkdir -p ~/Projects && cd ~/Projects
git clone https://github.com/Aboushabana/aRat.git
cd aRat
```

### 3. Start a local Postgres

```bash
docker run --name prieelo-db \
  -e POSTGRES_USER=prieelo_user \
  -e POSTGRES_PASSWORD=localdev123 \
  -e POSTGRES_DB=prieelo_db \
  -p 5432:5432 \
  -d postgres:15
```

To stop/start later: `docker stop prieelo-db` / `docker start prieelo-db`. Data persists between restarts.

### 4. Install dependencies

```bash
npm install
```

### 5. Create `.env`

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL="postgresql://prieelo_user:localdev123@localhost:5432/prieelo_db"
NEXTAUTH_SECRET="local-dev-secret-not-for-production-32chars"
NEXTAUTH_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
BASE_URL="http://localhost:3000"
NODE_ENV="development"
PORT="3000"
```

⚠️ Never commit `.env`. It's in `.gitignore`.

### 6. Initialize the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 7. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Daily workflow

```bash
cd ~/Projects/aRat
docker start prieelo-db    # if you stopped it
code .                     # open in VS Code
npm run dev                # localhost:3000
```

Edit files in VS Code. Next.js auto-reloads on save.

---

## Making a change (the full loop)

Never edit files directly on the server. Always go through this loop.

```bash
# 1. Branch off main
git checkout main
git pull origin main
git checkout -b describe-my-change

# 2. Edit files in VS Code, test at localhost:3000

# 3. Verify the production build works (CRITICAL — never skip)
npm run build

# 4. Commit
git add .
git commit -m "Describe what changed"
git push origin describe-my-change
```

Then on GitHub:

5. Open a PR from `Aboushabana/aRat:describe-my-change` → `d76g/aRat:main`
6. Merge the PR (need `d76g` account access)

Then deploy (see below).

---

## Deploying to production

The server does **not** auto-deploy. After merging to `d76g/aRat:main`, you must SSH in and pull manually.

```bash
ssh root@srv1093726
cd /var/www/prieelo

# If git status shows local modifications, discard them first:
# git checkout -- <filename>

git pull origin main
npm install
npm run build
pm2 restart prieelo
pm2 status
```

Verify at [prieelo.com](https://prieelo.com) in an incognito window (to bypass cache).

### Common deploy gotchas

- **`Your local changes would be overwritten by merge`** — the server has uncommitted local edits. Run `git status`, then `git checkout -- <file>` for each modified file to discard, then pull again.
- **Build fails on the server but worked locally** — almost always a Node version mismatch or a JSX syntax issue. Run `npm run build` locally first to catch this.
- **Live site still shows old content after deploy** — hard refresh (Cmd/Ctrl + Shift + R) or open in incognito. Browser/CDN cache.
- **PM2 says `online` but site is broken** — check logs with `pm2 logs prieelo --lines 50`.

---

## JSX comment gotcha

In `.tsx` files, regular JS comments (`//` and `/* */`) don't work inside JSX markup. You must use `{/* ... */}`. When wrapping a block:

```jsx
{/* Disabled for now */}
{/*
<div>
  ...content to hide...
</div>
*/}
```

Make sure the `{/*` opens and `*/}` closes around the **complete JSX block** — including the right closing tags but not any wrapper tags from outside. Running `npm run build` locally catches mistakes here.

---

## Project structure (the parts you'll touch most)

```
app/                       # Next.js App Router pages and API routes
  page.tsx                 # Home page
  api/                     # Backend API endpoints
components/                # React components
  footer.tsx               # Site footer
  home-feed.tsx            # Logged-in feed
  public-feed.tsx          # Public landing feed
  ui/                      # Shadcn/Radix primitives
lib/                       # Helpers (auth config, types, utils)
prisma/
  schema.prisma            # Database schema
  migrations/              # Schema history
docs/                      # Extra docs (deployment, debugging, etc.)
.env                       # Local secrets (not committed)
.env.example               # Template for .env
```

---

## Server reference

- **Host**: srv1093726 (Ubuntu 22.04)
- **App path**: `/var/www/prieelo`
- **Process manager**: PM2 (app name: `prieelo`)
- **Web server**: Nginx (config at `/etc/nginx/sites-available/prieelo`)
- **Database**: PostgreSQL (local on server)
- **SSL**: Let's Encrypt (auto-renew via certbot cron)

### Useful server commands

```bash
pm2 status                    # is the app running?
pm2 logs prieelo --lines 100  # recent logs
pm2 restart prieelo           # restart the app
sudo systemctl status nginx   # is nginx running?
sudo nginx -t                 # test nginx config
```

---

## Branding

| Color           | Hex       |
| --------------- | --------- |
| Prieelo Green   | `#324426` |
| Prieelo Orange  | `#ed4924` |
| Prieelo Cream   | `#f6f6d6` |
| Prieelo Blue    | `#a1c0e5` |

---

## Contact

- **General**: [info@arat.eco](mailto:info@arat.eco)
- **Team**: [team@prieelo.com](mailto:team@prieelo.com)

---

© ARaT.eco B.V. — Made with ♻️ for a sustainable future.

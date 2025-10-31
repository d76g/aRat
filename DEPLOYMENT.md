# Deployment Guide for prieelo.com

This guide provides step-by-step instructions for deploying changes to your production server.

## Prerequisites

- SSH access to your server (prieelo.com)
- Server has Node.js and PM2 installed
- GitHub repository is set up and accessible from server
- Project directory on server (typically `/var/www/prieelo` or similar)

## Deployment Steps

### Step 1: Push Changes to GitHub

From your local machine, push your changes to GitHub:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Step 2: Connect to Your Server

SSH into your production server:

```bash
ssh your-username@prieelo.com
# Or use your SSH config alias
ssh prieelo
```

### Step 3: Navigate to Project Directory

Navigate to your project directory on the server:

```bash
cd /var/www/prieelo
# Or wherever your project is located
```

### Step 4: Pull Latest Changes from GitHub

Pull the latest changes from the main branch:

```bash
git pull origin main
```

If you encounter merge conflicts or need to reset:

```bash
# To force pull (careful - this discards local changes)
git fetch origin
git reset --hard origin/main
```

### Step 5: Install/Update Dependencies

Install any new dependencies:

```bash
npm install
# Or if using yarn
# yarn install
```

### Step 6: Generate Prisma Client (if needed)

If you've changed the database schema:

```bash
npx prisma generate
```

### Step 7: Run Database Migrations (if needed)

If you have new migrations:

```bash
npx prisma migrate deploy
```

### Step 8: Build the Application

Build the Next.js application:

```bash
npm run build
```

This will create the `.next` directory with the production build.

### Step 9: Restart PM2

Restart your PM2 process to apply the changes:

```bash
# If you have a specific PM2 app name
pm2 restart prieelo

# Or restart all PM2 processes
pm2 restart all

# Or if you need to restart with a specific config
pm2 restart ecosystem.config.js
```

### Step 10: Check PM2 Status

Verify the application is running correctly:

```bash
pm2 status
pm2 logs prieelo --lines 50
```

## Quick Deployment Script

If you want to automate this process, create a deployment script on your server:

```bash
#!/bin/bash
# Save as: /var/www/prieelo/deploy.sh

cd /var/www/prieelo
git pull origin main
npm install
npm run build
pm2 restart prieelo
echo "Deployment complete!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

Then you can simply run:

```bash
./deploy.sh
```

## Troubleshooting

### Build Fails

- Check Node.js version: `node --version` (should match local version)
- Clear build cache: `rm -rf .next`
- Check for TypeScript errors: `npm run lint`
- Check for missing dependencies

### PM2 Won't Restart

- Check PM2 status: `pm2 status`
- View logs: `pm2 logs prieelo`
- Check if port is in use: `lsof -i :3000`
- Restart PM2 daemon: `pm2 kill && pm2 resurrect`

### Database Issues

- Verify database connection in `.env` file
- Check Prisma client is generated: `npx prisma generate`
- Verify migrations are up to date: `npx prisma migrate status`

### Git Pull Issues

- Check you're on the correct branch: `git branch`
- Stash local changes: `git stash`
- Reset to remote: `git reset --hard origin/main` (⚠️ This discards local changes)

## Environment Variables

Make sure your `.env` file on the server has all required variables:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- Any other environment-specific variables

## Rollback Procedure

If you need to rollback to a previous version:

```bash
cd /var/www/prieelo
git log --oneline  # Find the commit hash you want
git checkout <commit-hash>
npm install
npm run build
pm2 restart prieelo
```

Or revert to a previous commit:

```bash
git revert HEAD
npm run build
pm2 restart prieelo
```

## Summary Checklist

- [ ] Push changes to GitHub
- [ ] SSH to server
- [ ] Navigate to project directory
- [ ] Pull latest changes (`git pull origin main`)
- [ ] Install dependencies (`npm install`)
- [ ] Run Prisma generate (if needed)
- [ ] Run migrations (if needed)
- [ ] Build application (`npm run build`)
- [ ] Restart PM2 (`pm2 restart prieelo`)
- [ ] Verify application is running (`pm2 status`)
- [ ] Check logs for errors (`pm2 logs prieelo`)


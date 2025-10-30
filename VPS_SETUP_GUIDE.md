# Prieelo VPS Setup Guide - Local File Storage

This guide will help you deploy Prieelo on your Ubuntu VPS with local file storage instead of AWS S3.

## Prerequisites

- Ubuntu 22.04 LTS VPS
- Domain name pointing to your VPS IP
- SSH access to your server
- At least 4GB RAM, 2 vCPUs, 100GB storage

## Phase 1: Initial Server Setup

### 1.1 Update System and Install Basic Packages

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Set up firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

### 1.2 Create Application User (Optional but Recommended)

```bash
# Create prieelo user
sudo adduser prieelo
sudo usermod -aG sudo prieelo

# Switch to prieelo user for remaining setup
sudo su - prieelo
```

## Phase 2: Install Node.js 18+

```bash
# Install Node.js 18 (required for Next.js 14)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher

# Install PM2 globally for process management
sudo npm install -g pm2
```

## Phase 3: Install and Configure PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user for Prieelo
sudo -u postgres psql << EOF
CREATE DATABASE prieelo_db;
CREATE USER prieelo_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE prieelo_db TO prieelo_user;
ALTER USER prieelo_user CREATEDB;
\q
EOF

# Test connection
psql -h localhost -U prieelo_user -d prieelo_db
# Enter password when prompted, then \q to quit
```

## Phase 4: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default
```

### 4.1 Create Nginx Configuration

Create `/etc/nginx/sites-available/prieelo`:

```nginx
server {
    listen 80;
    server_name prieelo.com www.prieelo.com;
    
    # File upload limit
    client_max_body_size 20M;
    
    # Serve uploaded files directly (better performance than Next.js)
    location /uploads/ {
        alias /var/www/prieelo/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        
        # Security: prevent execution of scripts
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            return 403;
        }
    }
    
    # ACME challenge for SSL certificates
    location ^~ /.well-known/acme-challenge/ {
        alias /var/www/html/.well-known/acme-challenge/;
        default_type "text/plain";
        try_files $uri =404;
    }
    
    # Proxy API routes to Next.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Proxy everything else to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/prieelo /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Phase 5: Install SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Create directory for ACME challenges
sudo mkdir -p /var/www/html/.well-known/acme-challenge

# Get SSL certificate (replace with your actual domain)
sudo certbot --nginx -d prieelo.com -d www.prieelo.com

# Test automatic renewal
sudo certbot renew --dry-run

# Set up automatic renewal (cron job)
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Phase 6: Deploy Prieelo Application

### 6.1 Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/prieelo
sudo chown -R $USER:$USER /var/www/prieelo

# Clone the repository
cd /var/www/prieelo
git clone https://github.com/your-username/prieelo.git .

# Install dependencies
npm ci --production

# Create uploads directory for local file storage
sudo mkdir -p /var/www/prieelo/uploads
sudo chown -R www-data:www-data /var/www/prieelo/uploads
sudo chmod -R 755 /var/www/prieelo/uploads
```

### 6.2 Configure Environment Variables

```bash
# Create production environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

Update `.env.production` with your actual values:

```bash
# Database
DATABASE_URL="postgresql://prieelo_user:your_secure_password_here@localhost:5432/prieelo_db"

# NextAuth
NEXTAUTH_SECRET="your-very-long-random-secret-key-here"
NEXTAUTH_URL="https://prieelo.com"

# Local File Storage
UPLOAD_DIR="/var/www/prieelo/uploads"
BASE_URL="https://prieelo.com"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="noreply@prieelo.com"

# Application
NODE_ENV="production"
PORT="3000"
```

### 6.3 Setup Database and Build Application

```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Start the application with PM2
pm2 start npm --name "prieelo" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Phase 7: Set Up Monitoring and Backups

### 7.1 Create Backup Scripts

Create database backup script `/usr/local/bin/backup-prieelo-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/prieelo-db"
DB_NAME="prieelo_db"
DB_USER="prieelo_user"
DB_PASS="your_secure_password_here"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
PGPASSWORD="$DB_PASS" pg_dump -h localhost -U $DB_USER $DB_NAME > "$BACKUP_DIR/prieelo_db_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/prieelo_db_$DATE.sql"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "prieelo_db_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: prieelo_db_$DATE.sql.gz"
```

Create file backup script `/usr/local/bin/backup-prieelo-files.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/prieelo-uploads"
UPLOAD_DIR="/var/www/prieelo/uploads"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create compressed backup
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" -C "$UPLOAD_DIR" .

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +7 -delete

echo "Files backup completed: uploads_backup_$DATE.tar.gz"
```

```bash
# Make scripts executable
sudo chmod +x /usr/local/bin/backup-prieelo-db.sh
sudo chmod +x /usr/local/bin/backup-prieelo-files.sh

# Create backup directories
sudo mkdir -p /var/backups/prieelo-db
sudo mkdir -p /var/backups/prieelo-uploads

# Set up cron jobs for automatic backups
sudo crontab -e
# Add these lines:
# Database backup daily at 2 AM
0 2 * * * /usr/local/bin/backup-prieelo-db.sh
# Files backup daily at 3 AM
0 3 * * * /usr/local/bin/backup-prieelo-files.sh
```

### 7.2 Security Hardening

```bash
# Install fail2ban to prevent brute force attacks
sudo apt install -y fail2ban

# Create fail2ban configuration
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 7200
EOF

# Start and enable fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 7.3 Performance Optimization

```bash
# Configure swap (if not already configured)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Set up log rotation for PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Phase 8: Final Verification

```bash
# Check all services are running
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Check firewall status
sudo ufw status

# Test the application
curl -I https://prieelo.com

# Check logs
pm2 logs prieelo
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Monitoring Commands

```bash
# System monitoring
htop                    # Install with: sudo apt install htop
df -h                   # Disk usage
free -h                 # Memory usage
sudo netstat -tlnp      # Network connections

# Application monitoring
pm2 monit               # PM2 monitoring dashboard
pm2 logs prieelo        # Application logs

# Database monitoring
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# File storage monitoring
du -sh /var/www/prieelo/uploads/*
```

## Troubleshooting

### Application Won't Start
```bash
pm2 restart prieelo
pm2 logs prieelo --lines 50
```

### Nginx Issues
```bash
sudo nginx -t           # Test configuration
sudo systemctl reload nginx
```

### Database Connection Issues
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### File Upload Issues
```bash
# Check upload directory permissions
ls -la /var/www/prieelo/uploads/
sudo chown -R www-data:www-data /var/www/prieelo/uploads/
sudo chmod -R 755 /var/www/prieelo/uploads/
```

### Disk Space Issues
```bash
df -h
du -sh /var/www/prieelo/uploads/*
# Clean old backups if needed
sudo find /var/backups -name "*.gz" -mtime +30 -delete
```

## Cost Comparison

**With Local Storage:**
- VPS (100GB storage): $24-32/month
- Domain: $1-2/month  
- Email Service: $0-5/month
- **Total: ~$25-39/month**

**Previous S3 Setup:**
- VPS: $18-24/month
- S3 Storage: $5-15/month
- Domain: $1-2/month
- Email: $0-5/month
- **Total: ~$24-46/month**

## Migration from S3 (If Needed)

If you have existing S3 data, create a migration script to download and convert:

```bash
# Create migration script
nano migrate-s3-to-local.js
```

```javascript
// Migration script to download S3 files to local storage
const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises
const path = require('path')
const https = require('https')

const prisma = new PrismaClient()
const UPLOAD_DIR = '/var/www/prieelo/uploads'

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(filepath)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', reject)
  })
}

async function migrateImages() {
  const phases = await prisma.projectPhase.findMany({
    where: { images: { not: [] } }
  })
  
  for (const phase of phases) {
    const newImages = []
    
    for (const s3Url of phase.images) {
      try {
        if (s3Url.startsWith('http')) {
          // It's a signed URL, download it
          const filename = `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
          const yearMonth = new Date().getFullYear() + '/' + String(new Date().getMonth() + 1).padStart(2, '0')
          const localDir = path.join(UPLOAD_DIR, yearMonth)
          
          await fs.mkdir(localDir, { recursive: true })
          const localPath = path.join(localDir, filename)
          const relativePath = path.join(yearMonth, filename)
          
          await downloadFile(s3Url, localPath)
          newImages.push(relativePath)
          
          console.log(`Migrated: ${s3Url} -> ${relativePath}`)
        } else {
          // Keep as-is (might be already migrated)
          newImages.push(s3Url)
        }
      } catch (error) {
        console.error(`Failed to migrate ${s3Url}:`, error)
        newImages.push(s3Url) // Keep original as fallback
      }
    }
    
    // Update database
    await prisma.projectPhase.update({
      where: { id: phase.id },
      data: { images: newImages }
    })
  }
}

migrateImages().then(() => {
  console.log('Migration completed')
  process.exit(0)
}).catch(console.error)
```

```bash
# Run migration
node migrate-s3-to-local.js
```

This setup provides a robust, cost-effective hosting solution with local file storage that can handle significant traffic while maintaining good performance and security.

# VPS Deployment Guide for CRM Copilot

## Server Information
- **VPS IP**: 76.13.106.159
- **Domain**: crm.isprojets.cloud
- **Deploy Path**: /opt/crm
- **SSH User**: root

---

## 1. Initial VPS Setup

### 1.1 Install Docker + Compose Plugin

```bash
# Update system
apt update && apt upgrade -y

# Install prerequisites
apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 1.2 Create Directory Structure

```bash
mkdir -p /opt/crm/{data,nginx/conf.d,certbot/www,certbot/conf}
cd /opt/crm
```

---

## 2. Configuration Files

### 2.1 Create docker-compose.yml

```bash
cat > /opt/crm/docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: ghcr.io/idoum/crm-copilot-1:latest
    container_name: crm-app
    restart: always
    env_file:
      - .env
    volumes:
      - ./data:/data
    networks:
      - web
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: crm-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certbot/conf:/etc/letsencrypt:ro
    depends_on:
      - app
    networks:
      - web

  certbot:
    image: certbot/certbot
    container_name: crm-certbot
    restart: unless-stopped
    volumes:
      - ./certbot/www:/var/www/certbot
      - ./certbot/conf:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot; sleep 12h & wait $${!}; done;'"
    networks:
      - web

networks:
  web:
    driver: bridge
EOF
```

### 2.2 Create Nginx Configuration (HTTP-only for initial setup)

```bash
cat > /opt/crm/nginx/conf.d/default.conf << 'EOF'
# HTTP server - for initial certbot challenge
server {
    listen 80;
    listen [::]:80;
    server_name crm.isprojets.cloud;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS (enabled after cert issuance)
    location / {
        return 301 https://$host$request_uri;
    }
}
EOF
```

### 2.3 Create .env File

```bash
cat > /opt/crm/.env << 'EOF'
# =====================================================
# CRM Copilot - Production Environment
# =====================================================

NODE_ENV=production

# Database (SQLite in container)
DATABASE_URL=file:/data/prod.db

# Authentication
AUTH_SECRET=CHANGE_ME_GENERATE_WITH_openssl_rand_base64_32
NEXTAUTH_URL=https://crm.isprojets.cloud
APP_URL=https://crm.isprojets.cloud

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=CHANGE_ME_YOUR_GMAIL
SMTP_PASS=CHANGE_ME_YOUR_APP_PASSWORD
SMTP_FROM=CHANGE_ME_YOUR_GMAIL

# Tunables (optional - defaults shown)
# INVITE_EXPIRY_DAYS=7
# PASSWORD_RESET_EXPIRY_MINUTES=30
# RESET_RATE_LIMIT_WINDOW_MINUTES=15
# RESET_RATE_LIMIT_MAX=5
# CHANGE_PWD_RATE_LIMIT_WINDOW_MINUTES=10
# CHANGE_PWD_RATE_LIMIT_MAX=5
# BCRYPT_ROUNDS=10
# WORKSPACE_COOKIE_MAX_AGE_DAYS=365
EOF

# Edit with your real values
nano /opt/crm/.env
```

Generate AUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## 3. First-Time TLS Certificate Issuance

### 3.1 Start Nginx (HTTP only)

```bash
cd /opt/crm
docker compose up -d nginx
```

### 3.2 Obtain Certificate with Certbot

```bash
docker run --rm -it \
  -v /opt/crm/certbot/conf:/etc/letsencrypt \
  -v /opt/crm/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d crm.isprojets.cloud \
  --email issa.doumbia.prg@gmail.com \
  --agree-tos \
  --no-eff-email
```

### 3.3 Update Nginx for HTTPS

```bash
cat > /opt/crm/nginx/conf.d/default.conf << 'EOF'
# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name crm.isprojets.cloud;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name crm.isprojets.cloud;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/crm.isprojets.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.isprojets.cloud/privkey.pem;

    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Proxy settings
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF
```

### 3.4 Start All Services

```bash
cd /opt/crm
docker compose up -d
```

---

## 4. Verify Deployment

### 4.1 Check Services

```bash
docker compose ps
docker compose logs -f app
```

### 4.2 Verify Database

```bash
# Check if database file exists
ls -la /opt/crm/data/

# Run migrations if needed
docker compose exec app npx prisma migrate deploy
```

### 4.3 Test Application

- [ ] Visit https://crm.isprojets.cloud - should load
- [ ] Test login functionality
- [ ] Test password reset (check email delivery)
- [ ] Test invite links (check URL uses correct domain)

---

## 5. GitHub Actions Secrets

Add these secrets to your GitHub repository:

| Secret Name | Value |
|-------------|-------|
| `VPS_HOST` | `76.13.106.159` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Your private SSH key (full content) |

### Generate SSH Key Pair (if needed)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_deploy.pub root@76.13.106.159

# Use the private key content for VPS_SSH_KEY secret
cat ~/.ssh/github_deploy
```

---

## 6. Maintenance Commands

### View Logs

```bash
docker compose logs -f app
docker compose logs -f nginx
```

### Restart Services

```bash
docker compose restart
```

### Manual Deploy

```bash
cd /opt/crm
docker compose pull
docker compose up -d
docker image prune -f
```

### Backup Database

```bash
cp /opt/crm/data/prod.db /opt/crm/data/prod.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Run Prisma Commands

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma studio  # (won't work headless, use for debug)
```

### Check Certificate Expiry

```bash
docker compose exec nginx openssl x509 -in /etc/letsencrypt/live/crm.isprojets.cloud/cert.pem -noout -dates
```

### Force Certificate Renewal

```bash
docker compose exec certbot certbot renew --force-renewal
docker compose restart nginx
```

---

## 7. Troubleshooting

### App Won't Start

```bash
docker compose logs app
# Check environment variables
docker compose exec app env | grep -E "(DATABASE|AUTH|SMTP)"
```

### Database Issues

```bash
# Check database file
ls -la /opt/crm/data/
# Ensure proper permissions
chmod 666 /opt/crm/data/prod.db
```

### SSL Certificate Issues

```bash
# Check if certificate exists
ls -la /opt/crm/certbot/conf/live/crm.isprojets.cloud/

# Re-issue certificate
docker run --rm -it \
  -v /opt/crm/certbot/conf:/etc/letsencrypt \
  -v /opt/crm/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d crm.isprojets.cloud --email issa.doumbia.prg@gmail.com \
  --agree-tos --no-eff-email --force-renewal
```

### Nginx Config Test

```bash
docker compose exec nginx nginx -t
```

### teste commit

```bash
teste 2
```

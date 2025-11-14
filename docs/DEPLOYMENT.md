# Deployment Guide

This guide covers deploying Lock-In Responsible from development to production.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Local Deployment](#local-deployment)
3. [Home Server Deployment](#home-server-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Hardware Assembly](#hardware-assembly)
6. [Testing](#testing)

---

## Development Setup

### Prerequisites

- **Development Machine**: Linux, macOS, or Windows with WSL
- **Node.js**: Version 20 or higher
- **PostgreSQL**: Version 15+ (or SQLite for quick start)
- **ESP32**: ESP32-WROOM-32 DevKit
- **Tools**: PlatformIO or Arduino IDE

### Quick Start (10 minutes)

```bash
# 1. Clone repository
git clone <repository-url>
cd lock-in-responsible

# 2. Setup backend
cd backend
npm install
cp .env.example .env

# Edit .env - set JWT secrets and LLM API keys
nano .env

# For quick start with SQLite:
echo 'DATABASE_URL="file:./dev.db"' >> .env

# Initialize database
npm run db:push

# Start backend
npm run dev

# Backend now running on http://localhost:3000

# 3. Setup firmware (in new terminal)
cd ../firmware
cp include/config.h.example include/config.h

# Edit config.h - set WiFi credentials and backend IP
nano include/config.h

# Build and upload
pio run --target upload

# Monitor serial output
pio device monitor

# 4. Test
# In serial monitor, enter: status
# Backend should show device heartbeats in logs
```

---

## Local Deployment

Perfect for single-user setup or development.

### Backend (Raspberry Pi or Local Server)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Setup database
sudo -u postgres createuser lockin
sudo -u postgres createdb lockin
sudo -u postgres psql -c "ALTER USER lockin WITH PASSWORD 'your_password';"

# Clone and setup
git clone <repository-url>
cd lock-in-responsible/backend
npm install

# Configure
cp .env.example .env
nano .env

# Set:
NODE_ENV=production
DATABASE_URL=postgresql://lockin:your_password@localhost:5432/lockin
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 32>
OPENAI_API_KEY=sk-...  # or ANTHROPIC_API_KEY

# Run migrations
npm run db:migrate

# Build
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name lockin-backend
pm2 save
pm2 startup

# Or use systemd (alternative)
sudo nano /etc/systemd/system/lockin.service
```

**Systemd service file:**
```ini
[Unit]
Description=Lock-In Responsible Backend
After=network.target postgresql.service

[Service]
Type=simple
User=lockin
WorkingDirectory=/home/lockin/lock-in-responsible/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable lockin
sudo systemctl start lockin
```

### Nginx Reverse Proxy (Optional but Recommended)

```bash
sudo apt-get install nginx certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/lockin
```

```nginx
server {
    listen 80;
    server_name lockin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lockin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d lockin.yourdomain.com
```

### ESP32 Configuration

Update firmware `config.h`:
```cpp
#define API_HOST "192.168.1.100"  // Your server's local IP
#define API_PORT 3000              // Or 80/443 if using Nginx
#define API_USE_HTTPS false        // true if using HTTPS
```

---

## Home Server Deployment

Using Docker for easier management.

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: lockin
      POSTGRES_USER: lockin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://lockin:${DB_PASSWORD}@postgres:5432/lockin
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Deploy:**
```bash
# Create .env file
echo "DB_PASSWORD=$(openssl rand -base64 32)" > .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env
echo "OPENAI_API_KEY=sk-your-key" >> .env

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run db:migrate

# View logs
docker-compose logs -f
```

### Access via Tailscale (Secure Remote Access)

```bash
# Install Tailscale on server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Install Tailscale on phone/laptop
# Use Tailscale IP to access backend securely from anywhere
```

---

## Cloud Deployment

### AWS Deployment

**Architecture:**
- ECS Fargate (Backend container)
- RDS PostgreSQL (Database)
- Application Load Balancer
- S3 (File uploads)
- CloudFront (CDN)

**Step-by-step:**

1. **Create RDS Database**
```bash
aws rds create-db-instance \
  --db-instance-identifier lockin-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username lockin \
  --master-user-password <password> \
  --allocated-storage 20
```

2. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name lockin-backend
```

3. **Build and Push Docker Image**
```bash
# Build
docker build -t lockin-backend ./backend

# Tag
docker tag lockin-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/lockin-backend:latest

# Push
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/lockin-backend:latest
```

4. **Create ECS Task Definition**

See AWS console or use Terraform.

5. **Create ECS Service**

Connect to RDS, configure environment variables, expose on ALB.

**Estimated costs:**
- RDS db.t3.micro: ~$15/month
- ECS Fargate: ~$15/month
- ALB: ~$16/month
- **Total: ~$46/month**

### Google Cloud Platform

**Using Cloud Run (Serverless):**

```bash
# Build container
gcloud builds submit --tag gcr.io/<project-id>/lockin-backend ./backend

# Deploy
gcloud run deploy lockin-backend \
  --image gcr.io/<project-id>/lockin-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=<cloud-sql-url>,JWT_SECRET=<secret>

# Connect to Cloud SQL
gcloud sql instances create lockin-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

**Estimated costs:**
- Cloud SQL: ~$10/month
- Cloud Run: Pay per request, ~$5-20/month
- **Total: ~$15-30/month**

### Heroku (Easiest)

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
cd backend
heroku create lockin-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
heroku config:set OPENAI_API_KEY=sk-...

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate

# View logs
heroku logs --tail
```

**Estimated costs:**
- Eco Dyno: $5/month
- Mini PostgreSQL: $5/month
- **Total: ~$10/month**

---

## Hardware Assembly

See [HARDWARE.md](HARDWARE.md) for detailed assembly instructions.

**Quick checklist:**
- [ ] ESP32 powered via USB or 5V supply
- [ ] Relay connected to GPIO 4
- [ ] Solenoid connected to 12V via relay
- [ ] Common ground connected
- [ ] LEDs connected with resistors (optional)
- [ ] Buzzer connected (optional)
- [ ] Buttons connected (optional)
- [ ] Everything secured in enclosure
- [ ] Power supply adequate (12V 2A)

---

## Testing

### End-to-End Test

1. **Backend Health**
```bash
curl http://your-server:3000/health
# Should return: {"status":"ok",...}
```

2. **Register User**
```bash
curl -X POST http://your-server:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'
```

3. **Pair Device**
- Via web interface (future) or
- Via serial: `pair:sk_live_xxxxx`

4. **Create Goal**
```bash
curl -X POST http://your-server:3000/api/goals \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Make 1 commit",
    "type": "github_commits",
    "target": 1,
    "deviceId": "<device-id>"
  }'
```

5. **Complete Goal & Verify**

6. **Request Unlock Code**
```bash
curl -X POST http://your-server:3000/api/devices/<device-id>/unlock \
  -H "Authorization: Bearer <token>"
```

7. **Enter Code on ESP32**
```
# In serial monitor:
123456
```

8. **Verify Lock Opens**

---

## Monitoring

### Backend Logs

**PM2:**
```bash
pm2 logs lockin-backend
```

**Docker:**
```bash
docker-compose logs -f backend
```

**Systemd:**
```bash
journalctl -u lockin -f
```

### ESP32 Logs

```bash
# Via serial
pio device monitor

# Or save to file
pio device monitor > esp32.log
```

### Database

```bash
# Connect to database
psql -h localhost -U lockin -d lockin

# Check recent goals
SELECT * FROM "Goal" ORDER BY "createdAt" DESC LIMIT 10;

# Check device heartbeats
SELECT * FROM "DeviceLog" WHERE "eventType" = 'heartbeat' ORDER BY "timestamp" DESC LIMIT 10;
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure firewall (only ports 80, 443, 22)
- [ ] Regular backups of database
- [ ] Keep dependencies updated
- [ ] Monitor failed login attempts
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Review audit logs regularly

---

## Backup & Recovery

### Database Backup

```bash
# Backup
pg_dump -h localhost -U lockin lockin > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U lockin lockin < backup_20251114.sql

# Automated daily backups
echo "0 2 * * * pg_dump -h localhost -U lockin lockin > /backups/backup_\$(date +\%Y\%m\%d).sql" | crontab -
```

### Docker Volume Backup

```bash
docker run --rm -v lockin_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs lockin-backend --lines 100

# Check database connection
psql -h localhost -U lockin -d lockin -c "SELECT 1"

# Check port availability
netstat -tulpn | grep 3000
```

### ESP32 Can't Reach Backend

```bash
# From ESP32's network
ping <backend-ip>
curl http://<backend-ip>:3000/health

# Check firewall
sudo ufw allow 3000/tcp
```

### Goals Not Verifying

```bash
# Check LLM API key
echo $OPENAI_API_KEY

# Test LLM connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check backend logs for errors
```

---

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    # ... existing config
    deploy:
      replicas: 3

  nginx:
    # Configure load balancing
```

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_goals_user_status ON "Goal"("userId", "status");
CREATE INDEX idx_devices_user ON "Device"("userId");

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM "Goal" WHERE "userId" = 'xxx';
```

---

## Next Steps

- Set up monitoring (Prometheus + Grafana)
- Configure alerts (PagerDuty, Slack)
- Implement CI/CD pipeline (GitHub Actions)
- Create mobile app
- Build web dashboard
- Add more integrations (Jira, Notion, etc.)

---

**Deployment Version**: 1.0.0
**Last Updated**: 2025-11-14

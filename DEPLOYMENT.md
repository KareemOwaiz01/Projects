# ScreenGuard Pro - Deployment Guide

This guide provides comprehensive instructions for deploying the ScreenGuard Pro application across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Mobile App Deployment](#mobile-app-deployment)
5. [Configuration](#configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **React Native**: 0.72+
- **Database**: PostgreSQL 12+ or SQLite (development)
- **Redis**: 6.0+ (for caching and WebSocket)
- **Memory**: Minimum 4GB RAM, 8GB recommended
- **Storage**: 10GB free space

### Required Software

- Git
- Docker (optional, for containerized deployment)
- Android Studio (for mobile development)
- Xcode (for iOS development, macOS only)

## Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd screen-guard-pro
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Start development server
python run.py
```

### 3. Web Dashboard Setup

```bash
cd web

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python run.py
```

### 4. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Production Deployment

### Docker Deployment (Recommended)

#### 1. Create Docker Compose File

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: screenguard_db
      POSTGRES_USER: screenguard
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://screenguard:your_password@postgres:5432/screenguard_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  web:
    build: ./web
    ports:
      - "80:8000"
    environment:
      - DATABASE_URL=postgresql://screenguard:your_password@postgres:5432/screenguard_db
      - REDIS_URL=redis://redis:6379/1
    depends_on:
      - postgres
      - redis
      - backend

volumes:
  postgres_data:
```

#### 2. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

### Manual Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3 python3-pip python3-venv postgresql redis-server nginx

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

#### 2. Database Setup

```bash
# Create database
sudo -u postgres createdb screenguard_db
sudo -u postgres createuser screenguard
sudo -u postgres psql -c "ALTER USER screenguard PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE screenguard_db TO screenguard;"
```

#### 3. Application Deployment

```bash
# Clone repository
git clone <repository-url>
cd screen-guard-pro

# Deploy backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Configure environment
cp env.example .env
# Edit .env with production settings

# Run migrations
python manage.py migrate

# Start with Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 api.main:app

# Deploy web dashboard
cd ../web
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp env.example .env
# Edit .env with production settings

# Run migrations
python manage.py migrate
python manage.py collectstatic --noinput

# Start with Gunicorn
gunicorn --bind 0.0.0.0:8001 screenguard_dashboard.wsgi:application
```

#### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/screenguard
server {
    listen 80;
    server_name your-domain.com;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web Dashboard
    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /path/to/screenguard-pro/web/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Mobile App Deployment

### Android Deployment

#### 1. Generate Signed APK

```bash
cd mobile

# Generate keystore
keytool -genkey -v -keystore screenguard-release-key.keystore -alias screenguard -keyalg RSA -keysize 2048 -validity 10000

# Configure gradle
# Edit android/app/build.gradle with signing config

# Build release APK
cd android
./gradlew assembleRelease

# Build AAB for Play Store
./gradlew bundleRelease
```

#### 2. Play Store Deployment

1. Create Google Play Console account
2. Upload AAB file
3. Configure app listing
4. Set up release tracks
5. Submit for review

### iOS Deployment

#### 1. App Store Connect Setup

```bash
cd mobile/ios

# Archive the app
xcodebuild -workspace ScreenGuardPro.xcworkspace -scheme ScreenGuardPro -configuration Release archive -archivePath ScreenGuardPro.xcarchive

# Export for App Store
xcodebuild -exportArchive -archivePath ScreenGuardPro.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist
```

#### 2. App Store Deployment

1. Create App Store Connect account
2. Upload IPA file
3. Configure app metadata
4. Submit for review

## Configuration

### Environment Variables

#### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/screenguard_db
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False

# ML Model Configuration
MODEL_CONFIDENCE_THRESHOLD=0.7
GAZE_THRESHOLD=0.3
```

#### Web Dashboard (.env)

```env
# Django Configuration
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,localhost

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/screenguard_db
REDIS_URL=redis://localhost:6379/1

# API Configuration
API_BASE_URL=http://localhost:8000/api
```

### Security Configuration

#### SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health check
curl http://localhost:8000/api/health

# Web dashboard health check
curl http://localhost:8000/health/

# Database health check
sudo -u postgres psql -c "SELECT 1;"
```

### Log Monitoring

```bash
# View application logs
tail -f /var/log/screenguard/backend.log
tail -f /var/log/screenguard/web.log

# View system logs
journalctl -u screenguard-backend -f
journalctl -u screenguard-web -f
```

### Backup Strategy

```bash
# Database backup
pg_dump screenguard_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/screenguard"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump screenguard_db > $BACKUP_DIR/db_$DATE.sql
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U screenguard -d screenguard_db
```

#### 2. Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping
```

#### 3. Port Conflicts

```bash
# Check port usage
sudo netstat -tulpn | grep :8000
sudo lsof -i :8000
```

#### 4. Permission Issues

```bash
# Fix file permissions
sudo chown -R www-data:www-data /path/to/screenguard-pro
sudo chmod -R 755 /path/to/screenguard-pro
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_detections_timestamp ON detections(timestamp);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
```

#### 2. Caching Configuration

```python
# Redis caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

#### 3. Static File Optimization

```bash
# Collect static files
python manage.py collectstatic --noinput

# Compress static files
pip install django-compressor
```

### Scaling Considerations

#### 1. Horizontal Scaling

- Use load balancer (nginx, HAProxy)
- Deploy multiple backend instances
- Use Redis for session storage
- Implement database read replicas

#### 2. Vertical Scaling

- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use CDN for static files

## Support

For deployment issues and support:

- Check logs in `/var/log/screenguard/`
- Review configuration files
- Test individual components
- Contact development team

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Database Security**: Use strong passwords and restrict access
3. **SSL/TLS**: Always use HTTPS in production
4. **Firewall**: Configure proper firewall rules
5. **Updates**: Keep all dependencies updated
6. **Monitoring**: Implement comprehensive monitoring and alerting

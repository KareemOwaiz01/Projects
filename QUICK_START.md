# ScreenGuard Pro - Quick Start Guide

Get up and running with ScreenGuard Pro in minutes!

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd screen-guard-pro

# Run automated setup
python setup.py
```

### 2. Start Services
```bash
# Start Backend API (Terminal 1)
cd backend
python run.py

# Start Web Dashboard (Terminal 2)
cd web
python run.py

# Start Mobile App (Terminal 3)
cd mobile
npm start
```

### 3. Access the Application
- **Web Dashboard**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Mobile App**: Scan QR code in terminal

## 📱 Mobile App Setup

### Android
```bash
cd mobile
npm run android
```

### iOS
```bash
cd mobile
npm run ios
```

## 🌐 Web Dashboard

1. Open http://localhost:8000
2. Create an account or login
3. Configure your devices
4. Start detection monitoring

## 🔧 Configuration

### Backend Settings
Edit `backend/.env`:
```env
DATABASE_URL=sqlite:///db.sqlite3
SECRET_KEY=your-secret-key
DEBUG=True
```

### Web Dashboard Settings
Edit `web/.env`:
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend && pytest

# Web tests
cd web && python manage.py test

# Mobile tests
cd mobile && npm test
```

## 📚 Documentation

- [Full Documentation](README.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Testing Guide](TESTING.md)

## 🆘 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process using port 8000
lsof -ti:8000 | xargs kill -9
```

**Permission denied:**
```bash
# Fix permissions
chmod +x setup.py
chmod +x start_*.sh
```

**Module not found:**
```bash
# Install dependencies
pip install -r requirements.txt
npm install
```

## 🎯 Next Steps

1. **Configure Detection Settings**
   - Adjust confidence thresholds
   - Set up alert preferences
   - Configure screen regions

2. **Add Devices**
   - Connect mobile devices
   - Configure detection settings
   - Test alert functionality

3. **Monitor Analytics**
   - View detection statistics
   - Analyze alert patterns
   - Optimize settings

## 📞 Support

- **Documentation**: [docs.screenguardpro.com](https://docs.screenguardpro.com)
- **Issues**: [GitHub Issues](https://github.com/screenguardpro/issues)
- **Email**: support@screenguardpro.com

---

**Ready to protect your screen? Start detecting now!** 🛡️

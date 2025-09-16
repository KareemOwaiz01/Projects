# ScreenGuard Pro

A comprehensive security application that protects users from unauthorized screen observation by detecting when someone is peering at their device screen and providing real-time alerts.

## Features

- Real-time camera-based detection of people looking at the user's screen
- Instant alert system (visual, audio, and haptic notifications)
- Privacy-focused design with local processing
- Cross-platform mobile app with supporting web dashboard
- User behavior analytics and security insights
- Configurable sensitivity and detection zones

## Project Structure

```
screen-guard-pro/
├── backend/                 # FastAPI backend application
│   ├── api/                 # API endpoints and routes
│   ├── models/              # ML models and data processing
│   ├── services/            # Business logic
│   └── database/            # Database models and migrations
├── mobile/                  # React Native mobile app
├── web/                     # Django web dashboard
├── ml-models/               # Trained models and training scripts
└── docs/                    # Documentation
```

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

### Mobile App Setup
```bash
cd mobile
npm install
npx react-native run-android  # or run-ios
```

### Web Dashboard Setup
```bash
cd web
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```

## Development Status

- [x] Project structure setup
- [ ] Backend API development
- [ ] ML model implementation
- [ ] Mobile app development
- [ ] Web dashboard development
- [ ] Integration testing

## Privacy & Security

This application prioritizes user privacy:
- All camera data is processed locally on the device
- No personal data is stored in the cloud
- Users have complete control over their data
- Open-source components for transparency

## License

MIT License - see LICENSE file for details

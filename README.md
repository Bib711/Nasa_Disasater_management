# 🚨 NASA Disaster Management System

A comprehensive disaster management application built with Next.js 15, featuring real-time incident reporting, rescue coordination, and AI-powered risk predictions.

## 🌟 Features

- **Citizen Reporting**: Easy incident reporting with map integration
- **Rescue Dashboard**: Complete incident management workflow
- **Live Alerts**: Real-time emergency notifications
- **Interactive Maps**: Leaflet-based mapping with NASA data integration
- **AI Predictions**: Risk analysis and forecasting
- **SMS Broadcasting**: Emergency communication system

## 🚀 Live Demo

**🔗 [View Live Application](https://nasa-disasater-management-1lefvo2al-bibin-bennys-projects.vercel.app/)**

## 📱 Quick Start

### For Citizens:
1. Visit the application
2. Sign up/Login
3. Click "Report Incident" 
4. Fill details and set location
5. Submit report

### For Rescue Teams:
1. Access `/rescue` dashboard
2. Review pending reports in "Reviews" tab
3. Accept incidents to move to "Live Alerts"
4. Monitor active incidents on map
5. Mark as resolved when complete

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI/UX**: Tailwind CSS, Radix UI, Lucide Icons
- **Maps**: Leaflet, React-Leaflet
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Deployment**: Vercel
- **Data Sources**: NASA EONET API

## 🏗️ Architecture

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Citizen Dashboard
│   ├── rescue/           # Rescue Dashboard
│   └── auth/             # Authentication Pages
├── components/            # React Components
│   ├── citizen/          # Citizen Features
│   ├── rescue/           # Rescue Features
│   ├── map/              # Map Components
│   └── ui/               # UI Components
├── models/               # Database Models
├── lib/                  # Utilities
└── hooks/               # Custom Hooks
```

## 🔧 Environment Variables

Create `.env.local` with:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret_key
```

## 📊 Database Schema

### Reports
- **Status Flow**: pending → accepted → resolved
- **Location**: GeoJSON Point format
- **Validation**: Type, description, coordinates

### Alerts
- **Types**: System alerts and resolved incidents
- **Geographic**: 2dsphere indexing for location queries

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Manual Deployment
```bash
# Install dependencies
pnpm install

# Build application
pnpm build

# Start production server
pnpm start
```

## 🔒 Security Features

- **Input Validation**: Client and server-side validation
- **Authentication**: Secure session management
- **Data Sanitization**: Mongoose schema validation
- **Error Handling**: Comprehensive error boundaries

## 📈 Performance

- **SSR/SSG**: Optimized rendering
- **Code Splitting**: Dynamic imports
- **Caching**: SWR for data fetching
- **Image Optimization**: Next.js Image component

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Contact

- **Repository**: [NASA_Disaster_management](https://github.com/Bib711/Nasa_Disasater_management)
- **Issues**: Report bugs and request features

## 🙏 Acknowledgments

- NASA EONET API for disaster data
- OpenStreetMap for mapping tiles
- Vercel for hosting platform
- All contributors and testers

---

**⚡ Built for emergency response and disaster management**
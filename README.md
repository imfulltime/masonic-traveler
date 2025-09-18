# Masonic Traveler

A privacy-first Progressive Web App (PWA) that helps verified Masons connect with nearby brethren, discover lodge meetings, and participate in fraternal activities.

## 🔧 Features

### Core Features
- **🗺️ Nearby Brethren**: Find verified Masons within your chosen radius (privacy-protected with coordinate fuzzing)
- **📅 Lodge Meetings**: Discover and RSVP to meetings and charity events in the next 7 days
- **💬 Secure Messaging**: Chat with connected brethren after mutual consent
- **🏆 Gamification**: Earn badges and compete on leaderboards for visits and charity work
- **🏪 Marketplace**: Directory of Masonic-friendly businesses
- **✅ Verification System**: Secretary approval and brother vouching for authenticity

### Privacy & Security
- **Location Fuzzing**: Your exact location is never stored (±250-500m random offset)
- **Verified Only**: Only verified Masons can access core features
- **Minimal Data**: Only first name + lodge shown after connection
- **Secretary Confirmation**: All activities require lodge secretary verification
- **Audit Trail**: All confirmations are attributable with timestamps

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/masonic-traveler.git
   cd masonic-traveler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the schema from `supabase/schema.sql`
   - Optionally run seed data from `supabase/seed.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **Authentication**: Supabase Auth (email/password + magic links)
- **Real-time**: Supabase Realtime for messaging
- **Maps**: MapLibre GL with OpenStreetMap
- **PWA**: Service Worker, Web App Manifest
- **Testing**: Jest, Playwright
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel + Supabase

## 📱 PWA Features

- **Installable**: Works as a native app on mobile and desktop
- **Offline Support**: Basic offline functionality for cached content
- **Push Notifications**: (Future feature)
- **Native Feel**: Optimized for mobile-first experience

## 🔐 User Roles

- **Guest**: Can browse marketing pages only
- **Verified Brother**: Full access to features after secretary verification
- **Secretary/Delegate**: Can verify members, approve events, confirm activities
- **Admin**: Platform-wide moderation and management

## 🗃️ Database Schema

### Core Tables
- `users` - User profiles and authentication
- `lodges` - Lodge information and locations
- `events` - Meetings and charity events
- `verifications` - Verification requests and approvals
- `presence` - Fuzzed user locations for proximity
- `conversations` & `messages` - Secure messaging
- `counters` & `badges` - Gamification system
- `businesses` - Marketplace directory

### Key Features
- **Row Level Security (RLS)**: Database-level privacy protection
- **Audit Trail**: All secretary actions are logged
- **Materialized Leaderboards**: Performance-optimized rankings

## 🎮 Gamification

### Badge System
- **Visit Badges**: Traveling Man (1), Wandering Mason (6), Globetrotter (16), Master Traveler (31)
- **Charity Badges**: Helping Hand (1), Charity Builder (5), Beacon of Light (15)

### Scoring
- **Lodge Visits**: 1 point each
- **Charity Events**: 2 points each
- **Leaderboards**: Global, Grand Lodge, District levels

## 🧪 Testing

Copy `.env.test` to `.env.local` (or export the same variables) before running automated suites if you don't have Supabase credentials handy. The mocked clients used in unit tests work without a live backend, while Playwright can run against the dev server bootstrapped with these defaults.

### Unit Tests
```bash
npm run test
npm run test:watch
npm run test -- --coverage
```

The suite now includes coverage for guarded routes, the nearby brethren map, upcoming events, and the dashboard messaging experience. You can target specific files via `npm run test -- components/NearbyBrethrenMap.test.tsx` when iterating locally.

### E2E Tests
```bash
npm run test:e2e
npm run test:e2e:headed
```

New Playwright scenarios in `e2e/dashboard-access.spec.ts` verify unauthenticated redirects and the verification flow. Ensure the dev server is running (`npm run dev`) before invoking the command; CI will handle this automatically via the configured webServer hook.

### Linting
```bash
npm run lint
npm run lint:fix
```

## 🚢 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🔧 Configuration

### Location Settings
- `FUZZ_MIN_METERS=250` - Minimum location fuzz distance
- `FUZZ_MAX_METERS=500` - Maximum location fuzz distance
- `DEFAULT_RADIUS_KM=10` - Default search radius

### Scoring Settings
- `LEADERBOARD_SCORE_VISIT_WEIGHT=1` - Points per visit
- `LEADERBOARD_SCORE_CHARITY_WEIGHT=2` - Points per charity event

## 🔒 Security Considerations

### Privacy Protection
- Coordinates are fuzzed server-side before storage
- No exact locations are ever stored or transmitted
- User visibility controlled by verification status
- Messages encrypted in transit and at rest

### Access Control
- Database-level Row Level Security (RLS)
- Role-based feature access
- Secretary actions require lodge association
- Audit trail for all administrative actions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use semantic commit messages
- Ensure accessibility compliance
- Mobile-first responsive design

## 📋 API Reference

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/me` - Current user profile

### Presence & Discovery
- `POST /api/presence/ping` - Update user location
- `GET /api/presence/nearby` - Get nearby brethren

### Events & RSVPs
- `GET /api/events/next7days` - Upcoming events
- `POST /api/events/:id/rsvp` - RSVP to event
- `POST /api/events/:id/checkin` - Check in to event

### Verification
- `POST /api/verify/request` - Request verification
- `POST /api/verify/vouch` - Vouch for another user
- `POST /api/verify/approve` - Approve verification (secretary)

### Messaging
- `GET /api/conversations` - List conversations
- `POST /api/messages` - Send message
- Real-time via Supabase Realtime

## 🎯 Roadmap

### Phase 1 (MVP) ✅
- Core authentication and verification
- Nearby brethren discovery
- Basic messaging
- Event RSVP system
- Secretary console

### Phase 2 (Future)
- Push notifications
- Photo verification for visits
- Advanced event filters
- Multi-language support
- Mobile apps (React Native)

### Phase 3 (Future)
- Grand Lodge integrations
- Advanced analytics
- Mentorship matching
- Educational content

## 🐛 Known Issues

See [Issues](https://github.com/yourusername/masonic-traveler/issues) for current bugs and feature requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Supabase for backend infrastructure
- Vercel for hosting
- The Masonic community for feedback and support

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/masonic-traveler/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/masonic-traveler/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/masonic-traveler/discussions)

## ⚖️ Disclaimer

This is an independent platform not officially affiliated with any Grand Lodge. All participation is voluntary and opt-in. The platform is designed to supplement, not replace, traditional Masonic communication channels.

---

**Built with 🔷 by the Masonic community, for the Masonic community.**

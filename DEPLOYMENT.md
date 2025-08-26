# Deployment Guide - Masonic Traveler

This guide walks you through deploying Masonic Traveler to production using Vercel and Supabase.

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Wait for the project to be provisioned (2-3 minutes)

### 2. Configure Database

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the query to create all tables and RLS policies
4. Optionally, run `supabase/seed.sql` to populate with test data

### 3. Configure Authentication

1. Go to Authentication > Settings
2. Set up email templates for verification
3. Configure redirect URLs:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/auth/callback`

### 4. Get API Keys

1. Go to Settings > API
2. Copy the following values:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key (keep this secure!)

## 🚀 Frontend Deployment (Vercel)

### 1. Prepare Repository

1. Push your code to GitHub
2. Ensure all environment variables are set in `env.example`
3. Verify the build works locally: `npm run build`

### 2. Connect to Vercel

1. Go to [Vercel](https://vercel.com) and sign up with GitHub
2. Click "New Project" and import your repository
3. Vercel will auto-detect Next.js configuration

### 3. Configure Environment Variables

In Vercel dashboard > Settings > Environment Variables, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE=your_service_role_key_here
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
LEADERBOARD_SCORE_VISIT_WEIGHT=1
LEADERBOARD_SCORE_CHARITY_WEIGHT=2
FUZZ_MIN_METERS=250
FUZZ_MAX_METERS=500
DEFAULT_RADIUS_KM=10
```

### 4. Deploy

1. Click "Deploy" - Vercel will build and deploy automatically
2. Your app will be available at `https://your-project.vercel.app`
3. Set up a custom domain in Vercel settings if desired

## 🔧 Custom Domain Setup

### 1. Configure Vercel Domain

1. Go to Vercel project > Settings > Domains
2. Add your custom domain (e.g., `masonictraveler.com`)
3. Follow DNS configuration instructions

### 2. Update Environment Variables

Update these variables with your custom domain:

```env
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

### 3. Update Supabase Settings

1. Go to Supabase Authentication > Settings
2. Update Site URL to your custom domain
3. Update redirect URLs accordingly

## 🔒 Security Configuration

### 1. Supabase Security

1. **RLS Policies**: Ensure all tables have proper Row Level Security policies
2. **API Keys**: Never expose service role key in client-side code
3. **CORS**: Configure allowed origins in Supabase settings
4. **Rate Limiting**: Consider enabling rate limiting for auth endpoints

### 2. Vercel Security

1. **Environment Variables**: Mark sensitive variables as "Sensitive"
2. **Branch Protection**: Limit production deployments to main branch
3. **Custom Headers**: Add security headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## 📊 Monitoring & Analytics

### 1. Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor performance and usage metrics
3. Set up alerts for errors and downtime

### 2. Supabase Monitoring

1. Monitor database performance in Supabase dashboard
2. Set up log retention for debugging
3. Monitor API usage and rate limits

### 3. Error Tracking (Optional)

Consider adding Sentry for comprehensive error tracking:

```bash
npm install @sentry/nextjs
```

## 🔄 CI/CD Pipeline

The project includes GitHub Actions for:

- **Linting & Testing**: Runs on every PR
- **E2E Testing**: Runs on main branch
- **Security Scanning**: CodeQL analysis
- **Automatic Deployment**: Deploys to Vercel on main branch push

### Required GitHub Secrets

Add these secrets to your GitHub repository:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CODECOV_TOKEN=your_codecov_token (optional)
```

## 🗄️ Database Maintenance

### 1. Regular Tasks

Set up cron jobs or Supabase Edge Functions for:

- **Cleanup old presence data**: Remove entries older than 7 days
- **Refresh leaderboards**: Update materialized views daily
- **Archive old messages**: Move old conversations to cold storage

### 2. Backup Strategy

1. **Automatic Backups**: Supabase provides daily backups for paid plans
2. **Manual Exports**: Regularly export critical data
3. **Disaster Recovery**: Document recovery procedures

### 3. Performance Optimization

1. **Indexes**: Monitor slow queries and add indexes as needed
2. **Connection Pooling**: Use Supabase connection pooling for high traffic
3. **Caching**: Implement Redis caching for frequently accessed data

## 🎯 Production Checklist

Before going live, ensure:

- [ ] Database schema is deployed with RLS policies
- [ ] All environment variables are configured
- [ ] Custom domain is set up with SSL
- [ ] Error tracking is configured
- [ ] Backup strategy is in place
- [ ] Monitoring and alerts are set up
- [ ] Security headers are configured
- [ ] Performance testing is completed
- [ ] Legal compliance is reviewed (GDPR, etc.)

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set
   - Verify TypeScript compilation locally
   - Check for missing dependencies

2. **Authentication Issues**
   - Verify Supabase URL and keys
   - Check redirect URLs match exactly
   - Ensure RLS policies allow access

3. **Database Connection Issues**
   - Check Supabase project status
   - Verify network connectivity
   - Check connection limits

4. **Performance Issues**
   - Monitor database query performance
   - Check Vercel function execution times
   - Optimize images and assets

### Getting Help

1. Check Vercel and Supabase status pages
2. Review application logs in respective dashboards
3. Check GitHub Issues for known problems
4. Contact support teams if needed

## 📈 Scaling Considerations

As your user base grows:

1. **Database**: Consider upgrading Supabase plan for higher limits
2. **CDN**: Use Vercel's global CDN for static assets
3. **Edge Functions**: Move compute-heavy tasks to edge functions
4. **Caching**: Implement aggressive caching strategies
5. **Monitoring**: Add more comprehensive monitoring and alerting

---

**Need help with deployment? Check our [GitHub Discussions](https://github.com/yourusername/masonic-traveler/discussions) or open an issue.**

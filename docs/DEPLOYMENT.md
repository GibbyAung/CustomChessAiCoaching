# Chess Engine - Deployment Guide

## 🚀 Production Deployment

This guide covers the deployment process for the Chess Engine application to production.

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Vercel account (for hosting)
- Git repository access

### Environment Setup

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Build the Application

```bash
npm run build
```

#### 3. Test the Build

```bash
npm test
```

### Deployment Options

#### Option 1: Vercel (Recommended)

Vercel provides the best experience for Next.js applications with automatic deployments, SSL, and global CDN.

##### Automatic Deployment (GitHub Integration)

1. **Connect Repository**

   - Push your code to GitHub
   - Connect your repository to Vercel
   - Vercel will automatically deploy on every push

2. **Manual Deployment**

   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy
   vercel --prod
   ```

##### Environment Variables

Set these in your Vercel dashboard:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Chess Engine
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true
NEXT_PUBLIC_PERFORMANCE_MONITORING_ENABLED=true
```

#### Option 2: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t chess-engine .
docker run -p 3000:3000 chess-engine
```

#### Option 3: Traditional Hosting

For traditional hosting providers:

1. **Build the application**

   ```bash
   npm run build
   npm run export  # If using static export
   ```

2. **Upload files** to your hosting provider
3. **Configure server** to serve the application

### Security Configuration

#### Content Security Policy

The application includes a CSP header in `vercel.json`:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
}
```

#### Security Headers

The following security headers are configured:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Performance Optimization

#### Build Optimization

The application is configured for optimal production builds:

- **Code Splitting**: Automatic code splitting by Next.js
- **Tree Shaking**: Unused code is eliminated
- **Minification**: JavaScript and CSS are minified
- **Compression**: Gzip compression enabled

#### Caching Strategy

Static assets are cached for 1 year:

```json
{
  "key": "Cache-Control",
  "value": "public, max-age=31536000, immutable"
}
```

### Monitoring & Analytics

#### Built-in Monitoring

The application includes comprehensive monitoring:

- **Performance Monitoring**: Real-time performance metrics
- **Error Tracking**: Automatic error capture and reporting
- **User Analytics**: User behavior and game completion tracking
- **Performance Analysis**: Automated bottleneck detection

#### Accessing Analytics

1. **Analytics Dashboard**: Click "View Analytics" in the game interface
2. **Performance Analysis**: Click "Performance Analysis" for detailed insights
3. **Data Export**: Export analytics data for external analysis

### Troubleshooting

#### Common Issues

1. **Build Failures**

   ```bash
   # Clear cache and rebuild
   rm -rf .next node_modules
   npm install
   npm run build
   ```

2. **Performance Issues**

   - Check the Performance Analysis dashboard
   - Review browser console for errors
   - Monitor network tab for slow requests

3. **Analytics Not Working**
   - Ensure `NEXT_PUBLIC_ANALYTICS_ENABLED=true`
   - Check browser console for errors
   - Verify localStorage is available

#### Debug Mode

Enable debug mode for development:

```bash
NODE_ENV=development npm run dev
```

### Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Chess game functionality works
- [ ] AI opponent responds correctly
- [ ] Analytics dashboard is accessible
- [ ] Performance analysis works
- [ ] Feedback system is functional
- [ ] Security headers are present
- [ ] SSL certificate is valid
- [ ] Mobile responsiveness works
- [ ] Error monitoring is active

### Maintenance

#### Regular Tasks

1. **Monitor Performance**

   - Check analytics dashboard weekly
   - Review performance analysis monthly
   - Monitor error rates

2. **Update Dependencies**

   ```bash
   npm audit
   npm update
   ```

3. **Backup Analytics Data**
   - Export analytics data monthly
   - Store backups securely

#### Scaling Considerations

- **Traffic Spikes**: Vercel automatically scales
- **Storage**: Analytics data is stored locally (consider external storage for high usage)
- **Performance**: Monitor and optimize based on analytics

### Support

For deployment issues:

1. Check the troubleshooting section
2. Review Vercel deployment logs
3. Check browser console for errors
4. Contact the development team

---

**Deployment Status**: ✅ Ready for Production

The Chess Engine application is fully configured for production deployment with comprehensive monitoring, security, and performance optimization.

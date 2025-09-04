# FindIT Backend Deployment Guide

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB Atlas** account
3. **Gmail** account for email notifications
4. **Git** for version control

## Step 1: Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Create a new cluster (M0 Free tier recommended)
4. Set up database access:
   - Create a database user with read/write permissions
   - Note down username and password
5. Set up network access:
   - Add your IP address or `0.0.0.0/0` for all IPs
6. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

## Step 2: Email Setup (Gmail)

1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an App Password:
   - Go to Security → App passwords
   - Select "Mail" and "Other"
   - Generate and copy the password

## Step 3: Environment Configuration

Create a `config.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/findit_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Step 4: Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Test the API:
   ```bash
   curl http://localhost:5000/health
   ```

## Step 5: Production Deployment

### Option A: Heroku

1. Install Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

3. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI="your_mongodb_uri"
   heroku config:set JWT_SECRET="your_jwt_secret"
   heroku config:set EMAIL_USER="your_email"
   heroku config:set EMAIL_PASS="your_app_password"
   heroku config:set NODE_ENV="production"
   ```

4. Deploy:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Option B: Railway

1. Go to [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Add environment variables in the Railway dashboard
4. Deploy automatically

### Option C: Vercel

1. Go to [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Configure environment variables
4. Deploy

### Option D: DigitalOcean App Platform

1. Go to DigitalOcean App Platform
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy

## Step 6: Domain & SSL Setup

1. Purchase a domain (optional)
2. Configure DNS settings
3. Set up SSL certificate (automatic with most platforms)

## Step 7: Monitoring & Logs

### Health Check
Monitor your API health:
```bash
curl https://your-domain.com/health
```

### Logs
Check application logs:
- Heroku: `heroku logs --tail`
- Railway: Railway dashboard
- Vercel: Vercel dashboard

## Step 8: Database Management

### MongoDB Atlas Dashboard
- Monitor database performance
- Set up alerts
- Configure backups

### Database Indexes
Create indexes for better performance:
```javascript
// In MongoDB Atlas shell or Compass
db.lostitems.createIndex({ "itemName": "text", "description": "text" })
db.founditems.createIndex({ "itemName": "text", "description": "text" })
db.users.createIndex({ "email": 1 })
```

## Step 9: Security Checklist

- [ ] Environment variables are set
- [ ] JWT secret is strong and unique
- [ ] Database connection is secure
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented (optional)
- [ ] Input validation is working
- [ ] Error messages don't expose sensitive data

## Step 10: Testing

### API Testing
Test all endpoints:
```bash
# Health check
curl https://your-domain.com/health

# Register user
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","studentId":"12345","password":"password123"}'

# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Frontend Integration
Update your frontend to use the production API URL:
```javascript
const API_BASE_URL = 'https://your-domain.com/api';
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check connection string
   - Verify network access settings
   - Ensure database user has correct permissions

2. **Email Not Working**
   - Verify Gmail app password
   - Check 2FA is enabled
   - Test email credentials

3. **JWT Errors**
   - Ensure JWT_SECRET is set
   - Check token format in requests
   - Verify token expiration

4. **CORS Errors**
   - Update CORS configuration
   - Check frontend URL in allowed origins

### Support
For issues, check:
- Application logs
- MongoDB Atlas logs
- Network connectivity
- Environment variables

## Performance Optimization

1. **Database Indexes**: Create indexes on frequently queried fields
2. **Caching**: Implement Redis for session storage (optional)
3. **CDN**: Use CDN for static assets
4. **Compression**: Enable gzip compression
5. **Rate Limiting**: Implement API rate limiting

## Backup Strategy

1. **Database Backups**: MongoDB Atlas provides automatic backups
2. **Code Backups**: Use Git for version control
3. **Environment Variables**: Store securely (not in code)
4. **Documentation**: Keep deployment notes updated

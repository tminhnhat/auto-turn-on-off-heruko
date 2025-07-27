# Examples and Use Cases

This document provides practical examples and common use cases for the Heroku Auto Scheduler.

## Basic Setup Examples

### Single App - Simple Schedule
Turn on weekdays at 9 AM, turn off at 6 PM:

```env
HEROKU_API_TOKEN=your_token_here
HEROKU_APP_NAME=my-staging-app
SCHEDULE_ON=0 9 * * 1-5
SCHEDULE_OFF=0 18 * * 1-5
TIMEZONE=America/New_York
```

### Multiple Apps - Different Schedules
Manage staging and development environments:

```env
HEROKU_API_TOKEN=your_token_here
HEROKU_APP_NAMES=staging-app,dev-app,demo-app

# Staging: 8 AM - 8 PM weekdays
STAGING_APP_SCHEDULE_ON=0 8 * * 1-5
STAGING_APP_SCHEDULE_OFF=0 20 * * 1-5
STAGING_APP_TIMEZONE=America/New_York

# Dev: 9 AM - 5 PM weekdays  
DEV_APP_SCHEDULE_ON=0 9 * * 1-5
DEV_APP_SCHEDULE_OFF=0 17 * * 1-5
DEV_APP_TIMEZONE=America/New_York

# Demo: Always on weekdays, off weekends
DEMO_APP_SCHEDULE_ON=0 0 * * 1
DEMO_APP_SCHEDULE_OFF=0 23 * * 5
```

## Common Cron Schedules

### Business Hours
```bash
# Start at 9 AM, stop at 6 PM, Monday-Friday
SCHEDULE_ON="0 9 * * 1-5"
SCHEDULE_OFF="0 18 * * 1-5"
```

### Extended Hours
```bash
# Start at 7 AM, stop at 10 PM, Monday-Friday
SCHEDULE_ON="0 7 * * 1-5"
SCHEDULE_OFF="0 22 * * 1-5"
```

### Weekend Shutdown
```bash
# Turn off Friday night, turn on Monday morning
SCHEDULE_OFF="0 23 * * 5"
SCHEDULE_ON="0 8 * * 1"
```

### Development Schedule
```bash
# 10 AM - 4 PM on weekdays (shorter dev hours)
SCHEDULE_ON="0 10 * * 1-5"
SCHEDULE_OFF="0 16 * * 1-5"
```

### Demo Environment
```bash
# On for presentations: 9 AM - 7 PM, Monday-Thursday
SCHEDULE_ON="0 9 * * 1-4"
SCHEDULE_OFF="0 19 * * 1-4"
```

### Cost-Saving Schedule
```bash
# Only during peak business hours: 10 AM - 3 PM
SCHEDULE_ON="0 10 * * 1-5"
SCHEDULE_OFF="0 15 * * 1-5"
```

## CLI Usage Examples

### Check Status
```bash
# All apps
npm run cli status

# Specific app
npm run cli status --app staging-app
```

### Manual Control
```bash
# Turn on an app manually
npm run cli on --app staging-app

# Turn off an app manually
npm run cli off --app staging-app
```

### Reports
```bash
# View history for last 7 days
npm run cli history

# View history for last 30 days
npm run cli history --days 30

# Health check
npm run cli health

# Statistics
npm run cli stats
```

## Production Deployment Examples

### Using PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'heroku-scheduler',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      HEROKU_API_TOKEN: 'your_token',
      HEROKU_APP_NAMES: 'app1,app2,app3',
      SCHEDULE_ON: '0 9 * * 1-5',
      SCHEDULE_OFF: '0 18 * * 1-5',
      LOG_LEVEL: 'info'
    }
  }]
};
```

### Using Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

### Using Systemd
```ini
[Unit]
Description=Heroku Auto Scheduler
After=network.target

[Service]
Type=simple
User=scheduler
WorkingDirectory=/opt/heroku-scheduler
Environment=NODE_ENV=production
EnvironmentFile=/opt/heroku-scheduler/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Integration Examples

### With Slack Notifications
Add webhook notifications to your environment:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### With Monitoring
Set up health check endpoints:

```bash
# Check if scheduler is running
curl http://localhost:3000/health

# Get app status
curl http://localhost:3000/status
```

### With CI/CD
Include in your deployment pipeline:

```yaml
# GitHub Actions example
- name: Update Heroku Scheduler
  run: |
    heroku config:set HEROKU_APP_NAMES="staging-app,review-app-${{ github.event.number }}"
    pm2 restart heroku-scheduler
```

## Cost Optimization Examples

### Calculate Savings
With a $25/month dyno running 24/7:
- **24/7**: $25/month
- **Business hours only (9-6, weekdays)**: ~$8/month
- **Savings**: $17/month per app

### Multiple Environment Strategy
```env
# Production: Always on
PROD_APP_SCHEDULE_ON=""
PROD_APP_SCHEDULE_OFF=""

# Staging: Business hours
STAGING_APP_SCHEDULE_ON="0 8 * * 1-5"
STAGING_APP_SCHEDULE_OFF="0 20 * * 1-5"

# Development: Shorter hours
DEV_APP_SCHEDULE_ON="0 10 * * 1-5"
DEV_APP_SCHEDULE_OFF="0 16 * * 1-5"

# Demo: On-demand only
DEMO_APP_SCHEDULE_ON=""
DEMO_APP_SCHEDULE_OFF="0 1 * * *"  # Turn off at 1 AM daily
```

## Troubleshooting Examples

### Debug Mode
```env
LOG_LEVEL=debug
```

### Testing Schedules
```bash
# Test with short intervals (every 5 minutes)
SCHEDULE_ON="*/5 * * * *"
SCHEDULE_OFF="*/10 * * * *"
```

### Validate Cron Expressions
Use [Crontab Guru](https://crontab.guru/) to validate your expressions:
- `0 9 * * 1-5` → "At 09:00 on every day-of-week from Monday through Friday"
- `0 18 * * 1-5` → "At 18:00 on every day-of-week from Monday through Friday"

### Common Issues and Solutions

1. **App not responding to scale commands**
   - Check if app has worker dynos instead of web dynos
   - Verify API token permissions

2. **Timezone confusion**
   - Always specify timezone explicitly
   - Use standard timezone names (e.g., "America/New_York")

3. **Cron not firing**
   - Validate cron expression syntax
   - Check server timezone settings
   - Verify the scheduler is running

## Best Practices

1. **Start Small**: Begin with one app and simple schedules
2. **Test First**: Use short intervals to test before production
3. **Monitor Logs**: Keep LOG_LEVEL=info in production
4. **Backup Strategy**: Keep production apps always-on
5. **Health Checks**: Regularly run health checks on managed apps
6. **Documentation**: Document your schedule choices for team members

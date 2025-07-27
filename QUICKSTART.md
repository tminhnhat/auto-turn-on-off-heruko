# Quick Start Guide

This guide will help you get the Heroku Auto Scheduler up and running quickly.

## Prerequisites

1. **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
2. **Heroku Account** - [Sign up at heroku.com](https://heroku.com/)
3. **Heroku API Token** - Get from your [Account Settings](https://dashboard.heroku.com/account)

## Installation

### Option 1: Automated Setup (Windows)
```cmd
setup.bat
```

### Option 2: Automated Setup (Linux/Mac)
```bash
chmod +x setup.sh
./setup.sh
```

### Option 3: Manual Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Build the project
npm run build
```

## Configuration

1. Edit `.env` file:
```env
HEROKU_API_TOKEN=your_heroku_api_token_here
HEROKU_APP_NAME=your_app_name_here
SCHEDULE_ON=0 9 * * 1-5    # 9 AM weekdays
SCHEDULE_OFF=0 18 * * 1-5  # 6 PM weekdays
TIMEZONE=America/New_York
```

2. Get your Heroku API Token:
   - Go to [Heroku Account Settings](https://dashboard.heroku.com/account)
   - Scroll to "API Key" section
   - Click "Reveal" and copy the token

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### With PM2 (Recommended for Production)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Common Schedules

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Weekdays 9 AM | `0 9 * * 1-5` | Monday to Friday at 9:00 AM |
| Weekdays 6 PM | `0 18 * * 1-5` | Monday to Friday at 6:00 PM |
| Every 6 hours | `0 */6 * * *` | Every 6 hours starting at midnight |
| Daily at noon | `0 12 * * *` | Every day at 12:00 PM |
| Weekend shutdown | `0 23 * * 5` | Friday at 11:00 PM |
| Weekend startup | `0 8 * * 1` | Monday at 8:00 AM |

## Multiple Apps

Set multiple apps in `.env`:
```env
HEROKU_APP_NAMES=staging-app,dev-app,demo-app

# Individual schedules (optional)
STAGING_APP_SCHEDULE_ON=0 8 * * 1-5
STAGING_APP_SCHEDULE_OFF=0 20 * * 1-5
```

## Troubleshooting

### App not found
- Check app name spelling
- Verify you have access to the app
- Ensure API token has correct permissions

### Invalid schedule
- Use [Crontab Guru](https://crontab.guru/) to validate expressions
- Format: `minute hour day month weekday`

### Permission denied
- Verify API token is correct
- Check if you're a collaborator on the app
- Ensure app exists and is accessible

## Support

For issues:
1. Check the logs in `logs/` directory
2. Set `LOG_LEVEL=debug` for detailed logging
3. Review the full README.md for comprehensive documentation

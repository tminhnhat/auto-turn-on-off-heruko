# Heroku Auto Scheduler

A TypeScript application that automatically turns Heroku apps on/off using the Heroku API based on configurable schedules. Perfect for managing development and staging environments to save on dyno hours.

## Features

- 🕐 **Flexible Scheduling**: Use cron expressions to define when apps should be turned on/off
- 🌍 **Timezone Support**: Configure different timezones for different apps
- 📱 **Multiple Apps**: Manage multiple Heroku apps with individual schedules
- 📊 **Logging**: Comprehensive logging with Winston
- 🛡️ **Error Handling**: Robust error handling and graceful shutdown
- 🔧 **Environment-based Configuration**: Easy configuration through environment variables

## Prerequisites

- Node.js 18+ and npm
- Heroku account with API access
- Heroku apps you want to manage

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd auto-turn-on-off-heruko
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
HEROKU_API_TOKEN=your_heroku_api_token_here
HEROKU_APP_NAME=your_app_name_here
SCHEDULE_ON=0 9 * * 1-5
SCHEDULE_OFF=0 18 * * 1-5
TIMEZONE=America/New_York
LOG_LEVEL=info
```

## Configuration

### Getting Your Heroku API Token

1. Go to [Heroku Account Settings](https://dashboard.heroku.com/account)
2. Scroll down to "API Key" section
3. Click "Reveal" to show your API key
4. Copy the token to your `.env` file

### Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `HEROKU_API_TOKEN` | Your Heroku API token | `12345678-1234-1234-1234-123456789012` | Yes |
| `HEROKU_APP_NAME` | Single app name | `my-app` | Yes* |
| `HEROKU_APP_NAMES` | Multiple app names (comma-separated) | `app1,app2,app3` | Yes* |
| `SCHEDULE_ON` | Default cron expression for turning apps on | `0 9 * * 1-5` | No |
| `SCHEDULE_OFF` | Default cron expression for turning apps off | `0 18 * * 1-5` | No |
| `TIMEZONE` | Default timezone | `America/New_York` | No |
| `LOG_LEVEL` | Logging level | `info` | No |

*Either `HEROKU_APP_NAME` or `HEROKU_APP_NAMES` is required.

### Cron Expression Examples

- `0 9 * * 1-5` - Every weekday at 9:00 AM
- `0 18 * * 1-5` - Every weekday at 6:00 PM
- `0 */6 * * *` - Every 6 hours
- `30 8 * * 1-5` - Every weekday at 8:30 AM
- `0 0 * * 0` - Every Sunday at midnight

### Multiple Apps Configuration

For multiple apps with individual schedules:

```env
HEROKU_APP_NAMES=staging-app,dev-app,demo-app

# Individual schedules (optional)
STAGING_APP_SCHEDULE_ON=0 8 * * 1-5
STAGING_APP_SCHEDULE_OFF=0 20 * * 1-5
STAGING_APP_TIMEZONE=America/New_York

DEV_APP_SCHEDULE_ON=0 9 * * 1-5
DEV_APP_SCHEDULE_OFF=0 17 * * 1-5
DEV_APP_TIMEZONE=Europe/London
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

1. Build the application:
```bash
npm run build
```

2. Start the application:
```bash
npm start
```

### Using with PM2 (Recommended for Production)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Create PM2 ecosystem file:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'heroku-auto-scheduler',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

3. Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Deployment Options

### Deploy to Heroku

1. Create a new Heroku app:
```bash
heroku create heroku-auto-scheduler
```

2. Set environment variables:
```bash
heroku config:set HEROKU_API_TOKEN=your_token_here
heroku config:set HEROKU_APP_NAMES=app1,app2
heroku config:set SCHEDULE_ON="0 9 * * 1-5"
heroku config:set SCHEDULE_OFF="0 18 * * 1-5"
```

3. Deploy:
```bash
git push heroku main
```

## Monitoring and Logs

### Log Files

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

### Log Levels

- `error` - Only errors
- `warn` - Warnings and errors
- `info` - General information (recommended)
- `debug` - Detailed debugging information

## Troubleshooting

### Common Issues

1. **Invalid API Token**
   - Verify your Heroku API token is correct
   - Check that the token has access to the specified apps

2. **App Not Found**
   - Ensure app names are spelled correctly
   - Verify you have access to the apps

3. **Cron Expression Errors**
   - Use a cron validator to check your expressions
   - Common format: `* * * * *` (minute hour day month weekday)

4. **Permission Errors**
   - Ensure your Heroku account has permission to scale the apps
   - Check if you're a collaborator on the apps

### Debug Mode

Set `LOG_LEVEL=debug` in your environment to get detailed logging.

## License

MIT License

## Security Notes

- Never commit your `.env` file or API tokens to version control
- Use environment variables for all sensitive configuration
- Consider using a secret management service for production deployments
- Regularly rotate your Heroku API tokens

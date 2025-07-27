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
    },
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    env_development: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    },
    // Restart the app if it crashes
    min_uptime: '10s',
    max_restarts: 5,
    
    // Log configuration
    log_file: 'logs/pm2-combined.log',
    out_file: 'logs/pm2-out.log',
    error_file: 'logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Kill timeout
    kill_timeout: 3000
  }]
};

import dotenv from 'dotenv';
import { AppConfig } from '../types/heroku';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

export class Config {
  public readonly herokuApiToken: string;
  public readonly apps: AppConfig[];
  public readonly defaultScheduleOn: string;
  public readonly defaultScheduleOff: string;
  public readonly defaultTimezone: string;
  public readonly logLevel: string;

  constructor() {
    // Validate required environment variables
    this.herokuApiToken = this.getRequiredEnv('HEROKU_API_TOKEN');
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.defaultScheduleOn = process.env.SCHEDULE_ON || '0 9 * * 1-5'; // 9 AM weekdays
    this.defaultScheduleOff = process.env.SCHEDULE_OFF || '0 18 * * 1-5'; // 6 PM weekdays
    this.defaultTimezone = process.env.TIMEZONE || 'America/New_York';

    // Parse apps configuration
    this.apps = this.parseAppsConfig();

    logger.info('Configuration loaded successfully');
    logger.info(`Found ${this.apps.length} app(s) to manage`);
  }

  /**
   * Get required environment variable or throw error
   */
  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Parse apps configuration from environment variables
   */
  private parseAppsConfig(): AppConfig[] {
    const apps: AppConfig[] = [];

    // Check for single app configuration
    const singleAppName = process.env.HEROKU_APP_NAME;
    if (singleAppName) {
      apps.push({
        name: singleAppName,
        scheduleOn: this.defaultScheduleOn,
        scheduleOff: this.defaultScheduleOff,
        timezone: this.defaultTimezone
      });
    }

    // Check for multiple apps configuration
    const multipleAppNames = process.env.HEROKU_APP_NAMES;
    if (multipleAppNames) {
      const appNames = multipleAppNames.split(',').map(name => name.trim());
      appNames.forEach(appName => {
        if (appName) {
          apps.push({
            name: appName,
            scheduleOn: process.env[`${appName.toUpperCase()}_SCHEDULE_ON`] || this.defaultScheduleOn,
            scheduleOff: process.env[`${appName.toUpperCase()}_SCHEDULE_OFF`] || this.defaultScheduleOff,
            timezone: process.env[`${appName.toUpperCase()}_TIMEZONE`] || this.defaultTimezone
          });
        }
      });
    }

    if (apps.length === 0) {
      throw new Error('No Heroku apps configured. Set HEROKU_APP_NAME or HEROKU_APP_NAMES environment variable');
    }

    return apps;
  }

  /**
   * Validate configuration
   */
  validate(): void {
    // Validate API token format (basic check)
    if (!this.herokuApiToken.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
      logger.warn('Heroku API token format appears to be invalid');
    }

    // Validate app names
    this.apps.forEach(app => {
      if (!app.name || app.name.trim().length === 0) {
        throw new Error('App name cannot be empty');
      }
      
      // Heroku app names must be lowercase and contain only letters, numbers, and hyphens
      if (!app.name.match(/^[a-z0-9-]+$/)) {
        logger.warn(`App name "${app.name}" may not follow Heroku naming conventions`);
      }
    });

    logger.info('Configuration validation completed');
  }

  /**
   * Get configuration summary
   */
  getSummary(): object {
    return {
      appsCount: this.apps.length,
      apps: this.apps.map(app => ({
        name: app.name,
        scheduleOn: app.scheduleOn,
        scheduleOff: app.scheduleOff,
        timezone: app.timezone
      })),
      defaultTimezone: this.defaultTimezone,
      logLevel: this.logLevel
    };
  }
}

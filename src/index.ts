import { Config } from './config/config';
import { HerokuClient } from './services/herokuClient';
import { Scheduler } from './services/scheduler';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

class HerokuAutoScheduler {
  private config: Config;
  private herokuClient: HerokuClient;
  private scheduler: Scheduler;

  constructor() {
    try {
      // Create logs directory if it doesn't exist
      this.ensureLogsDirectory();

      // Initialize configuration
      this.config = new Config();
      this.config.validate();

      // Initialize Heroku client
      this.herokuClient = new HerokuClient(this.config.herokuApiToken);

      // Initialize scheduler
      this.scheduler = new Scheduler(this.herokuClient, this.config.apps);

      logger.info('Heroku Auto Scheduler initialized successfully');
      logger.info('Configuration:', this.config.getSummary());
    } catch (error) {
      logger.error('Failed to initialize Heroku Auto Scheduler:', error);
      process.exit(1);
    }
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting Heroku Auto Scheduler...');

      // Validate all apps before starting
      await this.validateAllApps();

      // Start the scheduler
      this.scheduler.start();

      // Log current status
      this.logCurrentStatus();

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      logger.info('Heroku Auto Scheduler is now running');
      logger.info('Press Ctrl+C to stop the scheduler');
    } catch (error) {
      logger.error('Failed to start scheduler:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    logger.info('Stopping Heroku Auto Scheduler...');
    this.scheduler.stop();
    logger.info('Heroku Auto Scheduler stopped');
  }

  /**
   * Validate all configured apps
   */
  private async validateAllApps(): Promise<void> {
    logger.info('Validating all configured apps...');
    
    for (const app of this.config.apps) {
      try {
        const isValid = await this.herokuClient.validateApp(app.name);
        if (!isValid) {
          throw new Error(`App ${app.name} is not accessible`);
        }
        
        // Get current status
        const status = await this.herokuClient.getAppStatus(app.name);
        logger.info(`App ${app.name}: ${status.isRunning ? 'RUNNING' : 'STOPPED'} (${status.dynos.length} dynos)`);
      } catch (error) {
        logger.error(`Validation failed for app ${app.name}:`, error);
        throw error;
      }
    }
    
    logger.info('All apps validated successfully');
  }

  /**
   * Log current status of scheduler and apps
   */
  private async logCurrentStatus(): Promise<void> {
    try {
      logger.info('='.repeat(50));
      logger.info('SCHEDULER STATUS');
      logger.info('='.repeat(50));

      const taskStatus = this.scheduler.getTaskStatus();
      taskStatus.forEach(task => {
        logger.info(`Task: ${task.name} | Running: ${task.isRunning} | Next Run: ${task.nextRun?.toLocaleString() || 'N/A'}`);
      });

      logger.info('='.repeat(50));
      logger.info('APP STATUS');
      logger.info('='.repeat(50));

      for (const app of this.config.apps) {
        try {
          const status = await this.herokuClient.getAppStatus(app.name);
          logger.info(`${app.name}: ${status.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}`);
        } catch (error) {
          logger.warn(`Could not get status for ${app.name}:`, error);
        }
      }

      logger.info('='.repeat(50));
    } catch (error) {
      logger.error('Failed to log current status:', error);
    }
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      this.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.stop();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.stop();
      process.exit(1);
    });
  }

  /**
   * Ensure logs directory exists
   */
  private ensureLogsDirectory(): void {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  /**
   * Manual control methods for testing/debugging
   */
  async manualTurnOn(appName: string): Promise<void> {
    logger.info(`Manual control: Turning ON ${appName}`);
    await this.herokuClient.turnOnApp(appName);
  }

  async manualTurnOff(appName: string): Promise<void> {
    logger.info(`Manual control: Turning OFF ${appName}`);
    await this.herokuClient.turnOffApp(appName);
  }

  async getStatus(appName: string): Promise<{ isRunning: boolean; dynos: any[] }> {
    return await this.herokuClient.getAppStatus(appName);
  }
}

// Run the application if this file is executed directly
if (require.main === module) {
  const app = new HerokuAutoScheduler();
  app.start().catch(error => {
    logger.error('Application failed to start:', error);
    process.exit(1);
  });
}

export { HerokuAutoScheduler };

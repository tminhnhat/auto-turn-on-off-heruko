import * as cron from 'node-cron';
import { HerokuClient } from '../services/herokuClient';
import { AppConfig } from '../types/heroku';
import { logger } from '../utils/logger';

export class Scheduler {
  private herokuClient: HerokuClient;
  private apps: AppConfig[];
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(herokuClient: HerokuClient, apps: AppConfig[]) {
    this.herokuClient = herokuClient;
    this.apps = apps;
  }

  /**
   * Start all scheduled tasks
   */
  start(): void {
    logger.info('Starting scheduler...');
    
    this.apps.forEach(app => {
      this.scheduleAppTasks(app);
    });

    logger.info(`Scheduler started with ${this.jobs.size} scheduled tasks`);
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    logger.info('Stopping scheduler...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped task: ${name}`);
    });
    
    this.jobs.clear();
    logger.info('Scheduler stopped');
  }

  /**
   * Schedule tasks for a specific app
   */
  private scheduleAppTasks(app: AppConfig): void {
    const { name, scheduleOn, scheduleOff, timezone } = app;

    // Validate app exists
    this.validateApp(name);

    // Schedule turn on task
    if (scheduleOn && this.isValidCronExpression(scheduleOn)) {
      const onTaskName = `${name}-on`;
      const onJob = cron.schedule(scheduleOn, async () => {
        await this.turnOnApp(name);
      }, {
        scheduled: false,
        timezone: timezone || 'America/New_York'
      });
      
      onJob.start();
      this.jobs.set(onTaskName, onJob);
      logger.info(`Scheduled turn ON for ${name}: ${scheduleOn} (${timezone || 'system timezone'})`);
    }

    // Schedule turn off task
    if (scheduleOff && this.isValidCronExpression(scheduleOff)) {
      const offTaskName = `${name}-off`;
      const offJob = cron.schedule(scheduleOff, async () => {
        await this.turnOffApp(name);
      }, {
        scheduled: false,
        timezone: timezone || 'America/New_York'
      });
      
      offJob.start();
      this.jobs.set(offTaskName, offJob);
      logger.info(`Scheduled turn OFF for ${name}: ${scheduleOff} (${timezone || 'system timezone'})`);
    }
  }

  /**
   * Validate cron expression
   */
  private isValidCronExpression(expression: string): boolean {
    return cron.validate(expression);
  }

  /**
   * Validate app exists and is accessible
   */
  private async validateApp(appName: string): Promise<void> {
    try {
      const isValid = await this.herokuClient.validateApp(appName);
      if (!isValid) {
        throw new Error(`App ${appName} not found or not accessible`);
      }
      logger.info(`App ${appName} validated successfully`);
    } catch (error) {
      logger.error(`App validation failed for ${appName}:`, error);
      throw error;
    }
  }

  /**
   * Turn on app
   */
  private async turnOnApp(appName: string): Promise<void> {
    try {
      logger.info(`Scheduled task: Turning ON app ${appName}`);
      await this.herokuClient.turnOnApp(appName);
      logger.info(`Scheduled task completed: App ${appName} turned ON`);
    } catch (error) {
      logger.error(`Scheduled task failed: Could not turn ON app ${appName}:`, error);
    }
  }

  /**
   * Turn off app
   */
  private async turnOffApp(appName: string): Promise<void> {
    try {
      logger.info(`Scheduled task: Turning OFF app ${appName}`);
      await this.herokuClient.turnOffApp(appName);
      logger.info(`Scheduled task completed: App ${appName} turned OFF`);
    } catch (error) {
      logger.error(`Scheduled task failed: Could not turn OFF app ${appName}:`, error);
    }
  }

  /**
   * Get status of all scheduled tasks
   */
  getTaskStatus(): Array<{ name: string; isRunning: boolean; nextRun?: Date }> {
    const status: Array<{ name: string; isRunning: boolean; nextRun?: Date }> = [];
    
    this.jobs.forEach((job, name) => {
      status.push({
        name,
        isRunning: job.getStatus() === 'scheduled',
        nextRun: job.nextDate()?.toDate()
      });
    });
    
    return status;
  }

  /**
   * Add a new app to the scheduler
   */
  addApp(app: AppConfig): void {
    this.apps.push(app);
    this.scheduleAppTasks(app);
    logger.info(`Added new app to scheduler: ${app.name}`);
  }

  /**
   * Remove an app from the scheduler
   */
  removeApp(appName: string): void {
    // Stop and remove related tasks
    const tasksToRemove = Array.from(this.jobs.keys()).filter(taskName => 
      taskName.startsWith(`${appName}-`)
    );
    
    tasksToRemove.forEach(taskName => {
      const job = this.jobs.get(taskName);
      if (job) {
        job.stop();
        this.jobs.delete(taskName);
        logger.info(`Removed task: ${taskName}`);
      }
    });
    
    // Remove from apps array
    this.apps = this.apps.filter(app => app.name !== appName);
    logger.info(`Removed app from scheduler: ${appName}`);
  }
}

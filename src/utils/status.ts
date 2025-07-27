import { HerokuClient } from '../services/herokuClient';
import { logger } from '../utils/logger';

export class HerokuStatus {
  private herokuClient: HerokuClient;

  constructor(herokuClient: HerokuClient) {
    this.herokuClient = herokuClient;
  }

  /**
   * Get detailed status of all apps
   */
  async getAllAppsStatus(appNames: string[]): Promise<Array<{
    name: string;
    isRunning: boolean;
    dynos: any[];
    formation: any[];
    lastUpdate: Date;
    url?: string;
  }>> {
    const results = [];

    for (const appName of appNames) {
      try {
        const [status, formation, app] = await Promise.all([
          this.herokuClient.getAppStatus(appName),
          this.herokuClient.getFormation(appName),
          this.herokuClient.getApp(appName)
        ]);

        results.push({
          name: appName,
          isRunning: status.isRunning,
          dynos: status.dynos,
          formation,
          lastUpdate: new Date(),
          url: app.web_url
        });
      } catch (error) {
        logger.error(`Failed to get status for ${appName}:`, error);
        results.push({
          name: appName,
          isRunning: false,
          dynos: [],
          formation: [],
          lastUpdate: new Date(),
          url: undefined
        });
      }
    }

    return results;
  }

  /**
   * Generate status report
   */
  async generateStatusReport(appNames: string[]): Promise<string> {
    const statuses = await this.getAllAppsStatus(appNames);
    
    let report = '\n='.repeat(60) + '\n';
    report += '📊 HEROKU APPS STATUS REPORT\n';
    report += '='.repeat(60) + '\n';
    report += `📅 Generated: ${new Date().toLocaleString()}\n`;
    report += `📱 Total Apps: ${statuses.length}\n\n`;

    statuses.forEach(status => {
      const statusIcon = status.isRunning ? '🟢' : '🔴';
      const statusText = status.isRunning ? 'RUNNING' : 'STOPPED';
      
      report += `${statusIcon} ${status.name.toUpperCase()}\n`;
      report += `   Status: ${statusText}\n`;
      report += `   Dynos: ${status.dynos.length}\n`;
      
      if (status.dynos.length > 0) {
        status.dynos.forEach(dyno => {
          report += `     - ${dyno.type}: ${dyno.state} (${dyno.size})\n`;
        });
      }
      
      if (status.url) {
        report += `   URL: ${status.url}\n`;
      }
      
      report += `   Last Check: ${status.lastUpdate.toLocaleTimeString()}\n\n`;
    });

    const runningCount = statuses.filter(s => s.isRunning).length;
    const stoppedCount = statuses.length - runningCount;
    
    report += '📈 SUMMARY\n';
    report += '-'.repeat(30) + '\n';
    report += `🟢 Running: ${runningCount}\n`;
    report += `🔴 Stopped: ${stoppedCount}\n`;
    report += '='.repeat(60) + '\n';

    return report;
  }

  /**
   * Check if apps are healthy
   */
  async healthCheck(appNames: string[]): Promise<{
    healthy: boolean;
    issues: string[];
    summary: { running: number; stopped: number; errors: number };
  }> {
    const statuses = await this.getAllAppsStatus(appNames);
    const issues: string[] = [];
    let errorCount = 0;

    statuses.forEach(status => {
      if (status.dynos.length === 0 && status.isRunning) {
        issues.push(`${status.name}: Reports running but has no dynos`);
        errorCount++;
      }

      status.dynos.forEach(dyno => {
        if (dyno.state === 'crashed') {
          issues.push(`${status.name}: Dyno ${dyno.name} is crashed`);
          errorCount++;
        }
        if (dyno.state === 'idle' && status.isRunning) {
          issues.push(`${status.name}: Dyno ${dyno.name} is idle`);
        }
      });
    });

    const running = statuses.filter(s => s.isRunning).length;
    const stopped = statuses.length - running;

    return {
      healthy: issues.length === 0,
      issues,
      summary: { running, stopped, errors: errorCount }
    };
  }
}

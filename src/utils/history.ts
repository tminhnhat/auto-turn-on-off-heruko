import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

export interface ScheduleHistory {
  timestamp: Date;
  appName: string;
  action: 'turn_on' | 'turn_off';
  success: boolean;
  error?: string;
  previousState?: 'running' | 'stopped';
  newState?: 'running' | 'stopped';
}

export class HistoryManager {
  private historyFile: string;
  private maxHistoryEntries: number;

  constructor(historyFile: string = 'logs/schedule-history.json', maxEntries: number = 1000) {
    this.historyFile = historyFile;
    this.maxHistoryEntries = maxEntries;
    this.ensureHistoryFile();
  }

  /**
   * Add an entry to the history
   */
  async addEntry(entry: Omit<ScheduleHistory, 'timestamp'>): Promise<void> {
    try {
      const history = await this.getHistory();
      const newEntry: ScheduleHistory = {
        ...entry,
        timestamp: new Date()
      };

      history.unshift(newEntry);

      // Keep only the most recent entries
      if (history.length > this.maxHistoryEntries) {
        history.splice(this.maxHistoryEntries);
      }

      await this.saveHistory(history);
      logger.debug('History entry added:', newEntry);
    } catch (error) {
      logger.error('Failed to add history entry:', error);
    }
  }

  /**
   * Get history entries
   */
  async getHistory(limit?: number): Promise<ScheduleHistory[]> {
    try {
      const data = await fs.promises.readFile(this.historyFile, 'utf8');
      const history: ScheduleHistory[] = JSON.parse(data);
      
      // Convert timestamp strings back to Date objects
      history.forEach(entry => {
        entry.timestamp = new Date(entry.timestamp);
      });

      return limit ? history.slice(0, limit) : history;
    } catch (error) {
      logger.warn('Could not read history file, returning empty history');
      return [];
    }
  }

  /**
   * Get history for a specific app
   */
  async getAppHistory(appName: string, limit?: number): Promise<ScheduleHistory[]> {
    const history = await this.getHistory();
    const appHistory = history.filter(entry => entry.appName === appName);
    return limit ? appHistory.slice(0, limit) : appHistory;
  }

  /**
   * Get statistics from history
   */
  async getStatistics(days: number = 30): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    successRate: number;
    actionsByApp: Record<string, { turnOn: number; turnOff: number; failures: number }>;
    recentFailures: ScheduleHistory[];
  }> {
    const history = await this.getHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentHistory = history.filter(entry => entry.timestamp >= cutoffDate);
    
    const stats = {
      totalActions: recentHistory.length,
      successfulActions: recentHistory.filter(entry => entry.success).length,
      failedActions: recentHistory.filter(entry => !entry.success).length,
      successRate: 0,
      actionsByApp: {} as Record<string, { turnOn: number; turnOff: number; failures: number }>,
      recentFailures: recentHistory.filter(entry => !entry.success).slice(0, 10)
    };

    stats.successRate = stats.totalActions > 0 ? (stats.successfulActions / stats.totalActions) * 100 : 100;

    // Group by app
    recentHistory.forEach(entry => {
      if (!stats.actionsByApp[entry.appName]) {
        stats.actionsByApp[entry.appName] = { turnOn: 0, turnOff: 0, failures: 0 };
      }

      if (entry.success) {
        if (entry.action === 'turn_on') {
          stats.actionsByApp[entry.appName].turnOn++;
        } else {
          stats.actionsByApp[entry.appName].turnOff++;
        }
      } else {
        stats.actionsByApp[entry.appName].failures++;
      }
    });

    return stats;
  }

  /**
   * Generate history report
   */
  async generateReport(days: number = 7): Promise<string> {
    const stats = await this.getStatistics(days);
    
    let report = '\n' + '='.repeat(60) + '\n';
    report += `📋 SCHEDULE HISTORY REPORT (Last ${days} days)\n`;
    report += '='.repeat(60) + '\n';
    report += `📅 Generated: ${new Date().toLocaleString()}\n\n`;

    report += '📊 OVERALL STATISTICS\n';
    report += '-'.repeat(30) + '\n';
    report += `Total Actions: ${stats.totalActions}\n`;
    report += `Successful: ${stats.successfulActions}\n`;
    report += `Failed: ${stats.failedActions}\n`;
    report += `Success Rate: ${stats.successRate.toFixed(1)}%\n\n`;

    if (Object.keys(stats.actionsByApp).length > 0) {
      report += '📱 BY APPLICATION\n';
      report += '-'.repeat(30) + '\n';
      Object.entries(stats.actionsByApp).forEach(([appName, appStats]) => {
        report += `${appName}:\n`;
        report += `  Turn On: ${appStats.turnOn}\n`;
        report += `  Turn Off: ${appStats.turnOff}\n`;
        report += `  Failures: ${appStats.failures}\n\n`;
      });
    }

    if (stats.recentFailures.length > 0) {
      report += '❌ RECENT FAILURES\n';
      report += '-'.repeat(30) + '\n';
      stats.recentFailures.forEach((failure: ScheduleHistory) => {
        report += `${failure.timestamp.toLocaleString()} - ${failure.appName} (${failure.action})\n`;
        if (failure.error) {
          report += `   Error: ${failure.error}\n`;
        }
      });
      report += '\n';
    }

    report += '='.repeat(60) + '\n';
    return report;
  }

  /**
   * Clear old history entries
   */
  async cleanup(olderThanDays: number = 90): Promise<number> {
    try {
      const history = await this.getHistory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const filteredHistory = history.filter(entry => entry.timestamp >= cutoffDate);
      const removedCount = history.length - filteredHistory.length;

      if (removedCount > 0) {
        await this.saveHistory(filteredHistory);
        logger.info(`Cleaned up ${removedCount} old history entries`);
      }

      return removedCount;
    } catch (error) {
      logger.error('Failed to cleanup history:', error);
      return 0;
    }
  }

  /**
   * Ensure history file exists
   */
  private ensureHistoryFile(): void {
    try {
      const dir = path.dirname(this.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(this.historyFile)) {
        fs.writeFileSync(this.historyFile, '[]', 'utf8');
      }
    } catch (error) {
      logger.error('Failed to ensure history file exists:', error);
    }
  }

  /**
   * Save history to file
   */
  private async saveHistory(history: ScheduleHistory[]): Promise<void> {
    await fs.promises.writeFile(this.historyFile, JSON.stringify(history, null, 2), 'utf8');
  }
}

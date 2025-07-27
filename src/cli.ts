#!/usr/bin/env node

import { HerokuAutoScheduler } from './index';
import { logger } from './utils/logger';

interface CLIArgs {
  command: string;
  app?: string;
  days?: number;
  help?: boolean;
}

class CLI {
  private scheduler: HerokuAutoScheduler;

  constructor() {
    this.scheduler = new HerokuAutoScheduler();
  }

  async run(args: string[]): Promise<void> {
    const parsedArgs = this.parseArgs(args);

    if (parsedArgs.help || !parsedArgs.command) {
      this.showHelp();
      return;
    }

    try {
      switch (parsedArgs.command) {
        case 'start':
          await this.scheduler.start();
          break;
        
        case 'status':
          await this.showStatus(parsedArgs.app);
          break;
        
        case 'history':
          await this.showHistory(parsedArgs.days || 7);
          break;
        
        case 'health':
          await this.showHealthCheck();
          break;
        
        case 'stats':
          await this.showStats();
          break;
        
        case 'on':
          if (!parsedArgs.app) {
            console.error('Error: --app parameter is required for "on" command');
            process.exit(1);
          }
          await this.scheduler.manualTurnOn(parsedArgs.app);
          break;
        
        case 'off':
          if (!parsedArgs.app) {
            console.error('Error: --app parameter is required for "off" command');
            process.exit(1);
          }
          await this.scheduler.manualTurnOff(parsedArgs.app);
          break;
        
        default:
          console.error(`Unknown command: ${parsedArgs.command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      logger.error('CLI command failed:', error);
      process.exit(1);
    }
  }

  private parseArgs(args: string[]): CLIArgs {
    const result: CLIArgs = { command: '' };
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--help' || arg === '-h') {
        result.help = true;
      } else if (arg === '--app' || arg === '-a') {
        result.app = args[++i];
      } else if (arg === '--days' || arg === '-d') {
        result.days = parseInt(args[++i], 10);
      } else if (!result.command) {
        result.command = arg;
      }
    }
    
    return result;
  }

  private showHelp(): void {
    console.log(`
Heroku Auto Scheduler CLI

Usage: heroku-scheduler <command> [options]

Commands:
  start                 Start the scheduler daemon
  status [--app <name>] Show status of apps (or specific app)
  history [--days <n>]  Show schedule history (default: 7 days)
  health                Perform health check on all apps
  stats                 Show scheduler statistics
  on --app <name>       Manually turn on an app
  off --app <name>      Manually turn off an app

Options:
  --app, -a <name>      Specify app name
  --days, -d <number>   Number of days for history
  --help, -h            Show this help message

Examples:
  heroku-scheduler start
  heroku-scheduler status --app my-app
  heroku-scheduler history --days 30
  heroku-scheduler on --app staging-app
  heroku-scheduler off --app dev-app
`);
  }

  private async showStatus(appName?: string): Promise<void> {
    if (appName) {
      const status = await this.scheduler.getStatus(appName);
      console.log(`\nApp: ${appName}`);
      console.log(`Status: ${status.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}`);
      console.log(`Dynos: ${status.dynos.length}`);
      
      if (status.dynos.length > 0) {
        status.dynos.forEach(dyno => {
          console.log(`  - ${dyno.type}: ${dyno.state} (${dyno.size})`);
        });
      }
    } else {
      const report = await this.scheduler.generateStatusReport();
      console.log(report);
    }
  }

  private async showHistory(days: number): Promise<void> {
    const report = await this.scheduler.generateHistoryReport(days);
    console.log(report);
  }

  private async showHealthCheck(): Promise<void> {
    const health = await this.scheduler.performHealthCheck();
    
    console.log('\n🏥 HEALTH CHECK REPORT');
    console.log('='.repeat(40));
    console.log(`Overall Health: ${health.healthy ? '✅ HEALTHY' : '❌ ISSUES FOUND'}`);
    console.log(`Running Apps: ${health.summary.running}`);
    console.log(`Stopped Apps: ${health.summary.stopped}`);
    console.log(`Apps with Errors: ${health.summary.errors}`);
    
    if (health.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      health.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    console.log('='.repeat(40));
  }

  private async showStats(): Promise<void> {
    const stats = await this.scheduler.getSchedulerStats();
    
    console.log('\n📊 SCHEDULER STATISTICS');
    console.log('='.repeat(40));
    console.log(`Total Actions: ${stats.totalActions}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Successful Actions: ${stats.successfulActions}`);
    console.log(`Failed Actions: ${stats.failedActions}`);
    
    if (Object.keys(stats.actionsByApp).length > 0) {
      console.log('\nBy Application:');
      Object.entries(stats.actionsByApp).forEach(([appName, appStats]: [string, any]) => {
        console.log(`  ${appName}:`);
        console.log(`    Turn On: ${appStats.turnOn}`);
        console.log(`    Turn Off: ${appStats.turnOff}`);
        console.log(`    Failures: ${appStats.failures}`);
      });
    }
    
    console.log('='.repeat(40));
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new CLI();
  const args = process.argv.slice(2);
  
  cli.run(args).catch(error => {
    console.error('CLI Error:', error.message);
    process.exit(1);
  });
}

export { CLI };

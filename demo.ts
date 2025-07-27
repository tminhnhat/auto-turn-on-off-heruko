import { HerokuClient } from './src/services/herokuClient';
import { Config } from './src/config/config';
import { Scheduler } from './src/services/scheduler';
import { logger } from './src/utils/logger';

async function demonstrateFeatures() {
  console.log('🚀 Heroku Auto Scheduler Demo');
  console.log('='.repeat(50));
  
  try {
    // Load configuration
    console.log('📋 Loading configuration...');
    const config = new Config();
    console.log(`✅ Configuration loaded for ${config.apps.length} app(s)`);
    
    // Initialize Heroku client
    console.log('🔗 Initializing Heroku client...');
    const herokuClient = new HerokuClient(config.herokuApiToken);
    console.log('✅ Heroku client initialized');
    
    // Test app validation
    console.log('🔍 Validating apps...');
    for (const app of config.apps) {
      try {
        const isValid = await herokuClient.validateApp(app.name);
        console.log(`${isValid ? '✅' : '❌'} ${app.name}: ${isValid ? 'Valid' : 'Invalid'}`);
        
        if (isValid) {
          const status = await herokuClient.getAppStatus(app.name);
          console.log(`   Status: ${status.isRunning ? 'Running' : 'Stopped'}`);
          console.log(`   Dynos: ${status.dynos.length}`);
        }
      } catch (error: any) {
        console.log(`❌ ${app.name}: Error - ${error.message}`);
      }
    }
    
    // Initialize scheduler (but don't start it)
    console.log('⏰ Initializing scheduler...');
    const scheduler = new Scheduler(herokuClient, config.apps);
    console.log('✅ Scheduler initialized');
    
    // Show schedule information
    console.log('\n📅 Configured Schedules:');
    config.apps.forEach(app => {
      console.log(`${app.name}:`);
      console.log(`  Turn ON:  ${app.scheduleOn || 'Not configured'}`);
      console.log(`  Turn OFF: ${app.scheduleOff || 'Not configured'}`);
      console.log(`  Timezone: ${app.timezone || 'Default'}`);
    });
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('\nTo start the scheduler:');
    console.log('  npm run dev    (development mode)');
    console.log('  npm start      (production mode)');
    
  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
    console.log('\n🔧 Make sure to:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Set your HEROKU_API_TOKEN');
    console.log('3. Set your HEROKU_APP_NAME or HEROKU_APP_NAMES');
  }
}

// Run the demo
demonstrateFeatures().catch(error => {
  logger.error('Demo error:', error);
});

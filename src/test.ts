import { HerokuAutoScheduler } from '../src/index';
import { HerokuClient } from '../src/services/herokuClient';

// Mock environment for testing
process.env.HEROKU_API_TOKEN = 'test-token';
process.env.HEROKU_APP_NAME = 'test-app';
process.env.SCHEDULE_ON = '0 9 * * 1-5';
process.env.SCHEDULE_OFF = '0 18 * * 1-5';
process.env.LOG_LEVEL = 'debug';

async function testHerokuClient() {
  console.log('Testing Heroku Client...');
  
  try {
    const client = new HerokuClient('fake-token');
    
    // This will fail with fake token, but tests the structure
    console.log('✓ HerokuClient instantiated successfully');
  } catch (error) {
    console.log('✗ HerokuClient test failed:', error);
  }
}

async function testScheduler() {
  console.log('Testing Scheduler...');
  
  try {
    // This will fail without valid token, but tests the structure
    const app = new HerokuAutoScheduler();
    console.log('✓ HerokuAutoScheduler instantiated successfully');
  } catch (error) {
    console.log('✗ HerokuAutoScheduler test failed:', error);
  }
}

async function runTests() {
  console.log('Running basic tests...\n');
  
  await testHerokuClient();
  await testScheduler();
  
  console.log('\nTests completed!');
  console.log('\nTo run with real Heroku apps:');
  console.log('1. Set your real HEROKU_API_TOKEN in .env');
  console.log('2. Set your real HEROKU_APP_NAME in .env');
  console.log('3. Run: npm run dev');
}

runTests().catch(console.error);

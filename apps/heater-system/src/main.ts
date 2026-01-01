import { MQTTServiceFactory } from '@home-automation/core';
import { HeaterSystem } from './system-definition/heater-system.js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function main() {
  console.log('--- Starting Heater System Simulation ---');
  const messageBus = MQTTServiceFactory.create('heater-system');

  // Create and Configure IoT System
  // This will instantiate devices, add them to the system, and start them.
  const system = new HeaterSystem(messageBus);

  system.initialize();

  console.log(
    'System initialized and devices added and started automatically.',
  );

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    system.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start heater system:', err);
  process.exit(1);
});

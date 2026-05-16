import { MQTTServiceFactory } from '@home-automation/core';
import { HeaterSystem, createHeaterConfig } from './system-definition/heater-system.js';
import { SimulatedHeater } from '@home-automation/simulations';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function main() {
  console.log('--- Starting Heater System Simulation ---');
  const messageBus = MQTTServiceFactory.create('heater-system');

  // 1. Simulate devices so that heater system can use it in real world
  // device will have there separate lifecycle and they will run independently
  const heater1Sim = new SimulatedHeater(
    createHeaterConfig('Living Room Heater', 'heater1') as any,
    messageBus,
  );
  const heater2Sim = new SimulatedHeater(
    createHeaterConfig('Bedroom Heater', 'heater2') as any,
    messageBus,
  );

  heater1Sim.start();
  heater2Sim.start();

  // 2. Create and Configure IoT System (Uses ProxyDevice internally)
  const system = new HeaterSystem(messageBus);

  system.initialize();

  console.log(
    'System initialized with ProxyDevices. Simulations started independently.',
  );

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    system.stop();
    //stop devices when simulation ends
    heater1Sim.stop();
    heater2Sim.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start heater system:', err);
  process.exit(1);
});

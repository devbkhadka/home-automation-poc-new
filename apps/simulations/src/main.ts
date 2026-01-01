import {
  MQTTServiceFactory,
  DeviceConfig,
  ActuatorConfig,
  SensorConfig,
} from '@home-automation/core';
import { SimulatedHeater } from './heater-simulation.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runHeaterSimulation() {
  const mqttClient = MQTTServiceFactory.create('heater-simulation');

  const config: DeviceConfig<
    Record<string, SensorConfig>,
    Record<string, ActuatorConfig>
  > = {
    guid: 'heater-1',
    namespace: 'home',
    name: 'Simulated Heater',
    model: 'SIM-H1',
    version: '1.0.0',
    manufacturer: 'SimCorp',
    sensors: {
      temperature: {
        name: 'Temperature',
        dataType: 'number',
        dataProductionMode: 'periodic',
      },
    },
    actuators: {
      power: {
        name: 'Power',
        dataType: 'string', // 'off' | 'low' | 'high'
      },
    },
  };

  const heater = new SimulatedHeater(config, mqttClient);
  heater.start();

  // Handle termination
  const cleanup = () => {
    console.log('\nTerminating simulation...');
    heater.stop();
    mqttClient.disconnect();
    console.log('MQTT client disconnected. Exiting.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log('Heater simulation is running. Press Ctrl+C to stop.');
}

async function main() {
  const args = process.argv.slice(2);
  const simName = args.find((arg) => arg.startsWith('--name='))?.split('=')[1];

  if (simName === 'heater') {
    await runHeaterSimulation();
  } else {
    console.error('Available simulations: --name=heater');
    process.exit(1);
  }
}

main().catch(console.error);

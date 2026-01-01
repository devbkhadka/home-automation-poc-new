import {
  ActuatorConfig,
  DeviceConfig,
  SensorConfig,
  DeviceStatus,
} from './interfaces.js';
import { AbstractDevice } from './device.js';

const sensors: Record<string, SensorConfig> = {
  temperature: {
    dataType: 'number',
    dataProductionMode: 'on-demand',
    name: 'Temperature',
  },
  humidity: {
    dataType: 'number',
    dataProductionMode: 'on-demand',
    name: 'Humidity',
  },
};

const actuators: Record<string, ActuatorConfig> = {
  powerSwitch: {
    dataType: 'boolean',
    name: 'Power Switch',
  },
  fanSpeed: {
    dataType: 'number',
    name: 'Fan Speed',
  },
  heaterPower: {
    dataType: 'number',
    name: 'Heater Power',
  },
};

interface HeaterActuators {
  powerSwitch: boolean;
  fanSpeed: number;
  heaterPower: number;
}

interface HeaterSensors {
  temperature: number;
  humidity: number;
}

export class Heater extends AbstractDevice<HeaterActuators, HeaterSensors> {
  constructor(config: DeviceConfig) {
    super(config);
  }

  async configure(config: DeviceConfig): Promise<void> {
    console.log(`Configuring heater ${this.guid}`);
  }

  async reboot(): Promise<void> {
    console.log(`Rebooting heater ${this.guid}`);
  }

  getStatus(): DeviceStatus {
    return DeviceStatus.ONLINE;
  }
}

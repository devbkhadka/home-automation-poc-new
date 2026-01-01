import { DeviceConfig, DeviceStatus } from './interfaces.js';
import { AbstractDevice } from './device.js';

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

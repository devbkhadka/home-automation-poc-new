import {
  ActuatorConfig,
  DeviceConfig,
  DeviceStatus,
  IMessageBus,
  SensorConfig,
} from './interfaces';
import { AbstractDevice } from './device';

interface HeaterActuators extends Record<string, ActuatorConfig> {
  powerSwitch: { name: 'powerSwitch'; dataType: 'boolean' };
  fanSpeed: { name: 'fanSpeed'; dataType: 'number' };
  heaterPower: { name: 'heaterPower'; dataType: 'number' };
}

interface HeaterSensors extends Record<string, SensorConfig> {
  temperature: {
    name: 'temperature';
    dataType: 'number';
    dataProductionMode: 'periodic';
  };
  humidity: {
    name: 'humidity';
    dataType: 'number';
    dataProductionMode: 'periodic';
  };
}

export class Heater extends AbstractDevice<HeaterActuators, HeaterSensors> {
  constructor(
    config: DeviceConfig<HeaterSensors, HeaterActuators>,
    messageBus: IMessageBus,
  ) {
    super(config, messageBus);
    // @ts-ignore - type is protected in base class but we need to set it for simulation
    this.type = DeviceType.PHYSICAL;
  }

  async configure(
    config: DeviceConfig<HeaterSensors, HeaterActuators>,
  ): Promise<void> {
    console.log(`Configuring heater ${this.guid}`);
  }

  async reboot(): Promise<void> {
    console.log(`Rebooting heater ${this.guid}`);
  }

  getStatus(): DeviceStatus {
    return DeviceStatus.ONLINE;
  }
}

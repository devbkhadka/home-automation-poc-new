import { IotSystem, IMessageBus } from '@home-automation/core';
import {
  SimulatedHeater,
  HeaterPowerState,
} from '@home-automation/simulations';

export interface HeaterSystemStates {
  heater1_target: number;
  heater2_target: number;
  heater1_power: { power: HeaterPowerState };
  heater2_power: { power: HeaterPowerState };
  too_hot: boolean;
  averageTemperature: number;
  tick: number;
}

export type HeaterSystemDevices = {
  heater1: SimulatedHeater;
  heater2: SimulatedHeater;
};

const createMemoryBus = (): IMessageBus => {
  const subscribers = new Map<string, ((msg: string) => void)[]>();
  return {
    publish: async (topic, message) => {
      const callbackList = subscribers.get(topic);
      if (callbackList) {
        callbackList.forEach((cb) => cb(message));
      }
    },
    subscribe: async (topic, callback) => {
      if (!subscribers.has(topic)) {
        subscribers.set(topic, []);
      }
      subscribers.get(topic)!.push(callback);
    },
  };
};

const dummyMessageBus = createMemoryBus();

const createHeaterConfig = (name: string, guid: string) => ({
  guid,
  name,
  namespace: 'system',
  model: 'SimHeater',
  version: '1.0',
  manufacturer: 'SimCorp',
  sensors: {
    temperature: {
      name: 'temperature',
      dataType: 'number' as const,
      dataProductionMode: 'periodic' as const,
    },
  },
  actuators: {
    power: {
      name: 'power',
      dataType: 'string' as const,
    },
  },
});

export class HeaterSystem extends IotSystem<HeaterSystemDevices, HeaterSystemStates> {
  private tickCount = 0;
  private intervalId: NodeJS.Timeout;

  constructor(messageBus: IMessageBus = dummyMessageBus) {
    super();

    // Instantiate and add devices using the provided message bus
    const heater1 = new SimulatedHeater(
      createHeaterConfig('Living Room Heater', 'heater1') as any,
      messageBus,
    );
    const heater2 = new SimulatedHeater(
      createHeaterConfig('Bedroom Heater', 'heater2') as any,
      messageBus,
    );

    this.addDevice('heater1', heater1);
    this.addDevice('heater2', heater2);

    heater1.start();
    heater2.start();

    // Define States
    this.defineState('heater1_target', {
      type: 'modifiable',
      initialValue: 25,
    });

    this.defineState('heater2_target', {
      type: 'modifiable',
      initialValue: 30,
    });

    this.defineState('too_hot', {
      type: 'modifiable',
      initialValue: false,
      persistent: true,
    });

    this.defineState('tick', {
      type: 'modifiable',
      initialValue: 0,
    });

    // Device Power States (Computed & Linked to Devices)
    this.defineState('heater1_power', {
      type: 'computed',
      dependencies: ['tick', 'heater1_target'],
      deviceDependencies: ['heater1'],
      deviceKey: 'heater1',
      compute: ({ devices, states }) => {
        const heater = devices.heater1;
        const target = states.heater1_target;
        const current = heater.temperature || 20;

        let desiredPower: HeaterPowerState = 'off';
        if (current < target - 1) {
          desiredPower = 'high';
        } else if (current < target) {
          desiredPower = 'low';
        }

        return { power: desiredPower };
      },
    });

    this.defineState('heater2_power', {
      type: 'computed',
      dependencies: ['tick', 'heater2_target'],
      deviceDependencies: ['heater2'],
      deviceKey: 'heater2',
      compute: ({ devices, states }) => {
        const heater = devices.heater2;
        const target = states.heater2_target;
        const current = heater.temperature || 20;

        let desiredPower: HeaterPowerState = 'off';
        if (current < target - 1) {
          desiredPower = 'high';
        } else if (current < target) {
          desiredPower = 'low';
        }

        return { power: desiredPower };
      },
    });

    this.defineState('averageTemperature', {
      type: 'computed',
      dependencies: ['tick'],
      deviceDependencies: ['heater1', 'heater2'],
      compute: ({ devices }) => {
        const t1 = devices.heater1.temperature;
        const t2 = devices.heater2.temperature;
        return (t1 + t2) / 2;
      },
    });

    this.registerEffect({
      name: 'logAverageTemp',
      dependencies: ['tick', 'averageTemperature'],
      action: ({ states }) => {
        console.log(
          `[HeaterSystem] Tick ${states.tick}: Average Temperature: ${states.averageTemperature.toFixed(2)}°C`,
        );

        this.updateState('too_hot', states.averageTemperature > 27);
      },
    });

    this.registerEffect({
      name: 'logTooHot',
      dependencies: ['too_hot', 'averageTemperature'],
      action: ({ states }) => {
        if (!states.too_hot) return;
        console.log(
          `[HeaterSystem] ######### Too hot: ${states.too_hot} with avg temp ${states.averageTemperature.toFixed(2)}°C ##########`,
        );
      },
    });

    // Periodically update tick to drive the system
    this.intervalId = setInterval(() => {
      this.tickCount++;
      this.updateState('tick', this.tickCount);
    }, 5000);
  }

  public stop() {
    clearInterval(this.intervalId);
    this.devices.heater1.stop();
    this.devices.heater2.stop();
  }
}

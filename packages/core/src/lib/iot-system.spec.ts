import { expect, test, describe, vi, beforeEach } from 'vitest';
import { IotSystem } from './iot-system';
import { IDevice } from './interfaces';
import { MQTTService } from './mqtt-service';
import { IMessageBus } from './interfaces';

// Mock Device
class MockDevice {
  guid = 'dev-1';
  namespace = 'ns';
  messageBus?: IMessageBus;

  constructor(messageBus: IMessageBus) {
    this.messageBus = messageBus;
  }

  getMessageBus(): IMessageBus {
    return this.messageBus ?? {} as IMessageBus;
  }
}

interface MyDevices {
  heater: IDevice<any, any>;
  [key: string]: IDevice<any, any>;
}

interface MyStates {
  temp: number;
  alert: boolean;
  heaterPower: { power: boolean };
}

class TestSystem extends IotSystem<MyDevices, MyStates> {
  constructor() {
    super();
  }

  public init() {
    this.initialize();
  }

  // Expose internal state for testing
  public getSystemStates() {
    return this.processor.getStates();
  }
}

describe('IotSystem', () => {
  let mqtt: any;
  let system: TestSystem;

  beforeEach(() => {
    mqtt = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };
    system = new TestSystem();
  });

  test('should add devices', () => {
    const dev = new MockDevice(mqtt) as any;
    system.addDevice('heater', dev);
    expect((system as any).devices.heater).toBe(dev);
  });

  test('should define states and recompute', () => {
    system.defineState('temp', {
      type: 'modifiable',
      initialValue: 20,
    });

    system.defineState('alert', {
      type: 'computed',
      dependencies: ['temp'] as const,
      compute: ({ states }) => states.temp > 30,
    });

    system.init();

    expect(system.getSystemStates().alert).toBe(false);

    system.updateState('temp', 35);
    expect(system.getSystemStates().alert).toBe(true);
  });

  test('should publish desired state when linked system state changes', async () => {
    const dev = new MockDevice(mqtt);
    system.addDevice('heater', dev);

    system.defineState('heaterPower', {
      type: 'modifiable',
      initialValue: { power: false },
      deviceKey: 'heater',
    });

    system.init();

    system.updateState('heaterPower', { power: true });

    expect(mqtt.publish).toHaveBeenCalledWith(
      'ns/dev-1/desired',
      JSON.stringify({ power: true }),
    );
  });

  test('should trigger effects', async () => {
    const action = vi.fn();

    system.defineState('temp', {
      type: 'modifiable',
      initialValue: 20,
    });

    system.registerEffect({
      name: 'temp-alert',
      dependencies: ['temp'] as const,
      action: action,
    });

    system.init();

    system.updateState('temp', 25);

    // Effects are async
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(action).toHaveBeenCalled();
  });

  test('should detect circular dependencies', () => {
    system.defineState('temp' as any, {
      type: 'computed',
      dependencies: ['alert' as any],
      compute: () => 20,
    });

    system.defineState('alert' as any, {
      type: 'computed',
      dependencies: ['temp' as any],
      compute: () => true,
    });

    expect(() => system.init()).toThrow(/Circular dependency/);
  });

  test('should restrict compute function context to declared dependencies', () => {
    system.defineState('temp', {
      type: 'modifiable',
      initialValue: 20,
    });

    system.defineState('alert', {
      type: 'modifiable',
      initialValue: false,
    });

    system.defineState('restrictedComputed' as any, {
      type: 'computed',
      dependencies: ['temp'] as const,
      compute: (ctx: any) => {
        // 'alert' should NOT be in states since it's not in dependencies
        expect(ctx.states.temp).toBe(20);
        expect(ctx.states.alert).toBeUndefined();
        return ctx.states.temp > 15;
      },
    });

    system.init();
  });

  test('should restrict effect context to declared dependencies', async () => {
    let lastCtx: any = null;
    const action = vi.fn((ctx) => {
      lastCtx = ctx;
    });

    system.defineState('temp', {
      type: 'modifiable',
      initialValue: 20,
    });

    system.defineState('alert', {
      type: 'modifiable',
      initialValue: false,
    });

    system.registerEffect({
      name: 'restricted-effect',
      dependencies: ['temp'] as const,
      action: action,
    });

    system.init();
    system.updateState('temp', 25);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(action).toHaveBeenCalled();
    expect(lastCtx.states.temp).toBe(25);
    expect(lastCtx.states.alert).toBeUndefined();
  });
});

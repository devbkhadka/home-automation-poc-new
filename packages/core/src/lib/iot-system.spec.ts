import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IotSystem } from './iot-system';
import { IMessageBus, IDevice, DeviceType, DeviceStatus } from './interfaces';

describe('IotSystem', () => {
  interface MockStates {
    targetTemp: number;
    heaterPower: { power: string };
  }

  interface MockDevices {
    heater1: IDevice<any, any>;
    heater2: IDevice<any, any>;
  }

  class TestSystem extends IotSystem<MockDevices, MockStates> {
    constructor() {
      super();
    }
  }

  let system: TestSystem;
  let mockMessageBus: IMessageBus;
  let mockDevice: any;

  beforeEach(() => {
    mockMessageBus = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
    };

    mockDevice = {
      guid: 'heater-1',
      namespace: 'home',
      type: DeviceType.PROXY,
      messageBus: mockMessageBus,
      sensorConfigs: {
        temperature: { name: 'temperature', dataType: 'number' },
        humidity: { name: 'humidity', dataType: 'number' },
      },
    };

    system = new TestSystem();
  });

  describe('Device Management', () => {
    it('should update state when device telemetry is received', () => {
      system.addDevice('heater1', mockDevice);

      const subscribeCall = vi
        .mocked(mockMessageBus.subscribe)
        .mock.calls.find(
          (call) => call[0] === 'home/heater-1/telemetry/temperature',
        );
      expect(subscribeCall).toBeDefined();
      const callback = subscribeCall![1];

      callback(JSON.stringify({ data: 22, timestamp: Date.now() }));

      const states = system.getStates() as any;
      expect(states['device:heater1.temperature']).toBe(22);
      expect(states['device:heater1'].temperature).toBe(22);
    });

    it('should preserve other sensor data when one sensor updates', () => {
      system.addDevice('heater1', mockDevice);

      const tempCallback = vi.mocked(mockMessageBus.subscribe).mock.calls.find(
        (call) => call[0] === 'home/heater-1/telemetry/temperature',
      )![1];
      const humidityCallback = vi.mocked(mockMessageBus.subscribe).mock.calls.find(
        (call) => call[0] === 'home/heater-1/telemetry/humidity',
      )![1];

      tempCallback(JSON.stringify({ data: 22, timestamp: Date.now() }));
      humidityCallback(JSON.stringify({ data: 45, timestamp: Date.now() }));

      const states = system.getStates() as any;
      expect(states['device:heater1'].temperature).toBe(22);
      expect(states['device:heater1'].humidity).toBe(45);
    });
  });

  describe('State Management (Computed)', () => {
    it('should compute states based on device dependencies', () => {
      system.addDevice('heater1', mockDevice);

      system.defineState('heaterPower', {
        type: 'computed',
        dependencies: [],
        deviceDependencies: ['heater1.temperature' as any],
        compute: ({ devices }) => {
          return { power: devices.heater1.temperature > 20 ? 'off' : 'on' };
        },
      });

      system.initialize();

      const callback = vi.mocked(mockMessageBus.subscribe).mock.calls[0][1];
      callback(JSON.stringify({ data: 18, timestamp: Date.now() }));

      expect(system.getStates().heaterPower).toEqual({ power: 'on' });

      callback(JSON.stringify({ data: 25, timestamp: Date.now() }));
      expect(system.getStates().heaterPower).toEqual({ power: 'off' });
    });

    it('should handle device-level dependencies (no field specified)', () => {
      system.addDevice('heater1', mockDevice);

      system.defineState('heaterPower', {
        type: 'computed',
        dependencies: [],
        deviceDependencies: ['heater1'],
        compute: ({ devices }) => ({
          power: devices.heater1.temperature > 20 ? 'off' : 'on',
        }),
      });

      system.initialize();

      const callback = vi.mocked(mockMessageBus.subscribe).mock.calls.find(
        (call) => call[0] === 'home/heater-1/telemetry/temperature',
      )![1];

      callback(JSON.stringify({ data: 18, timestamp: Date.now() }));
      expect(system.getStates().heaterPower).toEqual({ power: 'on' });
    });

    it('should recompute all states on initialize()', () => {
      const computeSpy = vi.fn().mockReturnValue({ power: 'unknown' });
      system.defineState('heaterPower', {
        type: 'computed',
        dependencies: [],
        compute: computeSpy,
      });

      system.initialize();
      expect(computeSpy).toHaveBeenCalled();
    });

    it('should handle dependencies on non-existent devices', () => {
      system.defineState('heaterPower', {
        type: 'computed',
        dependencies: [],
        deviceDependencies: ['nonExistent' as any],
        compute: ({ devices }) => ({
          exists: !!devices.nonExistent,
        }),
      });

      system.initialize();
      expect(system.getStates().heaterPower).toEqual({ exists: true }); // Proxy creates empty object
    });

    it('should trigger computation multiple times when depending on device object even if other states depend on specific fields', () => {
      system.addDevice('heater1', mockDevice);

      const computeSpy = vi.fn().mockImplementation(({ devices }) => {
        return { power: devices.heater1.temperature > 20 ? 'off' : 'on' };
      });

      system.defineState('heaterPower', {
        type: 'computed',
        dependencies: [],
        deviceDependencies: ['heater1'],
        compute: computeSpy,
      });

      // Another state that depends on the specific field - this was causing the mutation bug
      system.defineState('targetTemp', {
        type: 'computed',
        dependencies: [],
        deviceDependencies: ['heater1.temperature' as any],
        compute: ({ devices }) => devices.heater1.temperature,
      });

      system.initialize();
      computeSpy.mockClear();

      const callback = vi.mocked(mockMessageBus.subscribe).mock.calls.find(
        (call) => call[0] === 'home/heater-1/telemetry/temperature',
      )![1];

      // First update
      callback(JSON.stringify({ data: 21, timestamp: Date.now() }));
      expect(computeSpy).toHaveBeenCalledTimes(1);
      computeSpy.mockClear();

      // Second update
      callback(JSON.stringify({ data: 22, timestamp: Date.now() }));
      expect(computeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reactive Effects', () => {
    it('should publish desired state when deviceKey is defined', async () => {
      system.addDevice('heater1', mockDevice);

      system.defineState('heaterPower', {
        type: 'computed',
        dependencies: [],
        deviceDependencies: ['heater1.temperature' as any],
        deviceKey: 'heater1',
        compute: ({ devices }) => ({
          power: devices.heater1.temperature > 20 ? 'off' : 'on',
        }),
      });

      system.initialize();

      const callback = vi.mocked(mockMessageBus.subscribe).mock.calls[0][1];
      callback(JSON.stringify({ data: 18, timestamp: Date.now() }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockMessageBus.publish).toHaveBeenCalledWith(
        'home/heater-1/desired',
        JSON.stringify({ power: 'on' }),
      );
    });

    it('should trigger manual effects when device telemetry is received', async () => {
      system.addDevice('heater1', mockDevice);

      const effectAction = vi.fn();
      system.registerEffect({
        name: 'testEffect',
        dependencies: [],
        deviceDependencies: ['heater1.temperature' as any],
        action: effectAction,
      });

      system.initialize();

      const callback = vi.mocked(mockMessageBus.subscribe).mock.calls[0][1];
      callback(JSON.stringify({ data: 25, timestamp: Date.now() }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(effectAction).toHaveBeenCalled();
      const context = effectAction.mock.calls[0][0];
      expect(context.devices.heater1.temperature).toBe(25);
    });

    it('should handle effects with multiple device dependencies', async () => {
      const mockDevice2 = { ...mockDevice, guid: 'heater-2' };
      system.addDevice('heater1', mockDevice);
      system.addDevice('heater2', mockDevice2);

      const effectAction = vi.fn();
      system.registerEffect({
        name: 'multiDeviceEffect',
        dependencies: [],
        deviceDependencies: ['heater1.temperature' as any, 'heater2.temperature' as any],
        action: effectAction,
      });

      system.initialize();

      const callback1 = vi.mocked(mockMessageBus.subscribe).mock.calls.find(
        (c) => c[0] === 'home/heater-1/telemetry/temperature',
      )![1];
      const callback2 = vi.mocked(mockMessageBus.subscribe).mock.calls.find(
        (c) => c[0] === 'home/heater-2/telemetry/temperature',
      )![1];

      callback1(JSON.stringify({ data: 20, timestamp: Date.now() }));
      callback2(JSON.stringify({ data: 30, timestamp: Date.now() }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(effectAction).toHaveBeenCalled();
      const context = effectAction.mock.calls.find(c => 
        c[0].devices.heater1?.temperature === 20 && 
        c[0].devices.heater2?.temperature === 30
      )?.[0];
      
      expect(context).toBeDefined();
      expect(context.devices.heater1.temperature).toBe(20);
      expect(context.devices.heater2.temperature).toBe(30);
    });

    it('should trigger effect multiple times when depending on device object even if other states depend on specific fields', async () => {
      system.addDevice('heater1', mockDevice);

      const effectAction = vi.fn();
      system.registerEffect({
        name: 'testEffect',
        dependencies: [],
        deviceDependencies: ['heater1'],
        action: effectAction,
      });

      // Another state that depends on the specific field to trigger the mutation bug
      system.defineState('targetTemp', {
        type: 'computed',
        dependencies: [],
        deviceDependencies: ['heater1.temperature' as any],
        compute: ({ devices }) => devices.heater1.temperature,
      });

      system.initialize();
      effectAction.mockClear();

      const callback = vi.mocked(mockMessageBus.subscribe).mock.calls.find(
        (call) => call[0] === 'home/heater-1/telemetry/temperature',
      )![1];

      // First update
      callback(JSON.stringify({ data: 21, timestamp: Date.now() }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(effectAction).toHaveBeenCalledTimes(1);
      effectAction.mockClear();

      // Second update
      callback(JSON.stringify({ data: 22, timestamp: Date.now() }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(effectAction).toHaveBeenCalledTimes(1);
    });

  });
});



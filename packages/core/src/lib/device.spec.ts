import { expect, test, describe, vi, beforeEach } from 'vitest';
import { AbstractDevice } from './device';
import { DeviceConfig, DeviceStatus, DeviceType } from './interfaces';
import { MQTTService } from './mqtt-service';
import { ActuatorConfig, SensorConfig } from './interfaces';

class MockDevice extends AbstractDevice<{
  power: ActuatorConfig;
}, {
  temperature: SensorConfig;
}> {
  constructor(config: DeviceConfig) {
    super(config);
  }

  public setMqttClient(client: MQTTService) {
    this.messageBus = client;
  }

  async configure(config: DeviceConfig): Promise<void> {}
  async reboot(): Promise<void> {}
  getStatus(): DeviceStatus {
    return DeviceStatus.ONLINE;
  }
}

describe('AbstractDevice', () => {
  const config: DeviceConfig = {
    guid: 'test-guid',
    namespace: 'test-namespace',
    name: 'Test Device',
    model: 'M1',
    version: '1.0.0',
    manufacturer: 'Test Corp',
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
        dataType: 'boolean',
      },
    },
  };

  let mockMqttClient: any;

  beforeEach(() => {
    mockMqttClient = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };
  });

  test('should initialize with correct properties', () => {
    const device = new MockDevice(config);
    expect(device.guid).toBe('test-guid');
    expect(device.namespace).toBe('test-namespace');
    expect(device.type).toBe(DeviceType.PHYSICAL);
  });

  test('should send telemetry as JSON string', async () => {
    const device = new MockDevice(config);
    device.setMqttClient(mockMqttClient);

    const telemetryData = {
      data: 25.5,
      dataType: 'number' as const,
      timestamp: Date.now(),
      sequenceId: 'seq-1',
    };

    await device.sendTelemetry('temperature', telemetryData);

    expect(mockMqttClient.publish).toHaveBeenCalledWith(
      'test-namespace/test-guid/telemetry/temperature',
      JSON.stringify(telemetryData)
    );
  });

  test('should parse desired state change from JSON', () => {
    const device = new MockDevice(config);
    device.setMqttClient(mockMqttClient);

    const handler = vi.fn();
    device.onDesiredStateChange(handler);

    expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
      'test-namespace/test-guid/desired',
      expect.any(Function)
    );

    const subscribeCallback = mockMqttClient.subscribe.mock.calls[0][1];
    const desiredState = { power: true };
    subscribeCallback(JSON.stringify(desiredState));

    expect(handler).toHaveBeenCalledWith(desiredState);
  });

  test('should handle parsing error in onDesiredStateChange', () => {
    const device = new MockDevice(config);
    device.setMqttClient(mockMqttClient);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = vi.fn();
    device.onDesiredStateChange(handler);

    const subscribeCallback = mockMqttClient.subscribe.mock.calls[0][1];
    subscribeCallback('invalid-json');

    expect(handler).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse desired state'),
      expect.any(Error)
    );
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceRegistry } from './registry.js';
import { Device } from './interfaces.js';

describe('DeviceRegistry', () => {
  let registry: DeviceRegistry;
  const mockDevice: Device = {
    id: 'dev-123',
    name: 'Test Device',
    model: 'M1',
    manufacturer: 'Test Inc',
    sensors: [],
    actuators: [],
  };

  beforeEach(() => {
    registry = new DeviceRegistry();
  });

  it('should register a device', () => {
    registry.register(mockDevice);
    expect(registry.getDevice('dev-123')).toEqual(mockDevice);
  });

  it('should throw error when registering a device with duplicate ID', () => {
    registry.register(mockDevice);
    expect(() => registry.register(mockDevice)).toThrow('Device with ID dev-123 is already registered.');
  });

  it('should list all registered devices', () => {
    registry.register(mockDevice);
    expect(registry.listDevices()).toHaveLength(1);
    expect(registry.listDevices()[0]).toEqual(mockDevice);
  });

  it('should unregister a device', () => {
    registry.register(mockDevice);
    registry.unregister('dev-123');
    expect(registry.getDevice('dev-123')).toBeUndefined();
  });
});

import { Device } from './interfaces.js';

export class DeviceRegistry {
  private devices: Map<string, Device> = new Map();

  register(device: Device): void {
    if (this.devices.has(device.id)) {
      throw new Error(`Device with ID ${device.id} is already registered.`);
    }
    this.devices.set(device.id, device);
  }

  unregister(deviceId: string): void {
    this.devices.delete(deviceId);
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  listDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  updateDevice(device: Device): void {
    if (!this.devices.has(device.id)) {
      throw new Error(`Device with ID ${device.id} is not registered.`);
    }
    this.devices.set(device.id, device);
  }
}

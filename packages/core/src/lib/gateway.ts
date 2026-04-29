import { ActuatorConfig, DataTypeFor, IDevice, SensorConfig, TelemetryPayload } from './interfaces';


export interface DiscoveredDevice {
  /**
   * Stable, transport-independent device fingerprint.
   * See ADR-012.
   */
  fingerprint: string;

  /**
   * Transport used for discovery (e.g., 'ble', 'wifi').
   */
  transport: string;

  /**
   * Signal strength if applicable.
   */
  rssi?: number;

  /**
   * Additional metadata provided during discovery (e.g., model, manufacturer).
   */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for the Gateway / Edge Node.
 * A Gateway reacts to device-initiated advertisements, manages local devices,
 * and hosts Virtual Devices for safety coordination.
 */
export interface IGateway {
  readonly guid: string;

  onNewDeviceAdvertised(handler: (device: DiscoveredDevice) => void): void;

  /**
   * Registers a handler for discovery events.
   * Discovery is initiated by devices via advertisement; the gateway
   * detects these and emits events.
   */
  onNewDeviceDiscovered(handler: (device: DiscoveredDevice) => void): void;

  onReceivedDeviceTelemetry<
    TActuators extends Record<string, ActuatorConfig>,
    TSensors extends Record<string, SensorConfig>,
    K extends keyof TSensors,
  >(device: IDevice<TActuators, TSensors>, sensorName: K, telemetryData: TelemetryPayload<DataTypeFor<TSensors[K]>>,): void;

  onReceivedDeviceStateChange<
    TActuators extends Record<string, ActuatorConfig>,
    TSensors extends Record<string, SensorConfig>,
    K extends keyof TActuators,
  >(device: IDevice<TActuators, TSensors>, actuatorName: K, commandData: TelemetryPayload<DataTypeFor<TActuators[K]>>,): void;

  onDeviceStateChangeAcknowledged<
    TActuators extends Record<string, ActuatorConfig>,
    TSensors extends Record<string, SensorConfig>,
    K extends keyof TActuators,
  >(device: IDevice<TActuators, TSensors>, actuatorName: K, commandData: TelemetryPayload<DataTypeFor<TActuators[K]>>,): void;
  /**
   * Triggers a hardware or software reboot of the gateway.
   */
  reboot(): Promise<void>;
}

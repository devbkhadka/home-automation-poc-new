export enum DeviceType {
  PHYSICAL = 'PHYSICAL',
  SIMULATED = 'SIMULATED',
  VIRTUAL = 'VIRTUAL',
  PROXY = 'PROXY',
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  REBOOTING = 'REBOOTING',
  ERROR = 'ERROR',
}

const DataTypes = ['number', 'string', 'boolean', 'binary', 'json'] as const;

export type DataTypeMap = {
  number: number;
  string: string;
  boolean: boolean;
  binary: Uint8Array;
  json: any;
};

export type DataType = (typeof DataTypes)[number];
export type DataProductionMode = 'event-driven' | 'on-demand' | 'periodic';
export type DeliveryMode = 'atLeastOnce' | 'atMostOnce' | 'exactlyOnce';
export type LoggingMode =
  | 'logAll'
  | 'low-frequency'
  | 'medium-frequency'
  | 'sample'
  | 'auto';

export interface Acknowledgement {
  status: 'success' | 'failure' | 'warning';
  code?: number;
}

export interface TelemetryPayload<T = any> {
  data: T;
  dataType: DataType;
  timestamp: number;
  sequenceId: string;
}

export type ActuatorState<TActuators extends Record<string, ActuatorConfig>> =
  Partial<{
    [K in keyof TActuators]: DataTypeMap[TActuators[K]['dataType']];
  }>;

export type SensorData<TSensors extends Record<string, SensorConfig>> =
  Partial<{
    [K in keyof TSensors]: DataTypeMap[TSensors[K]['dataType']];
  }>;

export interface CommandArg {
  name: string;
  type: 'number' | 'string' | 'boolean';
}

export interface Command {
  name: string;
  args: Record<string, CommandArg>;
  deliveryMode: DeliveryMode;
}

export interface SensorConfig {
  name: string;
  dataType: DataType;
  dataProductionMode: DataProductionMode;
  loggingMode?: LoggingMode;
}

export interface ActuatorConfig {
  name: string;
  dataType: DataType;
}

export interface DeviceConfig<
  TSensors extends Record<string, SensorConfig> = Record<string, SensorConfig>,
  TActuators extends Record<string, ActuatorConfig> = Record<
    string,
    ActuatorConfig
  >,
> {
  guid: string;
  namespace: string;
  name: string;
  model: string;
  version: string;
  manufacturer: string;
  sensors: TSensors;
  actuators: TActuators;
  metadata?: Record<string, unknown>;
}

export interface IDevice<
  TActuators extends Record<string, ActuatorConfig>,
  TSensors extends Record<string, SensorConfig>,
> {
  readonly guid: string;
  readonly type: DeviceType;
  readonly namespace: string;

  // Configuration
  configure(config: DeviceConfig): Promise<void>;

  // Communication
  sendTelemetry<K extends keyof TSensors>(
    sensorName: K,
    data: TelemetryPayload<TSensors[K]>,
  ): Promise<void>;
  onDesiredStateChange(
    handler: (state: ActuatorState<TActuators>) => void,
  ): void;

  // Lifecycle
  reboot(): Promise<void>;
  getStatus(): DeviceStatus;
}

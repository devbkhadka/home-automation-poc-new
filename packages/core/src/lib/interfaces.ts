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
  // we can get inspiration from HTTP status codes. We should be able to handle rejection by device in critical or invalid condition
  code?: number;
}

export interface TelemetryPayload<T = any> {
  data: T;
  dataType: DataType;
  timestamp: number;
  sequenceId: string;
}

export type DataTypeFor<TSensor extends SensorConfig | ActuatorConfig> =
  DataTypeMap[TSensor['dataType']];

export type ActuatorState<TActuators extends Record<string, ActuatorConfig>> =
  Partial<{
    [K in keyof TActuators]: DataTypeFor<TActuators[K]>;
  }>;

export type SensorData<TSensors extends Record<string, SensorConfig>> =
  Partial<{
    [K in keyof TSensors]: DataTypeFor<TSensors[K]>;
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
  TSensors extends Record<string, SensorConfig>,
  TActuators extends Record<string, ActuatorConfig>,
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
  configure(config: DeviceConfig<TSensors, TActuators>): Promise<void>;

  // Communication
  sendTelemetry<K extends keyof TSensors>(
    sensorName: K,
    data: TelemetryPayload<DataTypeFor<TSensors[K]>>,
  ): Promise<void>;
  onDesiredStateChange(
    handler: (state: ActuatorState<TActuators>) => void,
  ): void;

  // Lifecycle
  reboot(): Promise<void>;
  getStatus(): DeviceStatus;
}

export interface IMessageBus {
  publish(topic: string, message: string): Promise<void> | void;
  subscribe(
    topic: string,
    callback: (message: string) => void,
  ): Promise<void> | void;
}

export type StateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, any>
  | any[];

export type ProcessorComputedStateDefinition<
  TStates,
  TValue,
  TDeps extends readonly (keyof TStates)[],
> = {
  type: 'computed';
  dependencies: TDeps;
  compute: (context: {
    states: Pick<TStates, TDeps[number]>;
  }) => TValue;
};

export type ProcessorModifiableStateDefinition<TStates, TValue> = {
  type: 'modifiable';
  initialValue: TValue;
  persistent?: boolean;
};

export type ProcessorStateDefinition<
  TStates,
  TValue,
  TDeps extends readonly (keyof TStates)[] = any,
> =
  | ProcessorComputedStateDefinition<TStates, TValue, TDeps>
  | ProcessorModifiableStateDefinition<TStates, TValue>;

export type DeviceDependency<TDevices> =
  | keyof TDevices
  | { [K in keyof TDevices]: `${Extract<K, string>}.${string}` }[keyof TDevices];

export type ComputedStateDefinition<
  TDevices,
  TStates,
  TValue,
  TDeps extends readonly (keyof TStates)[],
  TDevDeps extends readonly DeviceDependency<TDevices>[],
> = {
  type: 'computed';
  dependencies: TDeps;
  deviceDependencies?: TDevDeps;
  compute: (context: {
    devices: any; // Will be a proxy or specific Pick based on TDevDeps
    states: Pick<TStates, TDeps[number]>;
  }) => TValue;
  deviceKey?: keyof TDevices;
};

export type ModifiableStateDefinition<TDevices, TStates, TValue> = {
  type: 'modifiable';
  initialValue: TValue;
  persistent?: boolean;
  deviceKey?: keyof TDevices;
};

export type StateDefinition<
  TDevices,
  TStates,
  TValue,
  TDeps extends readonly (keyof TStates)[] = any,
  TDevDeps extends readonly DeviceDependency<TDevices>[] = any,
> =
  | ComputedStateDefinition<TDevices, TStates, TValue, TDeps, TDevDeps>
  | ModifiableStateDefinition<TDevices, TStates, TValue>;

export type ActuatorStateForDevice<T> =
  T extends IDevice<infer TActuators, any> ? ActuatorState<TActuators> : never;

export type SensorDataForDevice<T> =
  T extends IDevice<any, infer TSensors> ? SensorData<TSensors> : never;

export type IProxyDevice<TConfig extends DeviceConfig<any, any>> =
  TConfig extends DeviceConfig<infer TSensors, infer TActuators>
    ? IDevice<TActuators, TSensors> & SensorData<TSensors>
    : never;

export interface ProcessorEffectContext<
  TStates,
  TDeps extends readonly (keyof TStates)[],
> {
  states: Pick<TStates, TDeps[number]>;
  updateState<K extends keyof TStates>(stateKey: K, value: TStates[K]): void;
}

export type ProcessorEffectDefinition<
  TStates,
  TDeps extends readonly (keyof TStates)[],
> = {
  name: string;
  dependencies: TDeps;
  action: (
    context: ProcessorEffectContext<TStates, TDeps>,
  ) => void | Promise<void>;
};

export interface EffectContext<
  TDevices,
  TStates,
  TDeps extends readonly (keyof TStates)[],
  TDevDeps extends readonly DeviceDependency<TDevices>[],
> {
  devices: any;
  states: Pick<TStates, TDeps[number]>;
  updateState<K extends keyof TStates>(stateKey: K, value: TStates[K]): void;
}

export type EffectDefinition<
  TDevices,
  TStates,
  TDeps extends readonly (keyof TStates)[],
  TDevDeps extends readonly DeviceDependency<TDevices>[],
> = {
  name: string;
  dependencies: TDeps;
  deviceDependencies?: TDevDeps;
  action: (
    context: EffectContext<TDevices, TStates, TDeps, TDevDeps>,
  ) => void | Promise<void>;
};

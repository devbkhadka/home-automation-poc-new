export type DataType =
  | number
  | string
  | boolean
  | Uint8Array
  | Record<string, unknown>;

export interface Sensor {
  id: string;
  name: string;
  type: string;
  unit?: string;
  lastValue?: DataType;
  lastUpdated?: Date;
}

export interface Actuator {
  id: string;
  name: string;
  type: string;
  state: DataType;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  sensors: Sensor[];
  actuators: Actuator[];
  metadata?: Record<string, unknown>;
}

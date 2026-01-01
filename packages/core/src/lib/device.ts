import {
  DeviceConfig,
  DeviceStatus,
  DeviceType,
  IDevice,
  TelemetryPayload,
  ActuatorState,
  SensorConfig,
  ActuatorConfig,
} from './interfaces.js';
import { MQTTService } from './mqtt-service.js';

export abstract class AbstractDevice<
    TActuators extends Record<string, any> = Record<string, any>,
    TSensors extends Record<string, any> = Record<string, any>,
  >
  implements IDevice<TActuators, TSensors>
{
  public readonly guid: string;
  public readonly type: DeviceType;
  public readonly namespace: string;
  protected sensorConfigs: Record<string, SensorConfig>;
  protected actuatorConfigs: Record<string, ActuatorConfig>;

  protected mqttClient?: MQTTService;

  protected constructor(config: DeviceConfig) {
    this.guid = config.guid;
    this.type = DeviceType.PHYSICAL; // Default, can be overridden by subclasses
    this.namespace = config.namespace;
    this.sensorConfigs = config.sensors;
    this.actuatorConfigs = config.actuators;
  }

  abstract configure(config: DeviceConfig): Promise<void>;
  abstract reboot(): Promise<void>;
  abstract getStatus(): DeviceStatus;

  async sendTelemetry<K extends keyof TSensors>(
    sensorName: K,
    data: TelemetryPayload<TSensors[K]>,
  ): Promise<void> {
    if (!this.mqttClient) {
      throw new Error(`MQTT client not initialized for device ${this.guid}`);
    }

    const topic = `${this.namespace}/${this.guid}/telemetry/${String(sensorName)}`;
    await this.mqttClient.publish(topic, JSON.stringify(data));
  }

  onDesiredStateChange(
    handler: (state: ActuatorState<TActuators>) => void,
  ): void {
    if (!this.mqttClient) {
      throw new Error(`MQTT client not initialized for device ${this.guid}`);
    }

    const topic = `${this.namespace}/${this.guid}/desired`;
    this.mqttClient.subscribe(topic, (payload: string) => {
      try {
        const parsedPayload = JSON.parse(payload);
        handler(parsedPayload as ActuatorState<TActuators>);
      } catch (error) {
        console.error(`Failed to parse desired state for device ${this.guid}:`, error);
      }
    });
  }
}



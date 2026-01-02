import {
  DeviceConfig,
  DeviceStatus,
  DeviceType,
  IDevice,
  TelemetryPayload,
  ActuatorState,
  SensorConfig,
  ActuatorConfig,
  IMessageBus,
  DataTypeFor,
} from './interfaces';

export abstract class AbstractDevice<
  TActuators extends Record<string, ActuatorConfig>,
  TSensors extends Record<string, SensorConfig>,
> implements IDevice<TActuators, TSensors>
{
  public readonly guid: string;
  public readonly type: DeviceType;
  public readonly namespace: string;
  protected sensorConfigs: TSensors;
  protected actuatorConfigs: TActuators;

  protected messageBus?: IMessageBus;

  protected constructor(
    config: DeviceConfig<TSensors, TActuators>,
    messageBus: IMessageBus,
  ) {
    this.guid = config.guid;
    this.type = DeviceType.PHYSICAL; // Default, can be overridden by subclasses
    this.namespace = config.namespace;
    this.sensorConfigs = config.sensors;
    this.actuatorConfigs = config.actuators;
    this.messageBus = messageBus;
  }

  abstract configure(config: DeviceConfig<TSensors, TActuators>): Promise<void>;
  abstract reboot(): Promise<void>;
  abstract getStatus(): DeviceStatus;

  async sendTelemetry<K extends keyof TSensors>(
    sensorName: K,
    data: TelemetryPayload<DataTypeFor<TSensors[K]>>,
  ): Promise<void> {
    if (!this.messageBus) {
      throw new Error(`Message bus not initialized for device ${this.guid}`);
    }

    const topic = `${this.namespace}/${this.guid}/telemetry/${String(sensorName)}`;
    await this.messageBus.publish(topic, JSON.stringify(data));
  }

  onDesiredStateChange(
    handler: (state: ActuatorState<TActuators>) => void,
  ): void {
    if (!this.messageBus) {
      throw new Error(`Message bus not initialized for device ${this.guid}`);
    }

    const topic = `${this.namespace}/${this.guid}/desired`;
    this.messageBus.subscribe(topic, (payload: string) => {
      try {
        const parsedPayload = JSON.parse(payload);
        handler(parsedPayload as ActuatorState<TActuators>);
      } catch (error) {
        console.error(
          `Failed to parse desired state for device ${this.guid}:`,
          error,
        );
      }
    });
  }

  public getMessageBus(): IMessageBus {
    return this.messageBus as IMessageBus;
  }
}



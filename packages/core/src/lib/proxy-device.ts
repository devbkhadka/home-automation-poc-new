import {
  DeviceConfig,
  DeviceStatus,
  DeviceType,
  TelemetryPayload,
  SensorConfig,
  ActuatorConfig,
  IMessageBus,
} from './interfaces';
import { AbstractDevice } from './device';

export class ProxyDevice<
  TActuators extends Record<string, ActuatorConfig>,
  TSensors extends Record<string, SensorConfig>,
> extends AbstractDevice<TActuators, TSensors> {
  private sensorData: Record<string, any> = {};
  private status: DeviceStatus = DeviceStatus.OFFLINE;

  constructor(
    config: DeviceConfig<TSensors, TActuators>,
    messageBus: IMessageBus,
  ) {
    super(config, messageBus);
    // @ts-ignore - setting protected property
    this.type = DeviceType.PROXY;
    this.setupSubscriptions();

    // Use a Proxy to allow direct property access for sensors (e.g. device.temperature)
    // while still keeping the class methods and properties.
    return new Proxy(this, {
      get(target, prop, receiver) {
        // If property exists on the class, return it
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        // If property matches a sensor name, return cached telemetry data
        if (typeof prop === 'string' && prop in target.sensorConfigs) {
          return target.sensorData[prop];
        }
        return undefined;
      },
    }) as any;
  }

  private setupSubscriptions() {
    if (!this.messageBus) return;

    // Automatically subscribe to all sensor telemetry
    for (const sensorKey of Object.keys(this.sensorConfigs)) {
      const topic = `${this.namespace}/${this.guid}/telemetry/${sensorKey}`;
      this.messageBus.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message) as TelemetryPayload;
          this.sensorData[sensorKey] = payload.data;
          this.status = DeviceStatus.ONLINE;
        } catch (e) {
          console.error(
            `[ProxyDevice ${this.guid}] Failed to parse telemetry for ${sensorKey}:`,
            e,
          );
        }
      });
    }

    // Subscribe to status updates if available
    const statusTopic = `${this.namespace}/${this.guid}/status`;
    this.messageBus.subscribe(statusTopic, (message) => {
      if (Object.values(DeviceStatus).includes(message as DeviceStatus)) {
        this.status = message as DeviceStatus;
      }
    });
  }

  async configure(config: DeviceConfig<TSensors, TActuators>): Promise<void> {
    const topic = `${this.namespace}/${this.guid}/config`;
    await this.messageBus?.publish(topic, JSON.stringify(config));
  }

  async reboot(): Promise<void> {
    const topic = `${this.namespace}/${this.guid}/command/reboot`;
    await this.messageBus?.publish(topic, JSON.stringify({ command: 'reboot' }));
  }

  getStatus(): DeviceStatus {
    return this.status;
  }
}

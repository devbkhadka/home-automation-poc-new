import {
  AbstractDevice,
  ActuatorConfig,
  DeviceConfig,
  DeviceStatus,
  DeviceType,
  IMessageBus,
  SensorConfig,
  TelemetryPayload,
} from '@home-automation/core';

export type HeaterPowerState = 'off' | 'low' | 'high';
interface HeaterActuators extends Record<string, ActuatorConfig> {
  power: { name: 'power'; dataType: 'string' };
}

interface HeaterSensors extends Record<string, SensorConfig> {
  temperature: {
    name: 'temperature';
    dataType: 'number';
    dataProductionMode: 'periodic';
  };
}
export class SimulatedHeater extends AbstractDevice<HeaterActuators, HeaterSensors> {
  public temperature = 20.0;
  public power: HeaterPowerState = 'off';
  private updateInterval?: NodeJS.Timeout;
  private readonly AMBIENT_TEMP = 20.0;
  private readonly MAX_TEMP_LOW = 40.0;
  private readonly MAX_TEMP_HIGH = 80.0;

  constructor(
    config: DeviceConfig<HeaterSensors, HeaterActuators>,
    telemetryMessageBus: IMessageBus,
  ) {
    super(config, telemetryMessageBus);
    // @ts-ignore - type is protected in base class but we need to set it for simulation
    this.type = DeviceType.SIMULATED;
    this.onDesiredStateChange((state) => {
      console.log(
        `[Heater ${this.guid}] Received desired state change:`,
        state,
      );
      if (state.power !== undefined) {
        this.power = state.power as HeaterPowerState;
        console.log(`[Heater ${this.guid}] Power set to: ${this.power}`);
      }
    });
  }

  async configure(
    config: DeviceConfig<HeaterSensors, HeaterActuators>,
  ): Promise<void> {
    console.log(`[Heater ${this.guid}] Configuring with:`, config);
  }

  async reboot(): Promise<void> {
    console.log(`[Heater ${this.guid}] Rebooting...`);
    this.temperature = this.AMBIENT_TEMP;
    this.power = 'off';
  }

  getStatus(): DeviceStatus {
    return DeviceStatus.ONLINE;
  }

  public start() {
    console.log(`[Heater ${this.guid}] Starting simulation...`);
    this.updateInterval = setInterval(() => {
      this.updateSimulation();
      this.publishTelemetry();
    }, 5000); // Update every 5 seconds
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    console.log(`[Heater ${this.guid}] Stopping simulation.`);
  }

  private updateSimulation() {
    const step = 0.5;
    if (this.power === 'off') {
      if (this.temperature > this.AMBIENT_TEMP) {
        this.temperature = Math.max(this.AMBIENT_TEMP, this.temperature - step);
      } else if (this.temperature < this.AMBIENT_TEMP) {
        this.temperature = Math.min(this.AMBIENT_TEMP, this.temperature + step);
      }
    } else if (this.power === 'low') {
      if (this.temperature < this.MAX_TEMP_LOW) {
        this.temperature = Math.min(
          this.MAX_TEMP_LOW,
          this.temperature + step * 0.5,
        );
      } else if (this.temperature > this.MAX_TEMP_LOW) {
        this.temperature = Math.max(
          this.MAX_TEMP_LOW,
          this.temperature - step * 0.5,
        );
      }
    } else if (this.power === 'high') {
      if (this.temperature < this.MAX_TEMP_HIGH) {
        this.temperature = Math.min(
          this.MAX_TEMP_HIGH,
          this.temperature + step,
        );
      }
    }
  }

  private async publishTelemetry() {
    const payload: TelemetryPayload<number> = {
      data: Number(this.temperature.toFixed(2)),
      dataType: 'number',
      timestamp: Date.now(),
      sequenceId: Math.random().toString(36).substring(7),
    };
    console.log(
      `[Heater ${this.guid}] Publishing telemetry: ${payload.data}°C`,
    );
    await this.sendTelemetry('temperature', payload);
  }
}

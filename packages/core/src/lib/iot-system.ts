import {
  IDevice,
  StateDefinition,
  EffectDefinition,
  ActuatorConfig,
  SensorConfig,
  DeviceDependency,
  TelemetryPayload,
} from './interfaces';
import { Processor } from './processor';

/**
 * Abstract class representing an IoT System.
 * Groups multiple devices and defines their collective behavior through reactive states and effects.
 */
export abstract class IotSystem<
  TDevices extends Record<
    string,
    IDevice<Record<string, ActuatorConfig>, Record<string, SensorConfig>>
  >,
  TStates extends Record<string, any>,
> {
  protected devices: TDevices = {} as TDevices;
  private processor: Processor<any>; // Internal processor uses a merged state type

  constructor() {
    this.processor = new Processor<any>();
  }

  /**
   * Adds a device to the system and subscribes to its state changes.
   * @param key The unique key to identify the device within the system.
   * @param device The device instance.
   */
  addDevice<K extends keyof TDevices>(key: K, device: TDevices[K]) {
    this.devices[key] = device;

    // Subscribe to all telemetry from the device
    // We assume the device has sensorConfigs which we can use to know what to subscribe to
    const deviceInstance = device as any;
    if (deviceInstance.sensorConfigs) {
      for (const sensorKey of Object.keys(deviceInstance.sensorConfigs)) {
        const topic = `${device.namespace}/${device.guid}/telemetry/${sensorKey}`;
        (device as any).messageBus?.subscribe(topic, (message: string) => {
          try {
            const payload = JSON.parse(message) as TelemetryPayload;
            this.processor.updateState(`device:${String(key)}.${sensorKey}`, payload.data);
            
            // Also update the full device state
            const currentFullState = this.processor.getState(`device:${String(key)}`) || {};
            this.processor.updateState(`device:${String(key)}`, {
              ...currentFullState,
              [sensorKey]: payload.data
            });
          } catch (e) {
            console.error(`[IotSystem] Failed to handle telemetry for ${String(key)}.${sensorKey}:`, e);
          }
        });
      }
    }
  }

  /**
   * Defines a system state (computed or modifiable).
   * @param name The unique name of the state.
   * @param definition The state definition.
   */
  defineState<
    K extends keyof TStates,
    TDeps extends readonly (keyof TStates)[],
    TDevDeps extends readonly DeviceDependency<TDevices>[],
  >(
    name: K,
    definition: StateDefinition<TDevices, TStates, TStates[K], TDeps, TDevDeps>,
  ) {
    if (definition.type === 'modifiable') {
      this.processor.registerState(name, definition);
    } else {
      const mappedDeps = [
        ...definition.dependencies,
        ...(definition.deviceDependencies || []).map(dep => `device:${String(dep)}`)
      ];

      this.processor.registerState(name, {
        type: 'computed',
        dependencies: mappedDeps,
        compute: (ctx) => {
          const devicesProxy = this.createDevicesProxy(definition.deviceDependencies || []);
          return definition.compute({
            devices: devicesProxy,
            states: ctx.states as any,
          });
        }
      } as any);

      // If deviceKey is provided, automatically publish changes to that device
      if (definition.deviceKey) {
        this.processor.registerEffect({
          name: `publish:${String(name)}:to:${String(definition.deviceKey)}`,
          dependencies: [name],
          action: async (ctx) => {
            await this.publishDesiredState(definition.deviceKey!, ctx.states[name]);
          }
        });
      }
    }
  }

  /**
   * Registers a reactive effect that triggers on state changes.
   * @param effect The effect definition.
   */
  registerEffect<
    TDeps extends readonly (keyof TStates)[],
    TDevDeps extends readonly DeviceDependency<TDevices>[],
  >(effect: EffectDefinition<TDevices, TStates, TDeps, TDevDeps>) {
    const mappedDeps = [
      ...effect.dependencies,
      ...(effect.deviceDependencies || []).map(dep => `device:${String(dep)}`)
    ];

    this.processor.registerEffect({
      name: effect.name,
      dependencies: mappedDeps,
      action: (ctx) => {
        const devicesProxy = this.createDevicesProxy(effect.deviceDependencies || []);
        return effect.action({
          devices: devicesProxy,
          states: ctx.states as any,
          updateState: (n, v) => this.processor.updateState(n, v)
        });
      }
    } as any);
  }

  private createDevicesProxy(deps: readonly DeviceDependency<TDevices>[]): any {
    const proxy: any = {};
    const currentStates = this.processor.getStates();

    for (const dep of deps) {
      const depStr = String(dep);
      if (depStr.includes('.')) {
        const [deviceKey, field] = depStr.split('.');
        if (!proxy[deviceKey]) {
          // Shallow clone the existing device state to avoid mutating the processor's internal state
          const existingState = currentStates[`device:${deviceKey}`];
          proxy[deviceKey] = existingState ? { ...existingState } : {};
        }
        proxy[deviceKey][field] = currentStates[`device:${depStr}`];
      } else {
        const existingState = currentStates[`device:${depStr}`];
        proxy[depStr] = existingState ? { ...existingState } : {};
      }
    }
    return proxy;
  }

  /**
   * Manually updates a modifiable system state.
   * @param name The name of the state.
   * @param value The new value.
   */
  updateState<K extends keyof TStates>(name: K, value: TStates[K]) {
    this.processor.updateState(name, value);
  }

  /**
   * Publishes the desired state for a specific device via the message bus.
   */
  public async publishDesiredState<K extends keyof TDevices>(
    deviceKey: K,
    state: any,
  ) {
    const device = this.devices[deviceKey];
    if (!device) {
      console.warn(`Device ${String(deviceKey)} not found in system`);
      return;
    }

    const topic = `${device.namespace}/${device.guid}/desired`;
    const messageBus = (device as any).messageBus;
    if (messageBus) {
      await messageBus.publish(topic, JSON.stringify(state));
    }
  }

  /**
   * Initializes the system, performing initial state recomputations.
   */
  public initialize() {
    this.processor.initialize();
  }

  public getStates(): TStates {
    return this.processor.getStates();
  }
}

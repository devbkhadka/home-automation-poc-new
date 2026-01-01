import {
  IDevice,
  StateDefinition,
  EffectDefinition,
} from './interfaces.js';
import { Processor } from './processor.js';
import { MQTTService } from './mqtt-service.js';

/**
 * Abstract class representing an IoT System.
 * Groups multiple devices and defines their collective behavior through reactive states and effects.
 */
export abstract class IotSystem<
  TDevices extends Record<string, IDevice<any, any>>,
  TStates extends Record<string, any>,
> {
  protected devices: TDevices = {} as TDevices;
  protected processor: Processor<TDevices, TStates>;
  protected mqttService: MQTTService;

  constructor(mqttService: MQTTService) {
    this.mqttService = mqttService;
    this.processor = new Processor<TDevices, TStates>({
      devices: this.devices,
      onDeviceStateChanged: (deviceKey, state) =>
        this.publishDesiredState(deviceKey, state),
    });
  }

  /**
   * Adds a device to the system.
   * @param key The unique key to identify the device within the system.
   * @param device The device instance.
   */
  addDevice<K extends keyof TDevices>(key: K, device: TDevices[K]) {
    this.devices[key] = device;
  }

  /**
   * Defines a system state (computed or modifiable).
   * @param name The unique name of the state.
   * @param definition The state definition.
   */
  defineState<
    K extends keyof TStates,
    TDeps extends readonly (keyof TStates)[],
    TDevDeps extends readonly (keyof TDevices)[],
  >(
    name: K,
    definition: StateDefinition<TDevices, TStates, TStates[K], TDeps, TDevDeps>,
  ) {
    this.processor.registerState(name, definition);
  }

  /**
   * Registers a reactive effect that triggers on state changes.
   * @param effect The effect definition.
   */
  registerEffect<
    TDeps extends readonly (keyof TStates)[],
    TDevDeps extends readonly (keyof TDevices)[],
  >(effect: EffectDefinition<TDevices, TStates, TDeps, TDevDeps>) {
    this.processor.registerEffect(effect);
  }

  /**
   * Internally publishes the desired state for a specific device.
   * Called only by the processor when a linked system state changes.
   */
  protected async publishDesiredState<K extends keyof TDevices>(
    deviceKey: K,
    state: any,
  ) {
    const device = this.devices[deviceKey];
    if (!device) {
      console.warn(`Device ${String(deviceKey)} not found in system`);
      return;
    }

    const topic = `${device.namespace}/${device.guid}/desired`;
    await this.mqttService.publish(topic, JSON.stringify(state));
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
   * Initializes the system, performing initial state recomputations.
   */
  protected initialize() {
    this.processor.initialize();
  }
}

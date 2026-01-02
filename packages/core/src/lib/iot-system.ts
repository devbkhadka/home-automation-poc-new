import {
  IDevice,
  StateDefinition,
  EffectDefinition,
  ActuatorConfig,
  SensorConfig,
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
  private processor: Processor<TDevices, TStates>;

  constructor() {
    this.processor = new Processor<TDevices, TStates>({
      devices: this.devices,
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
  public initialize() {
    this.processor.initialize();
  }
}

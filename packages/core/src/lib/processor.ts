import {
  StateDefinition,
  EffectDefinition,
  EffectContext,
} from './interfaces';

export interface ProcessorConfig<TDevices, TStates> {
  devices: TDevices;
}

/**
 * Core engine for managing the state of an IoT system.
 * It handles state registrations, computed states, and effects based on state changes.
 * 
 * @template TDevices Type definition for the devices available in the system.
 * @template TStates Type definition for the states managed by the processor.
 */
export class Processor<TDevices, TStates> {
  private states = new Map<keyof TStates, any>();
  private definitions = new Map<
    keyof TStates,
    StateDefinition<TDevices, TStates, any>
  >();
  private effects: EffectDefinition<TDevices, TStates, any, any>[] = [];
  private devices: TDevices;

  /**
   * Creates a new instance of the Processor.
   * @param config Configuration object containing initial device instances.
   */
  constructor(config: ProcessorConfig<TDevices, TStates>) {
    this.devices = config.devices;
  }

  /**
   * Registers a new state definition.
   * States can be 'modifiable' (external input) or 'computed' (derived from other states/devices).
   * 
   * @param name The unique identifier for the state.
   * @param definition The configuration for the state, including its type, initial value or compute function.
   */
  registerState<
    K extends keyof TStates,
    TDeps extends readonly (keyof TStates)[],
    TDevDeps extends readonly (keyof TDevices)[],
  >(
    name: K,
    definition: StateDefinition<TDevices, TStates, TStates[K], TDeps, TDevDeps>,
  ) {
    this.definitions.set(name, definition);
    if (definition.type === 'modifiable') {
      this.states.set(name, definition.initialValue);
    }
  }

  /**
   * Registers an effect that runs when specific dependencies change.
   * Effects are used for side-effects like sending commands to devices or external systems.
   * 
   * @param effect The effect definition including dependencies and the action to perform.
   */
  registerEffect<
    TDeps extends readonly (keyof TStates)[],
    TDevDeps extends readonly (keyof TDevices)[],
  >(effect: EffectDefinition<TDevices, TStates, TDeps, TDevDeps>) {
    this.effects.push(effect as any);
  }

  /**
   * Updates a modifiable state and triggers the recomputation of dependent states and effects.
   * 
   * @param name The name of the state to update.
   * @param value The new value for the state.
   */
  updateState<K extends keyof TStates>(name: K, value: TStates[K]) {
    const oldValue = this.states.get(name);
    // Simple comparison for primitives, deep comparison for objects could be added if needed
    if (this.hasChanged(oldValue, value)) {
      this.states.set(name, value);
      this.processChanges([name]);
    }
  }

  /**
   * Initializes the processor by performing an initial recompute of all registered states.
   * This ensures all computed states are populated based on their initial dependencies.
   */
  public initialize() {
    // Initial recompute to populate all computed states
    this.processChanges(Array.from(this.definitions.keys()));
  }

  private processChanges(changedStates: (keyof TStates)[]) {
    const sorted = this.topologicalSort(Array.from(this.definitions.keys()));

    const currentChanges = new Set<keyof TStates>(changedStates);

    for (const stateName of sorted) {
      const def = this.definitions.get(stateName);
      if (def?.type === 'computed') {
        const hasChangedDependency = def.dependencies.some(
          (dep: keyof TStates) => currentChanges.has(dep),
        );

        if (hasChangedDependency || !this.states.has(stateName)) {
          const restrictedStates = this.getRestrictedStates(def.dependencies);
          const restrictedDevices = this.getRestrictedDevices(
            def.deviceDependencies || [],
          );

          const newValue = def.compute({
            devices: restrictedDevices,
            states: restrictedStates,
          });
          const oldValue = this.states.get(stateName);

          if (this.hasChanged(oldValue, newValue)) {
            this.states.set(stateName, newValue);
            currentChanges.add(stateName);
          }
        }
      }
    }

    // After all recomputations, check if any changed state is linked to a device
    for (const stateName of currentChanges) {
      const def = this.definitions.get(stateName);
      if (def?.deviceKey) {
        this.publishDesiredState(def.deviceKey, this.states.get(stateName));
      }
    }

    this.triggerEffects(Array.from(currentChanges));
  }

  /**
   * Publishes the desired state for a specific device via the message bus.
   * 
   * @param deviceKey The key identifying the device in the system.
   * @param state The state object to publish to the device's 'desired' topic.
   */
  public async publishDesiredState<K extends keyof TDevices>(
    deviceKey: K,
    state: any,
  ) {
    const device = (this.devices as any)[deviceKey];
    if (!device) {
      console.warn(`Device ${String(deviceKey)} not found in system`);
      return;
    }

    const topic = `${device.namespace}/${device.guid}/desired`;
    await device.getMessageBus().publish(topic, JSON.stringify(state));
  }

  private hasChanged(oldValue: any, newValue: any): boolean {
    if (oldValue === newValue) return false;
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }
    return true;
  }

  /**
   * Returns a snapshot of all current states managed by the processor.
   * @returns An object containing all state keys and their current values.
   */
  public getStates(): TStates {
    const proxy = {} as any;
    for (const [key, value] of this.states.entries()) {
      proxy[key] = value;
    }
    return proxy as TStates;
  }

  private triggerEffects(allChangedStates: (keyof TStates)[]) {
    const changedSet = new Set(allChangedStates);

    for (const effect of this.effects) {
      if (effect.dependencies.some((t: keyof TStates) => changedSet.has(t))) {
        const restrictedStates = this.getRestrictedStates(effect.dependencies);
        const restrictedDevices = this.getRestrictedDevices(
          effect.deviceDependencies || [],
        );

        const context: EffectContext<TDevices, TStates, any, any> = {
          devices: restrictedDevices,
          states: restrictedStates,
          updateState: (name: keyof TStates, value: any) =>
            this.updateState(name, value),
        };

        // Effects can be async, but we don't necessarily wait for them here
        // to avoid blocking the state update loop.
        Promise.resolve(effect.action(context)).catch((err) => {
          console.error(`Error in effect ${effect.name}:`, err);
        });
      }
    }
  }

  private topologicalSort(allStates: (keyof TStates)[]): (keyof TStates)[] {
    const visited = new Set<keyof TStates>();
    const result: (keyof TStates)[] = [];
    const visiting = new Set<keyof TStates>();

    const visit = (name: keyof TStates) => {
      if (visiting.has(name))
        throw new Error(`Circular dependency detected at ${String(name)}`);
      if (visited.has(name)) return;

      const def = this.definitions.get(name);
      if (def?.type === 'computed') {
        visiting.add(name);
        for (const dep of def.dependencies) {
          visit(dep);
        }
        visiting.delete(name);
      }

      visited.add(name);
      result.push(name);
    };

    for (const name of allStates) {
      visit(name);
    }

    return result;
  }

  private getRestrictedStates(dependencies: readonly (keyof TStates)[]): any {
    const subset: any = {};
    for (const dep of dependencies) {
      subset[dep] = this.states.get(dep);
    }
    return subset;
  }

  private getRestrictedDevices(dependencies: readonly (keyof TDevices)[]): any {
    const subset: any = {};
    for (const dep of dependencies) {
      subset[dep] = (this.devices as any)[dep];
    }
    return subset;
  }
}

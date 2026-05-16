import {
  ProcessorStateDefinition,
  ProcessorEffectDefinition,
  ProcessorEffectContext,
} from './interfaces';

/**
 * Core engine for managing the state of an IoT system.
 * It handles state registrations, computed states, and effects based on state changes.
 *
 * @template TStates Type definition for the states managed by the processor.
 */
export class Processor<TStates> {
  private states = new Map<keyof TStates, any>();
  private definitions = new Map<
    keyof TStates,
    ProcessorStateDefinition<TStates, any, any>
  >();
  private effects: ProcessorEffectDefinition<TStates, any>[] = [];

  /**
   * Registers a new state definition.
   * States can be 'modifiable' (external input) or 'computed' (derived from other states).
   *
   * @param name The unique identifier for the state.
   * @param definition The configuration for the state, including its type, initial value or compute function.
   */
  registerState<
    K extends keyof TStates,
    TDeps extends readonly (keyof TStates)[],
  >(
    name: K,
    definition: ProcessorStateDefinition<TStates, TStates[K], TDeps>,
  ) {
    this.definitions.set(name, definition);
    if (definition.type === 'modifiable') {
      this.states.set(name, definition.initialValue);
    }
  }

  /**
   * Registers an effect that runs when specific dependencies change.
   *
   * @param effect The effect definition including dependencies and the action to perform.
   */
  registerEffect<TDeps extends readonly (keyof TStates)[]>(
    effect: ProcessorEffectDefinition<TStates, TDeps>,
  ) {
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

          const newValue = def.compute({
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

    this.triggerEffects(Array.from(currentChanges));
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

  /**
   * Returns the current value of a specific state.
   * @param name The name of the state.
   * @returns The current value or undefined if not set.
   */
  public getState<K extends keyof TStates>(name: K): TStates[K] | undefined {
    return this.states.get(name);
  }

  private triggerEffects(allChangedStates: (keyof TStates)[]) {
    const changedSet = new Set(allChangedStates);

    for (const effect of this.effects) {
      if (effect.dependencies.some((t: keyof TStates) => changedSet.has(t))) {
        const restrictedStates = this.getRestrictedStates(effect.dependencies);

        const context: ProcessorEffectContext<TStates, any> = {
          states: restrictedStates,
          updateState: (name: keyof TStates, value: any) =>
            this.updateState(name, value),
        };

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
}

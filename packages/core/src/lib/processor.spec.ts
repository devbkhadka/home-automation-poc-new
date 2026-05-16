import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Processor } from './processor';

describe('Processor', () => {
  interface MockStates {
    temperature: number;
    threshold: number;
    isHot: boolean;
    alarm: boolean;
  }

  let processor: Processor<MockStates>;

  beforeEach(() => {
    processor = new Processor<MockStates>();
  });

  describe('registerState', () => {
    it('should register a modifiable state and set initial value', () => {
      processor.registerState('temperature', {
        type: 'modifiable',
        initialValue: 20,
      });

      expect(processor.getStates().temperature).toBe(20);
    });

    it('should register a computed state', () => {
      processor.registerState('temperature', {
        type: 'modifiable',
        initialValue: 20,
      });

      processor.registerState('isHot', {
        type: 'computed',
        dependencies: ['temperature'],
        compute: ({ states }) => states.temperature > 25,
      });

      processor.initialize();
      expect(processor.getStates().isHot).toBe(false);
    });
  });

  describe('updateState', () => {
    it('should update modifiable state and trigger recomputation', () => {
      processor.registerState('temperature', {
        type: 'modifiable',
        initialValue: 20,
      });

      processor.registerState('isHot', {
        type: 'computed',
        dependencies: ['temperature'],
        compute: ({ states }) => states.temperature > 25,
      });

      processor.initialize();
      processor.updateState('temperature', 30);

      expect(processor.getStates().temperature).toBe(30);
      expect(processor.getStates().isHot).toBe(true);
    });

    it('should not trigger recomputation if value has not changed', () => {
      const computeSpy = vi.fn(({ states }) => states.temperature > 25);
      
      processor.registerState('temperature', {
        type: 'modifiable',
        initialValue: 20,
      });

      processor.registerState('isHot', {
        type: 'computed',
        dependencies: ['temperature'],
        compute: computeSpy,
      });

      processor.initialize();
      computeSpy.mockClear();

      processor.updateState('temperature', 20); // Same value
      expect(computeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Topological Sorting', () => {
    it('should compute states in correct order based on dependencies', () => {
      processor.registerState('temperature', {
        type: 'modifiable',
        initialValue: 20,
      });

      processor.registerState('isHot', {
        type: 'computed',
        dependencies: ['temperature'],
        compute: ({ states }) => states.temperature > 25,
      });

      processor.registerState('alarm', {
        type: 'computed',
        dependencies: ['isHot'],
        compute: ({ states }) => states.isHot === true,
      });

      processor.initialize();
      processor.updateState('temperature', 30);

      expect(processor.getStates().isHot).toBe(true);
      expect(processor.getStates().alarm).toBe(true);
    });

    it('should throw error on circular dependencies', () => {
      processor.registerState('isHot' as any, {
        type: 'computed',
        dependencies: ['alarm' as any],
        compute: () => true,
      });

      processor.registerState('alarm' as any, {
        type: 'computed',
        dependencies: ['isHot' as any],
        compute: () => true,
      });

      expect(() => processor.initialize()).toThrow('Circular dependency');
    });
  });

  describe('registerEffect', () => {
    it('should trigger effect when dependency changes', async () => {
      const effectAction = vi.fn();
      
      processor.registerState('temperature', {
        type: 'modifiable',
        initialValue: 20,
      });

      processor.registerEffect({
        name: 'test-effect',
        dependencies: ['temperature'],
        action: effectAction,
      });

      processor.initialize();
      processor.updateState('temperature', 25);

      // Effects are triggered via Promise.resolve, so we wait a bit
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(effectAction).toHaveBeenCalled();
    });

    it('should provide restricted states to effect action', async () => {
      let capturedStates: any;
      
      processor.registerState('temperature', {
        type: 'modifiable',
        initialValue: 20,
      });

      processor.registerEffect({
        name: 'test-effect',
        dependencies: ['temperature'],
        action: ({ states }) => {
          capturedStates = states;
        },
      });

      processor.initialize();
      processor.updateState('temperature', 25);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(capturedStates).toEqual({ temperature: 25 });
    });
  });
});

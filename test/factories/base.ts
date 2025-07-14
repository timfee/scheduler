/**
 * Base factory class for creating test data
 */
export class Factory<T> {
  private definition: () => T;

  constructor(definition: () => T) {
    this.definition = definition;
  }

  /**
   * Create a factory with the given definition
   */
  static define<T>(definition: () => T): Factory<T> {
    return new Factory(definition);
  }

  /**
   * Build a single instance
   */
  build(overrides?: Partial<T>): T {
    const instance = this.definition();
    return { ...instance, ...overrides };
  }

  /**
   * Build multiple instances
   */
  buildList(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  /**
   * Build a sequence of string values
   */
  buildStringSequence(options: {
    count: number;
    sequenceField: keyof T;
    prefix?: string;
  }): T[] {
    const { count, sequenceField, prefix = "" } = options;
    return Array.from({ length: count }, (_, index) => {
      const sequenceValue = `${prefix}${index + 1}`;
      const overrides = {
        [sequenceField]: sequenceValue,
      } as Partial<T>;
      return this.build(overrides);
    });
  }

  /**
   * Build a sequence of number values
   */
  buildNumberSequence(options: { count: number; sequenceField: keyof T }): T[] {
    const { count, sequenceField } = options;
    return Array.from({ length: count }, (_, index) => {
      const sequenceValue = index + 1;
      const overrides = {
        [sequenceField]: sequenceValue,
      } as Partial<T>;
      return this.build(overrides);
    });
  }
}

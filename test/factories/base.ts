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
   * Build with sequence numbers
   */
  buildSequence(count: number, sequenceField: keyof T, prefix = ''): T[] {
    return Array.from({ length: count }, (_, index) => {
      const overrides = {
        [sequenceField]: `${prefix}${index + 1}`,
      } as Partial<T>;
      return this.build(overrides);
    });
  }
}
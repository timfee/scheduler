declare namespace jest {
  interface Jest {
    unstable_mockModule<T = unknown>(
      moduleName: string,
      factory: () => T | Promise<T>
    ): void;
  }
}
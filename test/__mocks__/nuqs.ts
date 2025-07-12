// Mock for nuqs package
import React from 'react';

export const NuqsTestingAdapter = ({ children }: { children: React.ReactNode }) => children;

export const useSearchParams = () => ({
  get: () => null,
  set: () => {},
  delete: () => {},
});

export const useQueryState = (key: string) => [null, () => {}];

export const useQueryStates = (keys: Record<string, any>) => [{}, () => {}];

export const parseAsInteger = {
  parse: (value: string) => parseInt(value, 10),
  serialize: (value: number) => value.toString(),
  withDefault: (defaultValue: number) => ({
    parse: (value: string) => value ? parseInt(value, 10) : defaultValue,
    serialize: (value: number) => value.toString(),
  }),
};

export const parseAsString = {
  parse: (value: string) => value,
  serialize: (value: string) => value,
  withDefault: (defaultValue: string) => ({
    parse: (value: string) => value || defaultValue,
    serialize: (value: string) => value,
  }),
};

export const parseAsBoolean = {
  parse: (value: string) => value === 'true',
  serialize: (value: boolean) => value ? 'true' : 'false',
  withDefault: (defaultValue: boolean) => ({
    parse: (value: string) => value ? value === 'true' : defaultValue,
    serialize: (value: boolean) => value ? 'true' : 'false',
  }),
};

export const parseAsIsoDateTime = {
  parse: (value: string) => new Date(value),
  serialize: (value: Date) => value.toISOString(),
  withDefault: (defaultValue: Date) => ({
    parse: (value: string) => value ? new Date(value) : defaultValue,
    serialize: (value: Date) => value.toISOString(),
  }),
};
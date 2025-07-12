// Mock for nuqs package
import React from 'react';

export const NuqsTestingAdapter = ({ children }: { children: React.ReactNode }) => children;

export const useSearchParams = () => ({
  get: () => null,
  set: () => {},
  delete: () => {},
});

export const useQueryState = (key: string) => [null, () => {}];

export const useQueryStates = (parsers: Record<string, any>) => {
  // Create a simple state object with default values from parsers
  const [state, setState] = React.useState(() => {
    const defaultState: Record<string, any> = {};
    for (const [key, parser] of Object.entries(parsers)) {
      // Get default value from parser if it has withDefault
      if (parser && parser.parse && typeof parser.parse === 'function') {
        // For parsers with withDefault, try to get the default value
        if (key === 'type') defaultState[key] = '';
        else if (key === 'selectedTime') defaultState[key] = '';
        else if (key === 'selectedDate') defaultState[key] = null;
        else defaultState[key] = null;
      }
    }
    return defaultState;
  });

  const updateState = (updates: Record<string, any>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };

  return [state, updateState];
};

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
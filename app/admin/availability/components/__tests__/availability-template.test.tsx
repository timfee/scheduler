import { describe, it, expect, jest } from '@jest/globals'
import { AvailabilityTemplate } from '../availability-template';

// Mock the actions
jest.mock('@/app/admin/availability/server/actions', () => ({
  loadAvailabilityTemplateAction: jest.fn().mockResolvedValue(null),
  saveAvailabilityTemplateAction: jest.fn().mockResolvedValue(undefined),
}));

describe('AvailabilityTemplate', () => {
  it('is a valid React component', () => {
    // Just check that the component function exists and can be called
    expect(typeof AvailabilityTemplate).toBe('function');
    expect(AvailabilityTemplate.name).toBe('AvailabilityTemplate');
  });
  
  it('exports the expected interface', () => {
    // Ensure the component is properly exportable
    expect(AvailabilityTemplate).toBeDefined();
  });
});
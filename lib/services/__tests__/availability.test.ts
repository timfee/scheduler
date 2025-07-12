import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock the dependencies using jest.mock
const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();
jest.mock('@/lib/utils/preferences', () => ({
  getPreference: mockGetPreference,
  setPreference: mockSetPreference,
}));

const mockParse = jest.fn();
jest.mock('@/lib/schemas/availability', () => ({
  weeklyAvailabilitySchema: {
    parse: mockParse,
  },
}));

const mockMapErrorToUserMessage = jest.fn();
jest.mock('@/lib/errors', () => ({
  mapErrorToUserMessage: mockMapErrorToUserMessage,
}));

const mockRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

// Import the service after mocking
import { saveAvailabilityTemplateAction, loadAvailabilityTemplateAction } from '../availability';

describe('availability service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('saveAvailabilityTemplateAction', () => {
    it('should validate input using weeklyAvailabilitySchema', async () => {
      const mockAvailability = {
        monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      };

      const validatedAvailability = { ...mockAvailability };
      mockParse.mockReturnValue(validatedAvailability);
      mockSetPreference.mockResolvedValue(undefined);

      await saveAvailabilityTemplateAction(mockAvailability);

      expect(mockParse).toHaveBeenCalledWith(mockAvailability);
      expect(mockSetPreference).toHaveBeenCalledWith('availability_template', validatedAvailability);
    });

    it('should revalidate admin pages after saving', async () => {
      const mockAvailability = {
        monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      };

      mockParse.mockReturnValue(mockAvailability);
      mockSetPreference.mockResolvedValue(undefined);

      await saveAvailabilityTemplateAction(mockAvailability);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/availability');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
    });

    it('should handle validation errors and map them to user-friendly messages', async () => {
      const mockAvailability = { invalid: 'data' };
      const validationError = new Error('Invalid availability format');
      const mappedError = 'Failed to save availability template';

      mockParse.mockImplementation(() => {
        throw validationError;
      });
      mockMapErrorToUserMessage.mockReturnValue(mappedError);

      await expect(saveAvailabilityTemplateAction(mockAvailability)).rejects.toThrow(mappedError);
      
      expect(mockMapErrorToUserMessage).toHaveBeenCalledWith(
        validationError,
        'Failed to save availability template'
      );
    });

    it('should handle preference saving errors', async () => {
      const mockAvailability = {
        monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      };

      const preferenceSaveError = new Error('Database connection failed');
      const mappedError = 'Failed to save availability template';

      mockParse.mockReturnValue(mockAvailability);
      mockSetPreference.mockRejectedValue(preferenceSaveError);
      mockMapErrorToUserMessage.mockReturnValue(mappedError);

      await expect(saveAvailabilityTemplateAction(mockAvailability)).rejects.toThrow(mappedError);
      
      expect(mockMapErrorToUserMessage).toHaveBeenCalledWith(
        preferenceSaveError,
        'Failed to save availability template'
      );
    });
  });

  describe('loadAvailabilityTemplateAction', () => {
    it('should return null when no template is stored', async () => {
      mockGetPreference.mockResolvedValue(null);

      const result = await loadAvailabilityTemplateAction();

      expect(result).toBeNull();
      expect(mockGetPreference).toHaveBeenCalledWith('availability_template');
    });

    it('should return validated template when stored data exists', async () => {
      const storedTemplate = {
        monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      };

      const validatedTemplate = { ...storedTemplate };

      mockGetPreference.mockResolvedValue(storedTemplate);
      mockParse.mockReturnValue(validatedTemplate);

      const result = await loadAvailabilityTemplateAction();

      expect(result).toEqual(validatedTemplate);
      expect(mockGetPreference).toHaveBeenCalledWith('availability_template');
      expect(mockParse).toHaveBeenCalledWith(storedTemplate);
    });

    it('should handle validation errors for stored corrupted data', async () => {
      const corruptedTemplate = { invalid: 'data' };
      const validationError = new Error('Invalid stored template');
      const mappedError = 'Failed to load availability template';

      mockGetPreference.mockResolvedValue(corruptedTemplate);
      mockParse.mockImplementation(() => {
        throw validationError;
      });
      mockMapErrorToUserMessage.mockReturnValue(mappedError);

      await expect(loadAvailabilityTemplateAction()).rejects.toThrow(mappedError);
      
      expect(mockMapErrorToUserMessage).toHaveBeenCalledWith(
        validationError,
        'Failed to load availability template'
      );
    });

    it('should handle preference loading errors', async () => {
      const preferenceLoadError = new Error('Database connection failed');
      const mappedError = 'Failed to load availability template';

      mockGetPreference.mockRejectedValue(preferenceLoadError);
      mockMapErrorToUserMessage.mockReturnValue(mappedError);

      await expect(loadAvailabilityTemplateAction()).rejects.toThrow(mappedError);
      
      expect(mockMapErrorToUserMessage).toHaveBeenCalledWith(
        preferenceLoadError,
        'Failed to load availability template'
      );
    });

    it('should validate the stored template before returning', async () => {
      const storedTemplate = {
        monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      };

      mockGetPreference.mockResolvedValue(storedTemplate);
      
      // Mock schema validation to modify the data slightly
      const validatedTemplate = { 
        ...storedTemplate,
        validated: true 
      };
      mockParse.mockReturnValue(validatedTemplate);

      const result = await loadAvailabilityTemplateAction();

      expect(result).toEqual(validatedTemplate);
      expect(mockParse).toHaveBeenCalledWith(storedTemplate);
    });
  });
});
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock the dependencies
jest.unstable_mockModule('@/lib/utils/preferences', () => ({
  getPreference: jest.fn(),
  setPreference: jest.fn(),
}));

jest.unstable_mockModule('@/lib/schemas/availability', () => ({
  weeklyAvailabilitySchema: {
    parse: jest.fn(),
  },
}));

jest.unstable_mockModule('@/lib/errors', () => ({
  mapErrorToUserMessage: jest.fn(),
}));

jest.unstable_mockModule('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('availability service', () => {
  let saveAvailabilityTemplateAction: (availability: any) => Promise<void>;
  let loadAvailabilityTemplateAction: () => Promise<any>;
  let getPreference: jest.MockedFunction<any>;
  let setPreference: jest.MockedFunction<any>;
  let weeklyAvailabilitySchema: { parse: jest.MockedFunction<any> };
  let mapErrorToUserMessage: jest.MockedFunction<any>;
  let revalidatePath: jest.MockedFunction<any>;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Import the mocked dependencies
    const preferencesModule = await import('@/lib/utils/preferences');
    const availabilityModule = await import('@/lib/schemas/availability');
    const errorsModule = await import('@/lib/errors');
    const nextCacheModule = await import('next/cache');
    
    getPreference = preferencesModule.getPreference as jest.MockedFunction<any>;
    setPreference = preferencesModule.setPreference as jest.MockedFunction<any>;
    weeklyAvailabilitySchema = availabilityModule.weeklyAvailabilitySchema as { parse: jest.MockedFunction<any> };
    mapErrorToUserMessage = errorsModule.mapErrorToUserMessage as jest.MockedFunction<any>;
    revalidatePath = nextCacheModule.revalidatePath as jest.MockedFunction<any>;
    
    // Import the module under test
    const availabilityServiceModule = await import('../availability');
    saveAvailabilityTemplateAction = availabilityServiceModule.saveAvailabilityTemplateAction;
    loadAvailabilityTemplateAction = availabilityServiceModule.loadAvailabilityTemplateAction;
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
      weeklyAvailabilitySchema.parse.mockReturnValue(validatedAvailability);
      setPreference.mockResolvedValue(undefined);

      await saveAvailabilityTemplateAction(mockAvailability);

      expect(weeklyAvailabilitySchema.parse).toHaveBeenCalledWith(mockAvailability);
      expect(setPreference).toHaveBeenCalledWith('availability_template', validatedAvailability);
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

      weeklyAvailabilitySchema.parse.mockReturnValue(mockAvailability);
      setPreference.mockResolvedValue(undefined);

      await saveAvailabilityTemplateAction(mockAvailability);

      expect(revalidatePath).toHaveBeenCalledWith('/admin/availability');
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
    });

    it('should handle validation errors and map them to user-friendly messages', async () => {
      const mockAvailability = { invalid: 'data' };
      const validationError = new Error('Invalid availability format');
      const mappedError = 'Failed to save availability template';

      weeklyAvailabilitySchema.parse.mockImplementation(() => {
        throw validationError;
      });
      mapErrorToUserMessage.mockReturnValue(mappedError);

      await expect(saveAvailabilityTemplateAction(mockAvailability)).rejects.toThrow(mappedError);
      
      expect(mapErrorToUserMessage).toHaveBeenCalledWith(
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

      weeklyAvailabilitySchema.parse.mockReturnValue(mockAvailability);
      setPreference.mockRejectedValue(preferenceSaveError);
      mapErrorToUserMessage.mockReturnValue(mappedError);

      await expect(saveAvailabilityTemplateAction(mockAvailability)).rejects.toThrow(mappedError);
      
      expect(mapErrorToUserMessage).toHaveBeenCalledWith(
        preferenceSaveError,
        'Failed to save availability template'
      );
    });
  });

  describe('loadAvailabilityTemplateAction', () => {
    it('should return null when no template is stored', async () => {
      getPreference.mockResolvedValue(null);

      const result = await loadAvailabilityTemplateAction();

      expect(result).toBeNull();
      expect(getPreference).toHaveBeenCalledWith('availability_template');
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

      getPreference.mockResolvedValue(storedTemplate);
      weeklyAvailabilitySchema.parse.mockReturnValue(validatedTemplate);

      const result = await loadAvailabilityTemplateAction();

      expect(result).toEqual(validatedTemplate);
      expect(getPreference).toHaveBeenCalledWith('availability_template');
      expect(weeklyAvailabilitySchema.parse).toHaveBeenCalledWith(storedTemplate);
    });

    it('should handle validation errors for stored corrupted data', async () => {
      const corruptedTemplate = { invalid: 'data' };
      const validationError = new Error('Invalid stored template');
      const mappedError = 'Failed to load availability template';

      getPreference.mockResolvedValue(corruptedTemplate);
      weeklyAvailabilitySchema.parse.mockImplementation(() => {
        throw validationError;
      });
      mapErrorToUserMessage.mockReturnValue(mappedError);

      await expect(loadAvailabilityTemplateAction()).rejects.toThrow(mappedError);
      
      expect(mapErrorToUserMessage).toHaveBeenCalledWith(
        validationError,
        'Failed to load availability template'
      );
    });

    it('should handle preference loading errors', async () => {
      const preferenceLoadError = new Error('Database connection failed');
      const mappedError = 'Failed to load availability template';

      getPreference.mockRejectedValue(preferenceLoadError);
      mapErrorToUserMessage.mockReturnValue(mappedError);

      await expect(loadAvailabilityTemplateAction()).rejects.toThrow(mappedError);
      
      expect(mapErrorToUserMessage).toHaveBeenCalledWith(
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

      getPreference.mockResolvedValue(storedTemplate);
      
      // Mock schema validation to modify the data slightly
      const validatedTemplate = { 
        ...storedTemplate,
        validated: true 
      };
      weeklyAvailabilitySchema.parse.mockReturnValue(validatedTemplate);

      const result = await loadAvailabilityTemplateAction();

      expect(result).toEqual(validatedTemplate);
      expect(weeklyAvailabilitySchema.parse).toHaveBeenCalledWith(storedTemplate);
    });
  });
});
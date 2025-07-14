import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  createAppointmentTypeAction,
  updateAppointmentTypeAction,
  deleteAppointmentTypeAction,
  getAllAppointmentTypesAction,
  toggleAppointmentTypeAction,
  type CreateAppointmentTypeData,
  type UpdateAppointmentTypeData,
} from '../actions';

// Mock the database and dependencies
jest.mock('@/lib/database', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 })
      })
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 })
        })
      })
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 })
      })
    }),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            all: jest.fn(() => [{
              id: 'test-id',
              name: 'Test Type',
              description: 'Test Description',
              durationMinutes: 30,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }])
          }))
        })),
        all: jest.fn(() => [{
          id: 'test-id',
          name: 'Test Type',
          description: 'Test Description',
          durationMinutes: 30,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }])
      }))
    }))
  }
}));

jest.mock('@/lib/schemas/database', () => ({
  appointmentTypes: {
    $inferSelect: {},
    $inferInsert: {},
    id: 'id',
    name: 'name',
    description: 'description',
    durationMinutes: 'durationMinutes',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
}));

jest.mock('@/lib/errors', () => ({
  mapErrorToUserMessage: jest.fn((error, fallback) => fallback)
}));

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn()
}));

jest.mock('@/lib/errors', () => ({
  mapErrorToUserMessage: jest.fn((error, defaultMessage) => defaultMessage)
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

jest.mock('zod', () => ({
  z: {
    object: jest.fn().mockReturnValue({
      parse: jest.fn().mockReturnValue({})
    })
  }
}));

describe('Appointment Type Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mocks to their default successful state
    const mockDb = require('@/lib/database').db;
    
    // Reset select mock to default behavior
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([{
              id: 'test-id',
              name: 'Test Type',
              description: 'Test Description',
              durationMinutes: 30,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }])
          })
        }),
        all: jest.fn().mockReturnValue([{
          id: 'test-id',
          name: 'Test Type',
          description: 'Test Description',
          durationMinutes: 30,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }])
      })
    });

    // Reset update mock to default behavior
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 })
        })
      })
    });

    // Reset delete mock to default behavior
    mockDb.delete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 })
      })
    });

    // Reset insert mock to default behavior
    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 })
      })
    });
  });

  describe('createAppointmentTypeAction', () => {
    it('should create an appointment type successfully', async () => {
      const data: CreateAppointmentTypeData = {
        name: 'Test Type',
        description: 'Test Description',
        durationMinutes: 30
      };

      const result = await createAppointmentTypeAction(data);
      
      expect(result.success).toBe(true);
      expect(result.id).toBe('test-uuid');
    });

    it('should throw validation error for empty name', async () => {
      const data: CreateAppointmentTypeData = {
        name: '',
        description: 'Test Description',
        durationMinutes: 30
      };

      const result = await createAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create appointment type');
    });

    it('should throw validation error for whitespace-only name', async () => {
      const data: CreateAppointmentTypeData = {
        name: '   ',
        description: 'Test Description',
        durationMinutes: 30
      };

      const result = await createAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create appointment type');
    });

    it('should throw validation error for invalid duration (too low)', async () => {
      const data: CreateAppointmentTypeData = {
        name: 'Test Type',
        description: 'Test Description',
        durationMinutes: 0
      };

      const result = await createAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create appointment type');
    });

    it('should throw validation error for invalid duration (too high)', async () => {
      const data: CreateAppointmentTypeData = {
        name: 'Test Type',
        description: 'Test Description',
        durationMinutes: 500
      };

      const result = await createAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create appointment type');
    });

    it('should handle database errors gracefully', async () => {
      const mockDb = require('@/lib/database').db;
      mockDb.insert.mockImplementation(() => {
        throw new Error('Database error');
      });

      const data: CreateAppointmentTypeData = {
        name: 'Test Type',
        description: 'Test Description',
        durationMinutes: 30
      };

      const result = await createAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateAppointmentTypeAction', () => {
    it('should update an appointment type successfully', async () => {
      const data: UpdateAppointmentTypeData = {
        id: 'test-id',
        name: 'Updated Type',
        description: 'Updated Description',
        durationMinutes: 45,
        isActive: true
      };

      const result = await updateAppointmentTypeAction(data);
      
      expect(result.success).toBe(true);
    });

    it('should throw validation error for empty ID', async () => {
      const data: UpdateAppointmentTypeData = {
        id: '',
        name: 'Updated Type',
        description: 'Updated Description',
        durationMinutes: 45,
        isActive: true
      };

      const result = await updateAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update appointment type');
    });

    it('should throw validation error for whitespace-only ID', async () => {
      const data: UpdateAppointmentTypeData = {
        id: '   ',
        name: 'Updated Type',
        description: 'Updated Description',
        durationMinutes: 45,
        isActive: true
      };

      const result = await updateAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update appointment type');
    });

    it('should throw validation error for empty name', async () => {
      const data: UpdateAppointmentTypeData = {
        id: 'test-id',
        name: '',
        description: 'Updated Description',
        durationMinutes: 45,
        isActive: true
      };

      const result = await updateAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update appointment type');
    });

    it('should throw validation error for invalid duration', async () => {
      const data: UpdateAppointmentTypeData = {
        id: 'test-id',
        name: 'Updated Type',
        description: 'Updated Description',
        durationMinutes: 0,
        isActive: true
      };

      const result = await updateAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update appointment type');
    });

    it('should handle appointment type not found', async () => {
      const mockDb = require('@/lib/database').db;
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            run: jest.fn().mockReturnValue({ changes: 0 })
          })
        })
      });

      const data: UpdateAppointmentTypeData = {
        id: 'nonexistent-id',
        name: 'Updated Type',
        description: 'Updated Description',
        durationMinutes: 45,
        isActive: true
      };

      const result = await updateAppointmentTypeAction(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment type not found');
    });
  });

  describe('deleteAppointmentTypeAction', () => {
    it('should delete an appointment type successfully', async () => {
      const result = await deleteAppointmentTypeAction('test-id');
      
      expect(result.success).toBe(true);
    });

    it('should throw validation error for empty ID', async () => {
      const result = await deleteAppointmentTypeAction('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete appointment type');
    });

    it('should throw validation error for whitespace-only ID', async () => {
      const result = await deleteAppointmentTypeAction('   ');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete appointment type');
    });

    it('should handle appointment type not found', async () => {
      const mockDb = require('@/lib/database').db;
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 0 })
        })
      });

      const result = await deleteAppointmentTypeAction('nonexistent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment type not found');
    });
  });

  describe('toggleAppointmentTypeAction', () => {
    it('should toggle an appointment type successfully', async () => {
      const result = await toggleAppointmentTypeAction('test-id');
      
      expect(result.success).toBe(true);
    });

    it('should throw validation error for empty ID', async () => {
      const result = await toggleAppointmentTypeAction('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to toggle appointment type');
    });

    it('should throw validation error for whitespace-only ID', async () => {
      const result = await toggleAppointmentTypeAction('   ');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to toggle appointment type');
    });

    it('should handle appointment type not found', async () => {
      const mockDb = require('@/lib/database').db;
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              all: jest.fn().mockReturnValue([])
            })
          })
        })
      });

      const result = await toggleAppointmentTypeAction('nonexistent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment type not found');
    });
  });

  describe('getAllAppointmentTypesAction', () => {
    it('should get all appointment types successfully', async () => {
      const result = await getAllAppointmentTypesAction();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
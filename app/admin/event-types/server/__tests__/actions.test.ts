import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  createAppointmentTypeAction,
  updateAppointmentTypeAction,
  deleteAppointmentTypeAction,
  getAllAppointmentTypesAction,
  toggleAppointmentTypeAction,
  type CreateAppointmentTypeData,
  type UpdateAppointmentTypeData 
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

    it('should handle errors gracefully', async () => {
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
  });

  describe('deleteAppointmentTypeAction', () => {
    it('should delete an appointment type successfully', async () => {
      const result = await deleteAppointmentTypeAction('test-id');
      
      expect(result.success).toBe(true);
    });
  });

  describe('toggleAppointmentTypeAction', () => {
    it('should toggle an appointment type successfully', async () => {
      const result = await toggleAppointmentTypeAction('test-id');
      
      expect(result.success).toBe(true);
    });
  });

  describe('getAllAppointmentTypesAction', () => {
    it('should get all appointment types successfully', async () => {
      const result = await getAllAppointmentTypesAction();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
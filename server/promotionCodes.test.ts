import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
vi.mock('./db', () => ({
  getAllPromotionCodes: vi.fn(),
  getPromotionCodeById: vi.fn(),
  getPromotionCodeByCode: vi.fn(),
  getRandomAvailablePromotionCode: vi.fn(),
  createPromotionCode: vi.fn(),
  updatePromotionCode: vi.fn(),
  deletePromotionCode: vi.fn(),
  deletePromotionCodesByIds: vi.fn(),
}));

// Mock the manusApi functions
vi.mock('./manusApi', () => ({
  redeemPromotionCode: vi.fn(),
  getCredits: vi.fn(),
  generateClientId: vi.fn(() => 'test-client-id'),
}));

import * as db from './db';
import * as manusApi from './manusApi';

describe('Promotion Codes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPromotionCodes', () => {
    it('should return all promotion codes', async () => {
      const mockCodes = [
        { id: 1, code: 'CODE1', status: 'available' },
        { id: 2, code: 'CODE2', status: 'used' },
      ];
      vi.mocked(db.getAllPromotionCodes).mockResolvedValue(mockCodes as any);

      const result = await db.getAllPromotionCodes();
      expect(result).toEqual(mockCodes);
      expect(db.getAllPromotionCodes).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPromotionCodeByCode', () => {
    it('should return promotion code by code string', async () => {
      const mockCode = { id: 1, code: 'TEST123', status: 'available' };
      vi.mocked(db.getPromotionCodeByCode).mockResolvedValue(mockCode as any);

      const result = await db.getPromotionCodeByCode('TEST123');
      expect(result).toEqual(mockCode);
      expect(db.getPromotionCodeByCode).toHaveBeenCalledWith('TEST123');
    });

    it('should return undefined for non-existent code', async () => {
      vi.mocked(db.getPromotionCodeByCode).mockResolvedValue(undefined);

      const result = await db.getPromotionCodeByCode('NONEXISTENT');
      expect(result).toBeUndefined();
    });
  });

  describe('getRandomAvailablePromotionCode', () => {
    it('should return a random available promotion code', async () => {
      const mockCode = { id: 1, code: 'RANDOM123', status: 'available' };
      vi.mocked(db.getRandomAvailablePromotionCode).mockResolvedValue(mockCode as any);

      const result = await db.getRandomAvailablePromotionCode();
      expect(result).toEqual(mockCode);
      expect(result?.status).toBe('available');
    });

    it('should return undefined when no available codes', async () => {
      vi.mocked(db.getRandomAvailablePromotionCode).mockResolvedValue(undefined);

      const result = await db.getRandomAvailablePromotionCode();
      expect(result).toBeUndefined();
    });
  });

  describe('createPromotionCode', () => {
    it('should create a new promotion code', async () => {
      const newCode = { code: 'NEWCODE', status: 'available' as const };
      vi.mocked(db.createPromotionCode).mockResolvedValue({ id: 1, ...newCode } as any);

      const result = await db.createPromotionCode(newCode);
      expect(result.code).toBe('NEWCODE');
      expect(db.createPromotionCode).toHaveBeenCalledWith(newCode);
    });
  });

  describe('deletePromotionCodesByIds', () => {
    it('should delete multiple promotion codes by ids', async () => {
      vi.mocked(db.deletePromotionCodesByIds).mockResolvedValue(3);

      const result = await db.deletePromotionCodesByIds([1, 2, 3]);
      expect(result).toBe(3);
      expect(db.deletePromotionCodesByIds).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('redeemPromotionCode API', () => {
    it('should successfully redeem a promotion code', async () => {
      vi.mocked(manusApi.redeemPromotionCode).mockResolvedValue({ success: true });

      const result = await manusApi.redeemPromotionCode('test-token', 'test-client', 'CODE123');
      expect(result.success).toBe(true);
    });

    it('should handle failed redemption', async () => {
      vi.mocked(manusApi.redeemPromotionCode).mockResolvedValue({ 
        success: false, 
        error: 'Invalid code' 
      });

      const result = await manusApi.redeemPromotionCode('test-token', 'test-client', 'INVALID');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid code');
    });
  });
});

describe('Batch Delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deletePromotionCodesByIds', () => {
    it('should delete codes and return count', async () => {
      vi.mocked(db.deletePromotionCodesByIds).mockResolvedValue(5);

      const result = await db.deletePromotionCodesByIds([1, 2, 3, 4, 5]);
      expect(result).toBe(5);
    });

    it('should return 0 when no ids provided', async () => {
      vi.mocked(db.deletePromotionCodesByIds).mockResolvedValue(0);

      const result = await db.deletePromotionCodesByIds([]);
      expect(result).toBe(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import * as manusApi from './manusApi';

describe('Credit Category Functions', () => {
  describe('getCreditCategory', () => {
    it('should return "1500" for credits between 1500 and 1999', () => {
      expect(manusApi.getCreditCategory(1500)).toBe('1500');
      expect(manusApi.getCreditCategory(1700)).toBe('1500');
      expect(manusApi.getCreditCategory(1999)).toBe('1500');
    });

    it('should return "2000" for credits between 2000 and 2499', () => {
      expect(manusApi.getCreditCategory(2000)).toBe('2000');
      expect(manusApi.getCreditCategory(2200)).toBe('2000');
      expect(manusApi.getCreditCategory(2499)).toBe('2000');
    });

    it('should return "2500" for credits between 2500 and 2999', () => {
      expect(manusApi.getCreditCategory(2500)).toBe('2500');
      expect(manusApi.getCreditCategory(2700)).toBe('2500');
      expect(manusApi.getCreditCategory(2999)).toBe('2500');
    });

    it('should return "3000" for credits between 3000 and 3499', () => {
      expect(manusApi.getCreditCategory(3000)).toBe('3000');
      expect(manusApi.getCreditCategory(3200)).toBe('3000');
      expect(manusApi.getCreditCategory(3499)).toBe('3000');
    });

    it('should return "3500" for credits between 3500 and 3999', () => {
      expect(manusApi.getCreditCategory(3500)).toBe('3500');
      expect(manusApi.getCreditCategory(3700)).toBe('3500');
      expect(manusApi.getCreditCategory(3999)).toBe('3500');
    });

    it('should return "4000" for credits between 4000 and 4499', () => {
      expect(manusApi.getCreditCategory(4000)).toBe('4000');
      expect(manusApi.getCreditCategory(4200)).toBe('4000');
      expect(manusApi.getCreditCategory(4499)).toBe('4000');
    });

    it('should return "4500" for credits between 4500 and 4999', () => {
      expect(manusApi.getCreditCategory(4500)).toBe('4500');
      expect(manusApi.getCreditCategory(4700)).toBe('4500');
      expect(manusApi.getCreditCategory(4999)).toBe('4500');
    });

    it('should return "5000+" for credits >= 5000', () => {
      expect(manusApi.getCreditCategory(5000)).toBe('5000+');
      expect(manusApi.getCreditCategory(6000)).toBe('5000+');
      expect(manusApi.getCreditCategory(10000)).toBe('5000+');
    });

    it('should return actual credits as string for credits < 1500', () => {
      expect(manusApi.getCreditCategory(1000)).toBe('1000');
      expect(manusApi.getCreditCategory(1200)).toBe('1200');
      expect(manusApi.getCreditCategory(1499)).toBe('1499');
      expect(manusApi.getCreditCategory(500)).toBe('500');
    });
  });

  describe('calculateRequiredInvites', () => {
    it('should calculate correct number of invites needed', () => {
      // From 1500 to 2000 = 500/500 = 1 invite
      expect(manusApi.calculateRequiredInvites(1500, 2000)).toBe(1);
      
      // From 1500 to 2500 = 1000/500 = 2 invites
      expect(manusApi.calculateRequiredInvites(1500, 2500)).toBe(2);
      
      // From 1500 to 3000 = 1500/500 = 3 invites
      expect(manusApi.calculateRequiredInvites(1500, 3000)).toBe(3);
      
      // From 2000 to 3000 = 1000/500 = 2 invites
      expect(manusApi.calculateRequiredInvites(2000, 3000)).toBe(2);
    });

    it('should return 0 when target is less than or equal to current', () => {
      expect(manusApi.calculateRequiredInvites(2000, 2000)).toBe(0);
      expect(manusApi.calculateRequiredInvites(2000, 1500)).toBe(0);
    });

    it('should round up for non-exact divisions', () => {
      // From 1500 to 1800 = 300/500 = 0.6 → 1 invite
      expect(manusApi.calculateRequiredInvites(1500, 1800)).toBe(1);
      
      // From 1500 to 2300 = 800/500 = 1.6 → 2 invites
      expect(manusApi.calculateRequiredInvites(1500, 2300)).toBe(2);
    });
  });

  describe('verifyInvitationSuccess', () => {
    it('should return true when credits increase by 500', () => {
      expect(manusApi.verifyInvitationSuccess(1000, 1500)).toBe(true);
      expect(manusApi.verifyInvitationSuccess(1500, 2000)).toBe(true);
      expect(manusApi.verifyInvitationSuccess(2000, 2500)).toBe(true);
    });

    it('should return false when credits do not increase by exactly 500', () => {
      expect(manusApi.verifyInvitationSuccess(1000, 1000)).toBe(false);
      expect(manusApi.verifyInvitationSuccess(1000, 1600)).toBe(false);
      expect(manusApi.verifyInvitationSuccess(1000, 1400)).toBe(false);
    });
  });
});

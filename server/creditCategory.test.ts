import { describe, it, expect } from 'vitest';
import * as manusApi from './manusApi';

describe('Credit Category Functions', () => {
  describe('getCreditCategory', () => {
    it('should return "1800" for credits between 1800 and 2299', () => {
      expect(manusApi.getCreditCategory(1800)).toBe('1800');
      expect(manusApi.getCreditCategory(2000)).toBe('1800');
      expect(manusApi.getCreditCategory(2299)).toBe('1800');
    });

    it('should return "2300" for credits between 2300 and 2799', () => {
      expect(manusApi.getCreditCategory(2300)).toBe('2300');
      expect(manusApi.getCreditCategory(2500)).toBe('2300');
      expect(manusApi.getCreditCategory(2799)).toBe('2300');
    });

    it('should return "2800" for credits between 2800 and 3299', () => {
      expect(manusApi.getCreditCategory(2800)).toBe('2800');
      expect(manusApi.getCreditCategory(3000)).toBe('2800');
      expect(manusApi.getCreditCategory(3299)).toBe('2800');
    });

    it('should return "3300" for credits between 3300 and 3799', () => {
      expect(manusApi.getCreditCategory(3300)).toBe('3300');
      expect(manusApi.getCreditCategory(3500)).toBe('3300');
      expect(manusApi.getCreditCategory(3799)).toBe('3300');
    });

    it('should return "3800" for credits between 3800 and 4299', () => {
      expect(manusApi.getCreditCategory(3800)).toBe('3800');
      expect(manusApi.getCreditCategory(4000)).toBe('3800');
      expect(manusApi.getCreditCategory(4299)).toBe('3800');
    });

    it('should return "4300" for credits between 4300 and 4799', () => {
      expect(manusApi.getCreditCategory(4300)).toBe('4300');
      expect(manusApi.getCreditCategory(4500)).toBe('4300');
      expect(manusApi.getCreditCategory(4799)).toBe('4300');
    });

    it('should return "4800" for credits between 4800 and 5299', () => {
      expect(manusApi.getCreditCategory(4800)).toBe('4800');
      expect(manusApi.getCreditCategory(5000)).toBe('4800');
      expect(manusApi.getCreditCategory(5299)).toBe('4800');
    });

    it('should return "5300+" for credits >= 5300', () => {
      expect(manusApi.getCreditCategory(5300)).toBe('5300+');
      expect(manusApi.getCreditCategory(6000)).toBe('5300+');
      expect(manusApi.getCreditCategory(10000)).toBe('5300+');
    });

    it('should return actual credits as string for credits < 1800', () => {
      expect(manusApi.getCreditCategory(1000)).toBe('1000');
      expect(manusApi.getCreditCategory(1500)).toBe('1500');
      expect(manusApi.getCreditCategory(1799)).toBe('1799');
      expect(manusApi.getCreditCategory(500)).toBe('500');
    });
  });

  describe('calculateRequiredInvites', () => {
    it('should calculate correct number of invites needed', () => {
      // From 1800 to 2300 = 500/500 = 1 invite
      expect(manusApi.calculateRequiredInvites(1800, 2300)).toBe(1);
      
      // From 1800 to 2800 = 1000/500 = 2 invites
      expect(manusApi.calculateRequiredInvites(1800, 2800)).toBe(2);
      
      // From 1800 to 3300 = 1500/500 = 3 invites
      expect(manusApi.calculateRequiredInvites(1800, 3300)).toBe(3);
      
      // From 2300 to 3300 = 1000/500 = 2 invites
      expect(manusApi.calculateRequiredInvites(2300, 3300)).toBe(2);
    });

    it('should return 0 when target is less than or equal to current', () => {
      expect(manusApi.calculateRequiredInvites(2300, 2300)).toBe(0);
      expect(manusApi.calculateRequiredInvites(2300, 1800)).toBe(0);
    });

    it('should round up for non-exact divisions', () => {
      // From 1800 to 2100 = 300/500 = 0.6 → 1 invite
      expect(manusApi.calculateRequiredInvites(1800, 2100)).toBe(1);
      
      // From 1800 to 2600 = 800/500 = 1.6 → 2 invites
      expect(manusApi.calculateRequiredInvites(1800, 2600)).toBe(2);
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

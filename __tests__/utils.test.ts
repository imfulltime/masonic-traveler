import {
  calculateDistance,
  generateObfuscatedHandle,
  formatDate,
  formatTime,
  isWithinNext7Days,
  calculateScore,
  isValidEmail,
  getUserDisplayLabel,
} from '@/lib/utils';

describe('Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const coord1 = { lat: 40.7128, lng: -74.0060 }; // New York
      const coord2 = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
      
      const distance = calculateDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(3900); // Approximately 3944 km
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same coordinates', () => {
      const coord = { lat: 40.7128, lng: -74.0060 };
      const distance = calculateDistance(coord, coord);
      expect(distance).toBe(0);
    });
  });

  describe('generateObfuscatedHandle', () => {
    it('should generate handle with first initial and lodge abbreviation', () => {
      const handle = generateObfuscatedHandle('John', 'San Francisco Lodge');
      expect(handle).toMatch(/^JSF\d{3}$/);
    });

    it('should handle single word lodge names', () => {
      const handle = generateObfuscatedHandle('Robert', 'Harmony');
      expect(handle).toMatch(/^RHar\d{3}$/);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatTime(date);
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });
  });

  describe('isWithinNext7Days', () => {
    it('should return true for dates within next 7 days', () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      expect(isWithinNext7Days(futureDate)).toBe(true);
    });

    it('should return false for dates beyond 7 days', () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
      expect(isWithinNext7Days(futureDate)).toBe(false);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      expect(isWithinNext7Days(pastDate)).toBe(false);
    });
  });

  describe('calculateScore', () => {
    it('should calculate score with default weights', () => {
      const score = calculateScore(5, 3);
      expect(score).toBe(11); // 5*1 + 3*2 = 11
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('getUserDisplayLabel', () => {
    it('should show first name and lodge when connected', () => {
      const user = { first_name: 'John', obfuscated_handle: 'JDoe123' };
      const lodge = { name: 'San Francisco Lodge' };
      
      const label = getUserDisplayLabel(user, lodge, true);
      expect(label).toBe('John from San Francisco Lodge');
    });

    it('should show generic label when not connected', () => {
      const user = { first_name: 'John', obfuscated_handle: 'JDoe123' };
      const lodge = { name: 'San Francisco Lodge' };
      
      const label = getUserDisplayLabel(user, lodge, false);
      expect(label).toBe('Brother from San Francisco Lodge');
    });

    it('should fallback to obfuscated handle', () => {
      const user = { first_name: null, obfuscated_handle: 'JDoe123' };
      
      const label = getUserDisplayLabel(user, null, false);
      expect(label).toBe('JDoe123');
    });
  });
});

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LocationCoords, FuzzedLocation } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random offset for location fuzzing
 */
export function generateFuzzOffset(): { lat: number; lng: number; radius: number } {
  const minMeters = parseInt(process.env.FUZZ_MIN_METERS || '250');
  const maxMeters = parseInt(process.env.FUZZ_MAX_METERS || '500');
  
  // Random distance between min and max
  const distance = minMeters + Math.random() * (maxMeters - minMeters);
  
  // Random angle
  const angle = Math.random() * 2 * Math.PI;
  
  // Convert to lat/lng offset (approximate, good enough for fuzzing)
  const latOffset = (distance * Math.cos(angle)) / 111000; // ~111km per degree latitude
  const lngOffset = (distance * Math.sin(angle)) / (111000 * Math.cos(latOffset));
  
  return {
    lat: latOffset,
    lng: lngOffset,
    radius: distance,
  };
}

/**
 * Apply fuzzing to coordinates server-side only
 */
export function fuzzCoordinates(coords: LocationCoords): FuzzedLocation {
  const offset = generateFuzzOffset();
  
  return {
    lat: coords.lat + offset.lat,
    lng: coords.lng + offset.lng,
    fuzz_radius_m: offset.radius,
  };
}

/**
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(
  coord1: LocationCoords,
  coord2: LocationCoords
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate obfuscated handle for user privacy
 */
export function generateObfuscatedHandle(firstName: string, lodgeName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lodgeWords = lodgeName.split(' ');
  const lodgeShort = lodgeWords.length > 1 
    ? lodgeWords.map(w => w.charAt(0)).join('')
    : lodgeName.substring(0, 3);
  
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${firstInitial}${lodgeShort}${randomSuffix}`;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Check if a date is within the next 7 days
 */
export function isWithinNext7Days(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return d >= now && d <= sevenDaysFromNow;
}

/**
 * Calculate leaderboard score
 */
export function calculateScore(visits: number, charity: number): number {
  const visitWeight = parseInt(process.env.LEADERBOARD_SCORE_VISIT_WEIGHT || '1');
  const charityWeight = parseInt(process.env.LEADERBOARD_SCORE_CHARITY_WEIGHT || '2');
  
  return visits * visitWeight + charity * charityWeight;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a display label for a user (privacy-safe)
 */
export function getUserDisplayLabel(
  user: { first_name?: string | null; obfuscated_handle?: string | null },
  lodge?: { name: string } | null,
  isConnected: boolean = false
): string {
  if (isConnected && user.first_name && lodge) {
    return `${user.first_name} from ${lodge.name}`;
  }
  
  if (lodge) {
    return `Brother from ${lodge.name}`;
  }
  
  return user.obfuscated_handle || 'Anonymous Brother';
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

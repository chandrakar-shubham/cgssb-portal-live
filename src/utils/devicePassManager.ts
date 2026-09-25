import { User } from '../types';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
}

/**
 * Gets or creates a persistent device ID in localStorage and detects device type.
 */
export function getOrCreateDeviceId(): DeviceInfo {
  let id = '';
  try {
    id = localStorage.getItem('cgssb_device_id') || '';
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem('cgssb_device_id', id);
    }
  } catch {
    id = 'dev-fallback-' + Date.now();
  }

  let name = 'Web Browser Device';
  let platform = 'Browser';

  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      name = 'Android Smartphone';
      platform = 'Android';
    } else if (/iphone/i.test(ua)) {
      name = 'Apple iPhone';
      platform = 'iOS';
    } else if (/ipad/i.test(ua)) {
      name = 'Apple iPad';
      platform = 'iPadOS';
    } else if (/windows/i.test(ua)) {
      name = 'Windows PC / Laptop';
      platform = 'Windows';
    } else if (/macintosh|mac os x/i.test(ua)) {
      name = 'MacBook / macOS';
      platform = 'macOS';
    } else if (/linux/i.test(ua)) {
      name = 'Linux Workstation';
      platform = 'Linux';
    }
  }

  return { id, name, platform };
}

/**
 * Computes the remaining days for an active pass.
 * Returns 0 if expired or not set.
 */
export function calculateDaysRemaining(expiresAt?: string): number {
  if (!expiresAt) return 0;
  try {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const diffMs = expiryTime - now;
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Checks if a user has an active pass with remaining validity.
 */
export function isUserPassActive(user?: User | null): boolean {
  if (!user || !user.hasProPass) return false;
  // If user has passExpiresAt, check if days remaining > 0
  if (user.passExpiresAt) {
    return calculateDaysRemaining(user.passExpiresAt) > 0;
  }
  // Fallback for legacy user accounts that had hasProPass set
  return Boolean(user.hasProPass);
}

/**
 * Checks device authorization for "One Device, One Pass".
 */
export function checkDeviceAuthorization(user?: User | null): {
  isAuthorized: boolean;
  currentDevice: DeviceInfo;
  boundDeviceId?: string;
  boundDeviceName?: string;
  needsTransfer: boolean;
} {
  const currentDevice = getOrCreateDeviceId();

  if (!user || !user.hasProPass) {
    return {
      isAuthorized: true,
      currentDevice,
      needsTransfer: false,
    };
  }

  // If user has not yet bound any device, current device is authorized
  if (!user.boundDeviceId) {
    return {
      isAuthorized: true,
      currentDevice,
      boundDeviceId: currentDevice.id,
      boundDeviceName: currentDevice.name,
      needsTransfer: false,
    };
  }

  // If bound device matches current device
  if (user.boundDeviceId === currentDevice.id) {
    return {
      isAuthorized: true,
      currentDevice,
      boundDeviceId: user.boundDeviceId,
      boundDeviceName: user.boundDeviceName,
      needsTransfer: false,
    };
  }

  // Different device detected!
  return {
    isAuthorized: false,
    currentDevice,
    boundDeviceId: user.boundDeviceId,
    boundDeviceName: user.boundDeviceName || 'Previous Device',
    needsTransfer: true,
  };
}

/**
 * Creates pass tenure expiry timestamps.
 */
export function createPassTenure(planType: 'monthly' | 'yearly'): {
  expiresAt: string;
  days: number;
  label: string;
  price: number;
  originalPrice: number;
} {
  const days = planType === 'monthly' ? 30 : 365;
  const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  return {
    expiresAt: expiry,
    days,
    label: planType === 'monthly' ? '30 Days Monthly Pass' : '365 Days Yearly Pass',
    price: planType === 'monthly' ? 199 : 599,
    originalPrice: planType === 'monthly' ? 299 : 1199,
  };
}

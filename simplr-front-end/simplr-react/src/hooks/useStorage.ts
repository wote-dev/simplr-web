import { useState, useCallback } from 'react';
import type { UseStorageReturn, StorageQuota } from '@/types';

export function useStorage(): UseStorageReturn {
  const [error, setError] = useState<string | null>(null);
  const [isAvailable] = useState(() => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  });

  const saveData = useCallback(async <T>(key: string, data: T): Promise<void> => {
    if (!isAvailable) {
      throw new Error('Local storage is not available');
    }

    try {
      setError(null);
      const serializedData = JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
      
      localStorage.setItem(key, serializedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAvailable]);

  const loadData = useCallback(<T>(key: string): T | null => {
    if (!isAvailable) {
      setError('Local storage is not available');
      return null;
    }

    try {
      setError(null);
      const item = localStorage.getItem(key);
      
      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item);
      
      // Handle legacy data format (direct data without metadata)
      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        return parsed.data as T;
      }
      
      // Return legacy format as-is
      return parsed as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error(`Failed to load data for key "${key}":`, err);
      return null;
    }
  }, [isAvailable]);

  const clearData = useCallback((key: string): void => {
    if (!isAvailable) {
      setError('Local storage is not available');
      return;
    }

    try {
      setError(null);
      localStorage.removeItem(key);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      console.error(`Failed to clear data for key "${key}":`, err);
    }
  }, [isAvailable]);

  const getQuota = useCallback((): StorageQuota => {
    if (!isAvailable) {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      let used = 0;
      
      // Calculate used storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }

      // Estimate total available storage (typically 5-10MB)
      // We'll use a conservative estimate of 5MB
      const total = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = Math.round((used / total) * 100);

      return {
        used,
        total,
        percentage: Math.min(percentage, 100), // Cap at 100%
      };
    } catch (err) {
      console.error('Failed to calculate storage quota:', err);
      return { used: 0, total: 0, percentage: 0 };
    }
  }, [isAvailable]);

  return {
    saveData,
    loadData,
    clearData,
    getQuota,
    isAvailable,
    error,
  };
}

// Utility functions for common storage operations
export const storageKeys = {
  TASKS: 'simplr_tasks',
  USER_PREFERENCES: 'simplr_preferences',
  THEME: 'theme',
  USER: 'user',
  AUTH_TYPE: 'authType',
  APPLE_AUTH_DATA: 'appleAuthData',
  BACKUP_PREFIX: 'simplr_backup_',
} as const;

export type StorageKey = typeof storageKeys[keyof typeof storageKeys];

// Helper function to create backup keys
export function createBackupKey(timestamp: string): string {
  return `${storageKeys.BACKUP_PREFIX}${timestamp}`;
}

// Helper function to get all backup keys
export function getBackupKeys(): string[] {
  const keys: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(storageKeys.BACKUP_PREFIX)) {
        keys.push(key);
      }
    }
  } catch (err) {
    console.error('Failed to get backup keys:', err);
  }
  
  return keys.sort(); // Sort chronologically
}
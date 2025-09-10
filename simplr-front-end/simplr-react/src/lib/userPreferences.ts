import { supabase } from './supabase';
import type { SortOption } from '@/hooks/useTasks';

export interface UserPreferences {
  viewMode: 'grid' | 'categories';
  sortBy: SortOption;
  currentView?: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  viewMode: 'grid',
  sortBy: 'latest',
};

const PREFERENCES_STORAGE_KEY = 'simplr_user_preferences';

export class UserPreferencesService {
  /**
   * Load user preferences from Supabase for authenticated users or localStorage for guests
   */
  static async loadPreferences(userId?: string): Promise<UserPreferences> {
    try {
      if (userId) {
        // Load from Supabase for authenticated users
        const { data, error } = await supabase
          .from('user_profiles')
          .select('preferences')
          .eq('id', userId)
          .single();

        if (error) {
          console.warn('Failed to load preferences from Supabase:', error.message);
          // Fall back to localStorage
          return this.loadFromLocalStorage();
        }

        if (data?.preferences) {
          // Merge with defaults to ensure all required fields exist
          return {
            ...DEFAULT_PREFERENCES,
            ...data.preferences,
          } as UserPreferences;
        }
      }

      // Fall back to localStorage for guest users or when Supabase fails
      return this.loadFromLocalStorage();
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return this.loadFromLocalStorage();
    }
  }

  /**
   * Save user preferences to Supabase for authenticated users or localStorage for guests
   */
  static async savePreferences(preferences: UserPreferences, userId?: string): Promise<void> {
    try {
      // Always save to localStorage as backup
      this.saveToLocalStorage(preferences);

      if (userId) {
        // Save to Supabase for authenticated users
        const { error } = await supabase
          .from('user_profiles')
          .update({
            preferences: preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.warn('Failed to save preferences to Supabase:', error.message);
          // Don't throw error, localStorage backup is sufficient
        }
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
      // Don't throw error, localStorage backup should work
    }
  }

  /**
   * Update a specific preference field
   */
  static async updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
    userId?: string
  ): Promise<void> {
    try {
      const currentPreferences = await this.loadPreferences(userId);
      const updatedPreferences = {
        ...currentPreferences,
        [key]: value,
      };
      await this.savePreferences(updatedPreferences, userId);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private static loadFromLocalStorage(): UserPreferences {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
        };
      }
    } catch (error) {
      console.error('Error parsing preferences from localStorage:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  /**
   * Save preferences to localStorage
   */
  private static saveToLocalStorage(preferences: UserPreferences): void {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }

  /**
   * Clear all preferences (useful for sign out)
   */
  static clearPreferences(): void {
    try {
      localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing preferences:', error);
    }
  }
}
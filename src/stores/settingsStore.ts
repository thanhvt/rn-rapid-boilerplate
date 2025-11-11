/**
 * Mục đích: Zustand store cho Settings/Preferences state management
 * Tham số vào: Không (global state)
 * Tham số ra: Store hooks
 * Khi nào dùng: Quản lý cài đặt ứng dụng
 */

import {create} from 'zustand';
import {Preferences} from '@/types/alarmNote';
import * as prefsRepo from '@/repositories/preferencesRepository';

interface SettingsState extends Preferences {
  loading: boolean;
  error: string | null;

  // Actions
  loadPreferences: () => Promise<void>;
  setSnoozeMinutes: (minutes: number) => Promise<void>;
  setTimezone: (timezone: string) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Default values
  snoozeMinutesDefault: 10,
  timezone: 'Asia/Ho_Chi_Minh',
  onboardingCompleted: false,
  loading: false,
  error: null,

  /**
   * Mục đích: Load tất cả preferences từ DB
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: Khởi tạo app
   */
  loadPreferences: async () => {
    set({loading: true, error: null});
    try {
      const prefs = await prefsRepo.getAllPreferences();
      set({
        ...prefs,
        loading: false,
      });
      console.log('[SettingsStore] Load preferences thành công');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[SettingsStore] Lỗi load preferences:', error);
    }
  },

  /**
   * Mục đích: Cập nhật snooze minutes mặc định
   * Tham số vào: minutes (number)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Người dùng thay đổi cài đặt snooze
   */
  setSnoozeMinutes: async (minutes: number) => {
    try {
      await prefsRepo.setPreference('snoozeMinutesDefault', minutes);
      set({snoozeMinutesDefault: minutes});
      console.log('[SettingsStore] Cập nhật snooze minutes:', minutes);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg});
      console.error('[SettingsStore] Lỗi cập nhật snooze minutes:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Cập nhật timezone
   * Tham số vào: timezone (string)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Người dùng thay đổi timezone (hiếm khi)
   */
  setTimezone: async (timezone: string) => {
    try {
      await prefsRepo.setPreference('timezone', timezone);
      set({timezone});
      console.log('[SettingsStore] Cập nhật timezone:', timezone);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg});
      console.error('[SettingsStore] Lỗi cập nhật timezone:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Đánh dấu onboarding đã hoàn thành
   * Tham số vào: completed (boolean)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Sau khi người dùng hoàn thành onboarding
   */
  setOnboardingCompleted: async (completed: boolean) => {
    try {
      await prefsRepo.setPreference('onboardingCompleted', completed);
      set({onboardingCompleted: completed});
      console.log('[SettingsStore] Cập nhật onboarding completed:', completed);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg});
      console.error('[SettingsStore] Lỗi cập nhật onboarding:', error);
      throw error;
    }
  },
}));


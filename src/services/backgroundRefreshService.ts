/**
 * Mục đích: Quản lý background refresh cho notifications
 * Tham số vào: App state changes từ React Native AppState
 * Tham số ra: Reschedule notifications tự động
 * Khi nào dùng: Khi app chuyển từ foreground sang background
 */

import {AppState, AppStateStatus} from 'react-native';
import {useAlarmsStore} from '@/stores/alarmsStore';
import {useNotesStore} from '@/stores/notesStore';
import {
  scheduleAlarmNotification,
  cancelAlarmNotification,
} from './notificationService';

// Subscription để cleanup sau này
let appStateSubscription: any = null;

// Track app state hiện tại
let currentAppState: AppStateStatus = AppState.currentState;

/**
 * Mục đích: Khởi tạo background refresh listener
 * Tham số vào: Không
 * Tham số ra: Cleanup function để remove listener
 * Khi nào dùng: Khi app mount (trong App.tsx useEffect)
 */
export function initBackgroundRefresh(): () => void {
  console.log('[BackgroundRefresh] Khởi tạo listener');
  console.log('[BackgroundRefresh] App state hiện tại:', currentAppState);

  // Đăng ký listener cho app state changes
  appStateSubscription = AppState.addEventListener(
    'change',
    handleAppStateChange,
  );

  // Return cleanup function
  return () => {
    if (appStateSubscription) {
      appStateSubscription.remove();
      console.log('[BackgroundRefresh] Đã cleanup listener');
    }
  };
}

/**
 * Mục đích: Xử lý khi app state thay đổi
 * Tham số vào: nextAppState (AppStateStatus) - 'active' | 'background' | 'inactive'
 * Tham số ra: void
 * Khi nào dùng: Callback tự động từ AppState listener
 */
async function handleAppStateChange(nextAppState: AppStateStatus) {
  console.log(
    `[BackgroundRefresh] App state: ${currentAppState} → ${nextAppState}`,
  );

  // Detect transition: active → background
  if (currentAppState === 'active' && nextAppState === 'background') {
    console.log(
      '[BackgroundRefresh] ⚠️ App vào background, bắt đầu reschedule...',
    );

    // Reschedule tất cả alarms
    // iOS cho ~30 giây để chạy code, phải nhanh!
    await rescheduleAllAlarms();
  }

  // Detect transition: background → active
  if (currentAppState.match(/background|inactive/) && nextAppState === 'active') {
    console.log('[BackgroundRefresh] ✅ App vào foreground');

    // Optional: Check và reschedule nếu cần
    // Ví dụ: Nếu có alarms đã fire mà chưa reschedule
    await checkAndRescheduleIfNeeded();
  }

  // Update current state
  currentAppState = nextAppState;
}

/**
 * Mục đích: Reschedule tất cả alarms enabled
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi app vào background hoặc khi cần refresh notifications
 */
async function rescheduleAllAlarms(): Promise<void> {
  try {
    const startTime = Date.now();
    console.log('[BackgroundRefresh] 🔄 Bắt đầu reschedule tất cả alarms...');

    // Lấy tất cả alarms enabled từ store
    await useAlarmsStore.getState().loadAllEnabledAlarms();
    const alarms = useAlarmsStore.getState().alarms.filter(a => a.enabled);
    console.log(
      `[BackgroundRefresh] 📋 Tìm thấy ${alarms.length} alarms enabled`,
    );

    if (alarms.length === 0) {
      console.log('[BackgroundRefresh] ℹ️ Không có alarms nào cần reschedule');
      return;
    }

    // Lấy notes store để có title
    const notesStore = useNotesStore.getState();

    // Counter để track progress
    let successCount = 0;
    let errorCount = 0;

    // Reschedule từng alarm
    for (const alarm of alarms) {
      try {
        // 1. Cancel notification cũ (nếu có)
        await cancelAlarmNotification(alarm.id);

        // 2. Lấy note title và content
        const note = notesStore.getNoteById(alarm.noteId);
        const noteTitle = note?.title || 'Báo thức';
        const noteContent = note?.content || null;

        // 3. Schedule lại với logic mới (7 ngày tới)
        await scheduleAlarmNotification(alarm, noteTitle, noteContent);

        successCount++;
        console.log(
          `[BackgroundRefresh] ✅ Reschedule alarm: ${alarm.id} (${successCount}/${alarms.length})`,
        );
      } catch (error) {
        errorCount++;
        console.error(
          `[BackgroundRefresh] ❌ Lỗi reschedule alarm ${alarm.id}:`,
          error,
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[BackgroundRefresh] 🎉 Hoàn thành reschedule: ${successCount} thành công, ${errorCount} lỗi, trong ${duration}ms`,
    );

    // Warning nếu quá chậm (iOS limit ~30 giây)
    if (duration > 25000) {
      console.warn(
        `[BackgroundRefresh] ⚠️ Reschedule mất ${duration}ms, gần đạt iOS limit (30s)!`,
      );
    }
  } catch (error) {
    console.error('[BackgroundRefresh] ❌ Lỗi reschedule all alarms:', error);
  }
}

/**
 * Mục đích: Check và reschedule nếu cần khi app vào foreground
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi app chuyển từ background sang foreground
 */
async function checkAndRescheduleIfNeeded(): Promise<void> {
  try {
    console.log('[BackgroundRefresh] 🔍 Kiểm tra alarms cần reschedule...');

    // Lấy tất cả alarms enabled
    await useAlarmsStore.getState().loadAllEnabledAlarms();
    const alarms = useAlarmsStore.getState().alarms.filter(a => a.enabled);

    // Check xem có alarms nào đã fire mà chưa reschedule không
    const now = Date.now();
    const alarmsNeedAction = alarms.filter(alarm => {
      // Nếu nextFireAt đã qua (alarm đã fire)
      if (alarm.nextFireAt && alarm.nextFireAt < now) {
        return true;
      }
      return false;
    });

    if (alarmsNeedAction.length > 0) {
      console.log(
        `[BackgroundRefresh] ⚠️ Tìm thấy ${alarmsNeedAction.length} alarms đã qua`,
      );

      // Xử lý từng alarm
      const alarmsStore = useAlarmsStore.getState();
      for (const alarm of alarmsNeedAction) {
        if (alarm.type === 'ONE_TIME') {
          // ONE_TIME alarm đã qua → disable nó
          console.log(`[BackgroundRefresh] 🔕 Disable ONE_TIME alarm đã qua: ${alarm.id}`);
          await alarmsStore.toggleAlarmEnabled(alarm.id, false);
          await cancelAlarmNotification(alarm.id);
        } else if (alarm.type === 'REPEATING') {
          // REPEATING alarm → reschedule (sẽ tính lần kêu tiếp theo)
          console.log(`[BackgroundRefresh] 🔄 Reschedule REPEATING alarm: ${alarm.id}`);
          // Reschedule sẽ được xử lý bởi rescheduleAllAlarms
        }
      }

      // Reschedule các REPEATING alarms
      const repeatingAlarms = alarmsNeedAction.filter(a => a.type === 'REPEATING');
      if (repeatingAlarms.length > 0) {
        await rescheduleAllAlarms();
      }
    } else {
      console.log('[BackgroundRefresh] ✅ Tất cả alarms đều OK');
    }
  } catch (error) {
    console.error(
      '[BackgroundRefresh] ❌ Lỗi check and reschedule:',
      error,
    );
  }
}

/**
 * Mục đích: Force reschedule tất cả alarms (manual trigger)
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi user tap button "Refresh Notifications" trong Settings
 */
export async function forceRescheduleAll(): Promise<void> {
  console.log('[BackgroundRefresh] 🔧 Force reschedule (manual trigger)');
  await rescheduleAllAlarms();
}

/**
 * Mục đích: Get app state hiện tại
 * Tham số vào: Không
 * Tham số ra: AppStateStatus
 * Khi nào dùng: Khi cần check app đang foreground hay background
 */
export function getCurrentAppState(): AppStateStatus {
  return currentAppState;
}

/**
 * Mục đích: Check xem app có đang ở foreground không
 * Tham số vào: Không
 * Tham số ra: boolean
 * Khi nào dùng: Trước khi thực hiện task cần app active
 */
export function isAppInForeground(): boolean {
  return currentAppState === 'active';
}

/**
 * Mục đích: Check xem app có đang ở background không
 * Tham số vào: Không
 * Tham số ra: boolean
 * Khi nào dùng: Trước khi thực hiện background task
 */
export function isAppInBackground(): boolean {
  return currentAppState === 'background';
}

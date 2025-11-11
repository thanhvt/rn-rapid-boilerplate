/**
 * Mục đích: Service wrapper cho iOS Notifications Native Module
 * Tham số vào: Alarm data
 * Tham số ra: Promise results
 * Khi nào dùng: Khi cần schedule/cancel notifications
 */

import {NativeModules, NativeEventEmitter, Platform} from 'react-native';
import type {Alarm} from '@/types/alarmNote';

// Native Module (sẽ có khi compile trên iOS với Swift bridge)
const AlarmNoteNotifications = NativeModules.AlarmNoteNotifications || {
  // Mock implementation cho development khi chưa có native module
  requestAuthorization: async () => {
    console.log('[NotificationService] MOCK: requestAuthorization');
    return true;
  },
  setCategories: async () => {
    console.log('[NotificationService] MOCK: setCategories');
  },
  scheduleOneTime: async (payload: any) => {
    console.log('[NotificationService] MOCK: scheduleOneTime', payload);
  },
  scheduleRepeatingWeekly: async (payload: any) => {
    console.log('[NotificationService] MOCK: scheduleRepeatingWeekly', payload);
  },
  cancel: async (id: string) => {
    console.log('[NotificationService] MOCK: cancel', id);
  },
  getPending: async () => {
    console.log('[NotificationService] MOCK: getPending');
    return [];
  },
};

// Event Emitter cho notification events
const eventEmitter =
  Platform.OS === 'ios' && AlarmNoteNotifications
    ? new NativeEventEmitter(AlarmNoteNotifications)
    : null;

/**
 * Mục đích: Xin quyền notifications
 * Tham số vào: Không
 * Tham số ra: Promise<boolean>
 * Khi nào dùng: Onboarding hoặc Settings
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const granted = await AlarmNoteNotifications.requestAuthorization();
    console.log('[NotificationService] Quyền notifications:', granted);
    return granted;
  } catch (error) {
    console.error('[NotificationService] Lỗi xin quyền:', error);
    throw error;
  }
}

/**
 * Mục đích: Đăng ký categories và actions (SNOOZE, DISMISS)
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Sau khi xin quyền thành công
 */
export async function setupNotificationCategories(): Promise<void> {
  try {
    await AlarmNoteNotifications.setCategories();
    console.log('[NotificationService] Đã setup categories');
  } catch (error) {
    console.error('[NotificationService] Lỗi setup categories:', error);
    throw error;
  }
}

/**
 * Mục đích: Schedule notification cho alarm
 * Tham số vào: alarm (Alarm), noteTitle (string)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi tạo/cập nhật alarm enabled
 */
export async function scheduleAlarmNotification(
  alarm: Alarm,
  noteTitle: string,
): Promise<void> {
  try {
    if (alarm.type === 'ONE_TIME') {
      await scheduleOneTimeAlarm(alarm, noteTitle);
    } else if (alarm.type === 'REPEATING') {
      await scheduleRepeatingAlarm(alarm, noteTitle);
    }
    console.log('[NotificationService] Đã schedule alarm:', alarm.id);
  } catch (error) {
    console.error('[NotificationService] Lỗi schedule alarm:', error);
    throw error;
  }
}

/**
 * Mục đích: Schedule ONE_TIME alarm
 * Tham số vào: alarm (Alarm), noteTitle (string)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Internal helper
 */
async function scheduleOneTimeAlarm(
  alarm: Alarm,
  noteTitle: string,
): Promise<void> {
  if (!alarm.nextFireAt) {
    throw new Error('ONE_TIME alarm phải có nextFireAt');
  }

  const payload = {
    id: alarm.id,
    title: noteTitle,
    body: `Báo thức lúc ${alarm.timeHHmm}`,
    timestamp: alarm.nextFireAt,
    noteId: alarm.noteId,
  };

  await AlarmNoteNotifications.scheduleOneTime(payload);
}

/**
 * Mục đích: Schedule REPEATING alarm
 * Tham số vào: alarm (Alarm), noteTitle (string)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Internal helper
 */
async function scheduleRepeatingAlarm(
  alarm: Alarm,
  noteTitle: string,
): Promise<void> {
  if (!alarm.daysOfWeek || alarm.daysOfWeek.length === 0) {
    throw new Error('REPEATING alarm phải có daysOfWeek');
  }

  const [hour, minute] = alarm.timeHHmm.split(':').map(Number);

  const payload = {
    id: alarm.id,
    title: noteTitle,
    body: `Báo thức lặp lúc ${alarm.timeHHmm}`,
    hour,
    minute,
    weekdays: alarm.daysOfWeek,
    noteId: alarm.noteId,
  };

  await AlarmNoteNotifications.scheduleRepeatingWeekly(payload);
}

/**
 * Mục đích: Hủy notification của alarm
 * Tham số vào: alarmId (string)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Xóa alarm hoặc disable
 */
export async function cancelAlarmNotification(alarmId: string): Promise<void> {
  try {
    await AlarmNoteNotifications.cancel(alarmId);
    console.log('[NotificationService] Đã hủy alarm:', alarmId);
  } catch (error) {
    console.error('[NotificationService] Lỗi hủy alarm:', error);
    throw error;
  }
}

/**
 * Mục đích: Lấy danh sách pending notifications (debug)
 * Tham số vào: Không
 * Tham số ra: Promise<string[]>
 * Khi nào dùng: Debug, kiểm tra pending
 */
export async function getPendingNotifications(): Promise<string[]> {
  try {
    const ids = await AlarmNoteNotifications.getPending();
    console.log('[NotificationService] Pending notifications:', ids.length);
    return ids;
  } catch (error) {
    console.error('[NotificationService] Lỗi lấy pending:', error);
    return [];
  }
}

/**
 * Mục đích: Đăng ký listener cho notification actions
 * Tham số vào: callback (function)
 * Tham số ra: Subscription
 * Khi nào dùng: Khởi tạo app để lắng nghe SNOOZE/DISMISS
 */
export function addNotificationActionListener(
  callback: (event: {action: string; alarmId: string; noteId: string}) => void,
) {
  if (!eventEmitter) {
    console.log('[NotificationService] Event emitter không khả dụng (mock mode)');
    return {remove: () => {}};
  }

  const subscription = eventEmitter.addListener('onAlarmAction', callback);
  console.log('[NotificationService] Đã đăng ký action listener');
  return subscription;
}

/**
 * Mục đích: Đăng ký listener cho notification tap
 * Tham số vào: callback (function)
 * Tham số ra: Subscription
 * Khi nào dùng: Khởi tạo app để điều hướng khi tap notification
 */
export function addNotificationTapListener(
  callback: (event: {alarmId: string; noteId: string}) => void,
) {
  if (!eventEmitter) {
    console.log('[NotificationService] Event emitter không khả dụng (mock mode)');
    return {remove: () => {}};
  }

  const subscription = eventEmitter.addListener('onAlarmTapped', callback);
  console.log('[NotificationService] Đã đăng ký tap listener');
  return subscription;
}

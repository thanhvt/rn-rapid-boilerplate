/**
 * Mục đích: Service wrapper cho Notifee Notifications
 * Tham số vào: Alarm data
 * Tham số ra: Promise results
 * Khi nào dùng: Khi cần schedule/cancel notifications
 */

import notifee, {
  TriggerType,
  TimestampTrigger,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import type {Alarm} from '@/types/alarmNote';

console.log('[NotificationService] ✅ Notifee module đã được load');

/**
 * Mục đích: Xin quyền notifications
 * Tham số vào: Không
 * Tham số ra: Promise<boolean>
 * Khi nào dùng: Onboarding hoặc Settings
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    const granted = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
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
    // Tạo notification channel cho Android
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'alarm-note',
        name: 'Alarm Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    // Tạo categories với actions (iOS + Android)
    await notifee.setNotificationCategories([
      {
        id: 'ALARM_NOTE',
        actions: [
          {
            id: 'snooze',
            title: 'Snooze',
            foreground: false,
          },
          {
            id: 'dismiss',
            title: 'Dismiss',
            foreground: false,
            destructive: true,
          },
        ],
      },
    ]);

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
    console.log('[NotificationService] 📅 Bắt đầu schedule alarm:', alarm.id);
    console.log('[NotificationService] Alarm type:', alarm.type);
    console.log('[NotificationService] Note title:', noteTitle);

    if (alarm.type === 'ONE_TIME') {
      await scheduleOneTimeAlarm(alarm, noteTitle);
    } else if (alarm.type === 'REPEATING') {
      await scheduleRepeatingAlarm(alarm, noteTitle);
    }

    console.log('[NotificationService] ✅ Đã schedule alarm thành công:', alarm.id);
  } catch (error) {
    console.error('[NotificationService] ❌ Lỗi schedule alarm:', error);
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

  // Kiểm tra nếu nextFireAt đã qua (trong quá khứ)
  const now = Date.now();
  if (alarm.nextFireAt <= now) {
    console.warn('[NotificationService] ⚠️ nextFireAt đã qua, bỏ qua schedule:', {
      nextFireAt: alarm.nextFireAt,
      nextFireAtDate: new Date(alarm.nextFireAt).toISOString(),
      now: now,
      nowDate: new Date(now).toISOString(),
    });
    // Không throw error, chỉ skip schedule
    return;
  }

  console.log('[NotificationService] 🔔 Schedule ONE_TIME:', {
    id: alarm.id,
    title: noteTitle,
    timestamp: alarm.nextFireAt,
    timestampDate: new Date(alarm.nextFireAt).toISOString(),
  });

  // Tạo trigger timestamp
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: alarm.nextFireAt,
  };

  // Schedule notification
  await notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: noteTitle,
      body: `Báo thức lúc ${alarm.timeHHmm}`,
      data: {
        alarmId: alarm.id,
        noteId: alarm.noteId,
      },
      ios: {
        sound: 'default',
        categoryId: 'ALARM_NOTE',
        critical: true,
        criticalVolume: 1.0,
      },
      android: {
        channelId: 'alarm-note',
        sound: 'default',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
      },
    },
    trigger,
  );

  console.log('[NotificationService] ✅ scheduleOneTime completed');
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

  console.log('[NotificationService] 🔔 Schedule REPEATING:', {
    id: alarm.id,
    title: noteTitle,
    hour,
    minute,
    weekdays: alarm.daysOfWeek,
  });

  // Notifee không hỗ trợ weekly repeating trigger trực tiếp
  // Workaround: Schedule cho mỗi ngày trong tuần
  const now = new Date();

  for (const weekday of alarm.daysOfWeek) {
    // Tính timestamp cho lần đầu tiên alarm sẽ reo vào ngày này
    const targetDate = new Date();
    targetDate.setHours(hour, minute, 0, 0);

    // Tìm ngày tiếp theo có weekday này
    const currentWeekday = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    let daysUntilTarget = weekday - currentWeekday;
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && targetDate <= now)) {
      daysUntilTarget += 7;
    }
    targetDate.setDate(targetDate.getDate() + daysUntilTarget);

    // Kiểm tra nếu targetDate vẫn trong quá khứ (edge case)
    if (targetDate.getTime() <= now.getTime()) {
      console.warn('[NotificationService] ⚠️ targetDate trong quá khứ, skip weekday:', weekday);
      continue;
    }

    console.log('[NotificationService] 📅 Schedule cho weekday:', {
      weekday,
      targetDate: targetDate.toISOString(),
      timestamp: targetDate.getTime(),
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: targetDate.getTime(),
      repeatFrequency: RepeatFrequency.WEEKLY,
    };

    // Schedule notification cho ngày này
    await notifee.createTriggerNotification(
      {
        id: `${alarm.id}-${weekday}`, // Unique ID cho mỗi ngày
        title: noteTitle,
        body: `Báo thức lặp lúc ${alarm.timeHHmm}`,
        data: {
          alarmId: alarm.id,
          noteId: alarm.noteId,
          weekday: weekday.toString(),
        },
        ios: {
          sound: 'default',
          categoryId: 'ALARM_NOTE',
          critical: true,
          criticalVolume: 1.0,
        },
        android: {
          channelId: 'alarm-note',
          sound: 'default',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      },
      trigger,
    );
  }

  console.log('[NotificationService] ✅ scheduleRepeatingAlarm completed');
}

/**
 * Mục đích: Hủy notification của alarm
 * Tham số vào: alarmId (string)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Xóa alarm hoặc disable
 */
export async function cancelAlarmNotification(alarmId: string): Promise<void> {
  try {
    // Cancel notification chính
    await notifee.cancelNotification(alarmId);

    // Cancel tất cả notifications của repeating alarm (nếu có)
    // Format: alarmId-0, alarmId-1, ..., alarmId-6
    for (let i = 0; i < 7; i++) {
      await notifee.cancelNotification(`${alarmId}-${i}`);
    }

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
    const triggers = await notifee.getTriggerNotifications();
    const ids = triggers.map(t => t.notification.id).filter((id): id is string => id !== undefined);
    console.log('[NotificationService] Pending notifications:', ids.length);
    return ids;
  } catch (error) {
    console.error('[NotificationService] Lỗi lấy pending:', error);
    return [];
  }
}

/**
 * Mục đích: Setup notification event handlers (foreground + background)
 * Tham số vào: Không
 * Tham số ra: Void
 * Khi nào dùng: Khởi tạo app (trong App.tsx hoặc index.js)
 */
export function setupNotificationHandlers() {
  // Foreground event handler
  notifee.onForegroundEvent(async ({type, detail}) => {
    console.log('[NotificationService] Foreground event:', type, detail);

    const {notification, pressAction} = detail;
    if (!notification?.data) return;

    const {alarmId, noteId} = notification.data as {
      alarmId: string;
      noteId: string;
    };

    // Handle action press (Snooze, Dismiss)
    if (pressAction?.id) {
      console.log('[NotificationService] Action pressed:', pressAction.id);
      // TODO: Implement snooze/dismiss logic
    }

    // Handle notification tap
    if (type === 1) {
      // EventType.PRESS
      console.log('[NotificationService] Notification tapped:', alarmId, noteId);
      // TODO: Navigate to note
    }
  });

  // Background event handler
  notifee.onBackgroundEvent(async ({type, detail}) => {
    console.log('[NotificationService] Background event:', type, detail);

    const {notification, pressAction} = detail;
    if (!notification?.data) return;

    const {alarmId, noteId} = notification.data as {
      alarmId: string;
      noteId: string;
    };

    // Handle action press (Snooze, Dismiss)
    if (pressAction?.id) {
      console.log('[NotificationService] Background action pressed:', pressAction.id);
      // TODO: Implement snooze/dismiss logic
    }
  });

  console.log('[NotificationService] ✅ Notification handlers setup completed');
}

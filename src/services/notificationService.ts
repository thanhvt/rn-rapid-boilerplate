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
    // Tạo notification channel cho Android với màu sắc và hiệu ứng
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'alarm-note',
        name: 'Báo thức & Ghi chú',
        description: 'Thông báo cho báo thức và ghi chú quan trọng',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500, 300, 500, 300, 500], // Rung mạnh
        lights: true,
        lightColor: '#C9FF3D', // Màu primary (lime green)
        badge: true,
      });
    }

    // Tạo categories với actions (iOS + Android)
    await notifee.setNotificationCategories([
      {
        id: 'ALARM_NOTE',
        actions: [
          {
            id: 'snooze',
            title: '⏰ Báo lại (5 phút)',
            foreground: false,
          },
          {
            id: 'dismiss',
            title: '✓ Tắt báo thức',
            foreground: false,
            destructive: true,
          },
        ],
      },
    ]);

    console.log('[NotificationService] Đã setup categories với màu sắc và hiệu ứng');
  } catch (error) {
    console.error('[NotificationService] Lỗi setup categories:', error);
    throw error;
  }
}

/**
 * Mục đích: Schedule notification cho alarm
 * Tham số vào: alarm (Alarm), noteTitle (string), noteContent (string | null)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi tạo/cập nhật alarm enabled
 */
export async function scheduleAlarmNotification(
  alarm: Alarm,
  noteTitle: string,
  noteContent?: string | null,
): Promise<void> {
  try {
    console.log('[NotificationService] 📅 Bắt đầu schedule alarm:', alarm.id);
    console.log('[NotificationService] Alarm type:', alarm.type);
    console.log('[NotificationService] Note title:', noteTitle);

    if (alarm.type === 'ONE_TIME') {
      await scheduleOneTimeAlarm(alarm, noteTitle, noteContent);
    } else if (alarm.type === 'REPEATING') {
      await scheduleRepeatingAlarm(alarm, noteTitle, noteContent);
    } else if (alarm.type === 'RANDOM') {
      await scheduleRandomAlarm(alarm, noteTitle, noteContent);
    }

    console.log('[NotificationService] ✅ Đã schedule alarm thành công:', alarm.id);
  } catch (error) {
    console.error('[NotificationService] ❌ Lỗi schedule alarm:', error);
    throw error;
  }
}

/**
 * Mục đích: Schedule ONE_TIME alarm
 * Tham số vào: alarm (Alarm), noteTitle (string), noteContent (string | null)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Internal helper
 */
async function scheduleOneTimeAlarm(
  alarm: Alarm,
  noteTitle: string,
  noteContent?: string | null,
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

  // Format notification body
  let body = `⏰ ${noteContent || 'Báo thức'}`;

  // Schedule notification
  await notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: `🔔 ${noteTitle}`,
      body: body,
      // subtitle: 'Báo thức ghi chú',
      data: {
        alarmId: alarm.id,
        noteId: alarm.noteId,
      },
      ios: {
        sound: 'default',
        categoryId: 'ALARM_NOTE',
        critical: true,
        criticalVolume: 1.0,
        // iOS không hỗ trợ BigText như Android, chỉ có thể dùng subtitle
        // Thêm badge number để nổi bật hơn
        badgeCount: 1,
      },
      android: {
        channelId: 'alarm-note',
        sound: 'default',
        importance: AndroidImportance.HIGH,
        color: '#C9FF3D', // Primary color (lime green)
        // smallIcon: Không set để dùng default app icon
        // largeIcon: 'ic_launcher', // Không cần vì sẽ tự động dùng app icon
        vibrationPattern: [300, 500, 300, 500],
        lights: ['#C9FF3D', 300, 600],
        pressAction: {
          id: 'default',
        },
        style: noteContent ? {
          type: 1, // BigTextStyle
          text: noteContent,
          title: `🔔 ${noteTitle}`,
          summary: `Báo thức lúc ${alarm.timeHHmm}`,
        } : undefined,
        fullScreenAction: {
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
 * Tham số vào: alarm (Alarm), noteTitle (string), noteContent (string | null)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Internal helper
 */
async function scheduleRepeatingAlarm(
  alarm: Alarm,
  noteTitle: string,
  noteContent?: string | null,
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

  // Day names in Vietnamese
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

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

    // Format notification body
    let body = `⏰ ${noteContent || 'Báo thức'}`;
    // if (noteContent) {
    //   const contentPreview = noteContent.length > 100
    //     ? noteContent.substring(0, 100) + '...'
    //     : noteContent;
    //   body += `\n\n${contentPreview}`;
    // }

    // Schedule notification cho ngày này
    await notifee.createTriggerNotification(
      {
        id: `${alarm.id}-${weekday}`, // Unique ID cho mỗi ngày
        title: `🔔 ${noteTitle}`,
        body: body,
        // subtitle: 'Báo thức lặp lại',
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
          // Thêm badge number để nổi bật hơn
          badgeCount: 1,
        },
        android: {
          channelId: 'alarm-note',
          sound: 'default',
          importance: AndroidImportance.HIGH,
          color: '#C9FF3D',
          // smallIcon: Không set để dùng default app icon
          // largeIcon: 'ic_launcher', // Không cần vì sẽ tự động dùng app icon
          vibrationPattern: [300, 500, 300, 500],
          lights: ['#C9FF3D', 300, 600],
          pressAction: {
            id: 'default',
          },
          style: noteContent ? {
            type: 1, // BigTextStyle
            text: noteContent,
            title: `🔔 ${noteTitle}`,
            summary: `Lặp lại mỗi ${dayNames[weekday]} lúc ${alarm.timeHHmm}`,
          } : undefined,
          fullScreenAction: {
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
 * Mục đích: Schedule RANDOM alarm
 * Tham số vào: alarm (Alarm), noteTitle (string), noteContent (string | null)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Internal helper
 */
async function scheduleRandomAlarm(
  alarm: Alarm,
  noteTitle: string,
  noteContent?: string | null,
): Promise<void> {
  if (!alarm.daysOfWeek || alarm.daysOfWeek.length === 0) {
    throw new Error('RANDOM alarm phải có daysOfWeek');
  }
  if (!alarm.randomTimes) {
    throw new Error('RANDOM alarm phải có randomTimes');
  }

  console.log('[NotificationService] 🎲 Schedule RANDOM:', {
    id: alarm.id,
    title: noteTitle,
    weekdays: alarm.daysOfWeek,
    randomTimes: alarm.randomTimes,
  });

  // Schedule cho mỗi ngày trong tuần với random time riêng
  for (const weekday of alarm.daysOfWeek) {
    const timeHHmm = alarm.randomTimes[weekday];
    if (!timeHHmm) {
      console.warn('[NotificationService] Không có random time cho ngày:', weekday);
      continue;
    }

    const [hour, minute] = timeHHmm.split(':').map(Number);
    const notificationId = `${alarm.id}-${weekday}`;

    console.log('[NotificationService] 🎲 Schedule RANDOM cho ngày:', {
      weekday,
      time: timeHHmm,
      hour,
      minute,
      notificationId,
    });

    // Tính timestamp cho lần đầu tiên reo (ngày tiếp theo có weekday này)
    const now = new Date();
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

    console.log('[NotificationService] 🎲 Schedule RANDOM cho weekday:', {
      weekday,
      time: timeHHmm,
      targetDate: targetDate.toISOString(),
      timestamp: targetDate.getTime(),
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: targetDate.getTime(),
      repeatFrequency: RepeatFrequency.WEEKLY,
    };

    // Format notification body
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    // let body = `🎲 Báo thức ngẫu nhiên vào ${dayNames[weekday]} lúc ${timeHHmm}`;
    // if (noteContent) {
    //   const contentPreview = noteContent.length > 100
    //     ? noteContent.substring(0, 100) + '...'
    //     : noteContent;
    //   body += `\n\n${contentPreview}`;
    // }

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: `🔔 ${noteTitle} 🎲 `,
        body: `${noteContent}`,
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
          badgeCount: 1,
        },
      },
      trigger,
    );

    console.log(
      '[NotificationService] ✅ Đã schedule RANDOM notification:',
      notificationId,
      'cho ngày:',
      weekday,
      'lúc:',
      timeHHmm,
    );
  }

  console.log('[NotificationService] ✅ scheduleRandomAlarm completed');
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

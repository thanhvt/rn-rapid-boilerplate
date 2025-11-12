/**
 * Mục đích: Debug utilities cho notifications
 * Tham số vào: Không
 * Tham số ra: Debug logs
 * Khi nào dùng: Khi cần debug notification issues
 */

import {NativeModules} from 'react-native';
import {
  requestNotificationPermission,
  getPendingNotifications,
} from '@/services/notificationService';
import {useAlarmsStore} from '@/stores/alarmsStore';
import {useSettingsStore} from '@/stores/settingsStore';

/**
 * Mục đích: Tính thời gian còn lại đến khi báo thức
 * Tham số vào: nextFireAt (number)
 * Tham số ra: string (ví dụ: "2 giờ 30 phút")
 * Khi nào dùng: Hiển thị thời gian còn lại
 */
function getTimeRemaining(nextFireAt: number): string {
  const now = Date.now();
  const diff = nextFireAt - now;

  if (diff <= 0) {
    return 'Đã qua';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days} ngày ${remainingHours} giờ`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours} giờ ${remainingMinutes} phút`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes} phút ${remainingSeconds} giây`;
  } else {
    return `${seconds} giây`;
  }
}

/**
 * Mục đích: Check toàn bộ notification setup
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Debug notification issues
 */
export async function debugNotificationSetup(): Promise<void> {
  console.log('\n========== DEBUG NOTIFICATION SETUP ==========\n');

  // 1. Check Native Module
  console.log('1️⃣ Checking Native Module...');
  const hasNativeModule = !!NativeModules.AlarmNoteNotifications;
  console.log('   Native Module loaded:', hasNativeModule ? '✅ YES' : '❌ NO');
  
  if (!hasNativeModule) {
    console.error('   ⚠️ CRITICAL: Native module not loaded!');
    console.error('   ⚠️ Swift files may not be added to Xcode project');
    console.error('   ⚠️ Or bridging header not configured correctly');
  }

  // 2. Check Notification Permission
  console.log('\n2️⃣ Checking Notification Permission...');
  try {
    const granted = await requestNotificationPermission();
    console.log('   Permission granted:', granted ? '✅ YES' : '❌ NO');
    
    if (!granted) {
      console.error('   ⚠️ CRITICAL: Notification permission denied!');
      console.error('   ⚠️ User needs to enable notifications in Settings');
    }
  } catch (error) {
    console.error('   ❌ Error checking permission:', error);
  }

  // 3. Check Timezone
  console.log('\n3️⃣ Checking Timezone...');
  const timezone = useSettingsStore.getState().timezone;
  console.log('   Timezone:', timezone);

  // 4. Check Alarms
  console.log('\n4️⃣ Checking Alarms...');
  const alarms = useAlarmsStore.getState().alarms;
  console.log('   Total alarms:', alarms.length);
  
  const enabledAlarms = alarms.filter(a => a.enabled);
  console.log('   Enabled alarms:', enabledAlarms.length);

  enabledAlarms.forEach((alarm, index) => {
    const fireDate = alarm.nextFireAt ? new Date(alarm.nextFireAt) : null;

    console.log(`\n   ⏰ Alarm ${index + 1}:`);
    console.log('      ID:', alarm.id);
    console.log('      Type:', alarm.type);
    console.log('      Time:', alarm.timeHHmm);
    console.log('      Date ISO:', alarm.dateISO);
    console.log('      Days of Week:', alarm.daysOfWeek);
    console.log('      Enabled:', alarm.enabled);

    if (fireDate) {
      const timeRemaining = getTimeRemaining(alarm.nextFireAt!);
      console.log('      ⏱️  CÒN:', timeRemaining);
      console.log('      🕐 SẼ RÉO VÀO:', fireDate.toLocaleString('vi-VN', {timeZone: timezone}));
      console.log('      📆 Ngày:', fireDate.toLocaleDateString('vi-VN', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      console.log('      🕐 Giờ:', fireDate.toLocaleTimeString('vi-VN', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      console.log('      (Timestamp:', alarm.nextFireAt, ')');
      console.log('      (ISO:', fireDate.toISOString(), ')');
    } else {
      console.log('      ⚠️ Không có nextFireAt');
    }
  });

  // 5. Check Pending Notifications
  console.log('\n5️⃣ Checking Pending Notifications...');
  try {
    const pending = await getPendingNotifications();
    console.log('   Pending notifications:', pending.length);
    
    if (pending.length > 0) {
      console.log('   Pending IDs:', pending);
    } else {
      console.warn('   ⚠️ No pending notifications found!');
      if (enabledAlarms.length > 0) {
        console.error('   ⚠️ ISSUE: Have enabled alarms but no pending notifications!');
      }
    }
  } catch (error) {
    console.error('   ❌ Error getting pending notifications:', error);
  }

  // 6. Summary
  console.log('\n========== SUMMARY ==========');
  console.log('Native Module:', hasNativeModule ? '✅' : '❌');
  console.log('Timezone:', timezone);
  console.log('Total Alarms:', alarms.length);
  console.log('Enabled Alarms:', enabledAlarms.length);
  console.log('\n========================================\n');
}

/**
 * Mục đích: Log alarm details
 * Tham số vào: alarmId (string)
 * Tham số ra: void
 * Khi nào dùng: Debug specific alarm
 */
export function debugAlarm(alarmId: string): void {
  const alarm = useAlarmsStore.getState().alarms.find(a => a.id === alarmId);

  if (!alarm) {
    console.error('[Debug] Alarm not found:', alarmId);
    return;
  }

  const timezone = useSettingsStore.getState().timezone;
  const fireDate = alarm.nextFireAt ? new Date(alarm.nextFireAt) : null;

  console.log('\n========== ALARM DEBUG ==========');
  console.log('ID:', alarm.id);
  console.log('Note ID:', alarm.noteId);
  console.log('Type:', alarm.type);
  console.log('Time:', alarm.timeHHmm);
  console.log('Date ISO:', alarm.dateISO);
  console.log('Days of Week:', alarm.daysOfWeek);
  console.log('Enabled:', alarm.enabled);
  console.log('');
  console.log('⏰ THỜI GIAN BÁO THỨC:');
  if (fireDate) {
    const timeRemaining = getTimeRemaining(alarm.nextFireAt!);
    console.log('⏱️  CÒN:', timeRemaining);
    console.log('🕐 SẼ RÉO VÀO:', fireDate.toLocaleString('vi-VN', {timeZone: timezone}));
    console.log('📆 Ngày:', fireDate.toLocaleDateString('vi-VN', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    console.log('🕐 Giờ:', fireDate.toLocaleTimeString('vi-VN', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    console.log('');
    console.log('Technical Info:');
    console.log('  Timestamp:', alarm.nextFireAt);
    console.log('  ISO String:', fireDate.toISOString());
  } else {
    console.log('⚠️ Không có nextFireAt');
  }
  console.log('');
  console.log('Created At:', new Date(alarm.createdAt).toLocaleString('vi-VN', {timeZone: timezone}));
  console.log('Updated At:', new Date(alarm.updatedAt).toLocaleString('vi-VN', {timeZone: timezone}));
  console.log('===================================\n');
}


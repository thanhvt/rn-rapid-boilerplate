/**
 * Mục đích: Test notifications với Notifee
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Debug notifications
 */

import notifee, {TriggerType, TimestampTrigger, AndroidImportance} from '@notifee/react-native';
import {getPendingNotifications} from '@/services/notificationService';

/**
 * Mục đích: Check pending notifications
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Debug xem có notification nào đang pending không
 */
export async function checkPendingNotifications(): Promise<void> {
  console.log('\n========== CHECK PENDING NOTIFICATIONS ==========\n');
  
  try {
    const pending = await getPendingNotifications();
    console.log('📋 Pending notifications:', pending.length);
    
    if (pending.length === 0) {
      console.log('⚠️ KHÔNG CÓ notification nào đang pending!');
      console.log('   Có thể:');
      console.log('   1. Notification đã được schedule nhưng iOS đã fire rồi');
      console.log('   2. Notification KHÔNG được schedule (lỗi native module)');
      console.log('   3. Notification bị cancel');
    } else {
      pending.forEach((notif, index) => {
        console.log(`\n📬 Notification ${index + 1}:`);
        console.log('   ID:', notif.id);
        console.log('   Title:', notif.title);
        console.log('   Body:', notif.body);
        console.log('   Fire date:', notif.fireDate);
      });
    }
  } catch (error) {
    console.error('❌ Lỗi check pending notifications:', error);
  }
  
  console.log('\n================================================\n');
}

/**
 * Mục đích: Test schedule một notification đơn giản với Notifee
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Test xem Notifee có hoạt động không
 */
export async function testScheduleSimpleNotification(): Promise<void> {
  console.log('\n========== TEST SCHEDULE SIMPLE NOTIFICATION (NOTIFEE) ==========\n');

  try {
    console.log('✅ Notifee module đã được load');

    // Schedule notification 10 giây sau
    const testTimestamp = Date.now() + 10000;
    const testDate = new Date(testTimestamp);

    console.log('📅 Scheduling test notification:');
    console.log('   ID: test-notification');
    console.log('   Title: Test Notification');
    console.log('   Body: This is a test');
    console.log('   Fire at:', testDate.toLocaleString('vi-VN'));
    console.log('   Timestamp:', testTimestamp);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: testTimestamp,
    };

    await notifee.createTriggerNotification(
      {
        id: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test',
        data: {
          alarmId: 'test-alarm',
          noteId: 'test-note',
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
        },
      },
      trigger,
    );

    console.log('✅ Schedule thành công!');
    console.log('⏰ Notification sẽ reo sau 10 giây!');
    console.log('🚪 Hãy THOÁT APP (Home button) để xem notification!');

    // Check pending
    setTimeout(async () => {
      const pending = await getPendingNotifications();
      console.log('\n📋 Pending notifications sau khi schedule:', pending.length);
      if (pending.length > 0) {
        console.log('✅ Notification đã được schedule vào iOS!');
      } else {
        console.log('❌ Notification KHÔNG có trong iOS pending list!');
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Lỗi test schedule:', error);
  }

  console.log('\n=======================================================\n');
}

/**
 * Mục đích: Cancel tất cả notifications
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Clear tất cả notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  console.log('\n========== CANCEL ALL NOTIFICATIONS ==========\n');
  
  try {
    await notifee.cancelAllNotifications();
    console.log('✅ Đã cancel tất cả notifications!');

    // Verify
    const pending = await getPendingNotifications();
    console.log('📋 Pending sau khi cancel:', pending.length);
  } catch (error) {
    console.error('❌ Lỗi cancel:', error);
  }
  
  console.log('\n==============================================\n');
}


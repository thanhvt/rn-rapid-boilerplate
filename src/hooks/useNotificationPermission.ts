/**
 * Mục đích: Hook để request notification permission
 * Tham số vào: Không
 * Tham số ra: {hasPermission, requestPermission}
 * Khi nào dùng: Khi app khởi động hoặc trước khi schedule notification
 */

import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {requestNotificationPermission, setupNotificationCategories} from '@/services/notificationService';

export function useNotificationPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  /**
   * Mục đích: Request notification permission
   * Tham số vào: Không
   * Tham số ra: Promise<boolean>
   * Khi nào dùng: Khi cần xin quyền notification
   */
  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      console.log('[useNotificationPermission] Android không cần request permission');
      setHasPermission(true);
      return true;
    }

    setIsRequesting(true);
    
    try {
      console.log('[useNotificationPermission] 🔔 Requesting notification permission...');

      // 1. Request authorization
      const granted = await requestNotificationPermission();
      console.log('[useNotificationPermission] Permission granted:', granted);

      if (granted) {
        // 2. Set notification categories (actions: Snooze, Dismiss)
        await setupNotificationCategories();
        console.log('[useNotificationPermission] ✅ Notification categories set');
      }

      setHasPermission(granted);
      setIsRequesting(false);

      return granted;
    } catch (error) {
      console.error('[useNotificationPermission] ❌ Lỗi request permission:', error);
      setHasPermission(false);
      setIsRequesting(false);
      return false;
    }
  };

  /**
   * Mục đích: Auto request permission khi hook mount
   * Tham số vào: Không
   * Tham số ra: Void
   * Khi nào dùng: Khi component mount
   */
  useEffect(() => {
    // Auto request khi app khởi động
    requestPermission();
  }, []);

  return {
    hasPermission,
    isRequesting,
    requestPermission,
  };
}


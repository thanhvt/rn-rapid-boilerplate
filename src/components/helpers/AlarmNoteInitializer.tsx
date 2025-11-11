/**
 * Mục đích: Component khởi tạo database và services cho AlarmNote
 * Tham số vào: Không
 * Tham số ra: null (side-effect only)
 * Khi nào dùng: Mount trong App.tsx để init database khi app khởi động
 */

import {useEffect} from 'react';
import {openDatabase} from '@/database/db';
import {runMigrations} from '@/database/migrations';
import {initBackgroundRefresh} from '@/services/backgroundRefreshService';

export function AlarmNoteInitializer(): null {
  useEffect(() => {
    /**
     * Mục đích: Khởi tạo database và chạy migrations
     * Tham số vào: Không
     * Tham số ra: Promise<void>
     * Khi nào dùng: Khi component mount
     */
    const initDatabase = async () => {
      try {
        console.log('[AlarmNoteInitializer] Bắt đầu khởi tạo database...');

        // Mở database connection
        const db = await openDatabase();
        console.log('[AlarmNoteInitializer] Database connection opened');

        // Chạy migrations với db instance
        await runMigrations(db);
        console.log('[AlarmNoteInitializer] Migrations completed');

        console.log('[AlarmNoteInitializer] ✅ Database khởi tạo thành công');
      } catch (error) {
        console.error('[AlarmNoteInitializer] ❌ Lỗi khi khởi tạo database:', error);
      }
    };

    /**
     * Mục đích: Khởi tạo background refresh service
     * Tham số vào: Không
     * Tham số ra: Cleanup function
     * Khi nào dùng: Khi component mount
     */
    const initServices = () => {
      console.log('[AlarmNoteInitializer] Khởi tạo background refresh service...');
      const cleanup = initBackgroundRefresh();
      console.log('[AlarmNoteInitializer] ✅ Background refresh service đã khởi tạo');
      return cleanup;
    };

    // Khởi tạo database
    initDatabase();

    // Khởi tạo services và return cleanup function
    const cleanup = initServices();

    // Cleanup khi component unmount
    return () => {
      console.log('[AlarmNoteInitializer] Cleanup services...');
      cleanup();
    };
  }, []);

  return null;
}


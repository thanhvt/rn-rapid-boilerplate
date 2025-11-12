/**
 * Mục đích: Debug helpers cho development
 * Tham số vào: Không
 * Tham số ra: Các functions để debug
 * Khi nào dùng: Development/testing only
 */

import {getDatabase} from '@/database/db';
import {dropAllTables, runMigrations, forceMigrationV2} from '@/database/migrations';

/**
 * Mục đích: Reset toàn bộ database và chạy lại migrations
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi cần reset database trong development
 */
export async function resetDatabase(): Promise<void> {
  try {
    console.log('[DebugHelper] 🔄 Bắt đầu reset database...');
    
    const db = await getDatabase();
    
    // Xóa tất cả bảng
    await dropAllTables(db);
    console.log('[DebugHelper] ✅ Đã xóa tất cả bảng');
    
    // Chạy lại migrations
    await runMigrations(db);
    console.log('[DebugHelper] ✅ Đã chạy lại migrations');
    
    console.log('[DebugHelper] 🎉 Reset database thành công!');
    console.log('[DebugHelper] ⚠️ Vui lòng reload app để áp dụng thay đổi');
  } catch (error) {
    console.error('[DebugHelper] ❌ Lỗi khi reset database:', error);
    throw error;
  }
}

/**
 * Mục đích: Force chạy lại migration v2 mà không mất data
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi cần update schema nhưng giữ lại data
 */
export async function forceUpdateSchema(): Promise<void> {
  try {
    console.log('[DebugHelper] 🔄 Bắt đầu force update schema...');
    
    const db = await getDatabase();
    
    // Force chạy lại migration v2
    await forceMigrationV2(db);
    console.log('[DebugHelper] ✅ Đã force update schema');
    
    console.log('[DebugHelper] 🎉 Force update schema thành công!');
    console.log('[DebugHelper] ⚠️ Vui lòng reload app để áp dụng thay đổi');
  } catch (error) {
    console.error('[DebugHelper] ❌ Lỗi khi force update schema:', error);
    throw error;
  }
}

/**
 * Mục đích: Kiểm tra database version hiện tại
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi cần check version của database
 */
export async function checkDatabaseVersion(): Promise<void> {
  try {
    const db = await getDatabase();
    const [result] = await db.executeSql('PRAGMA user_version');
    const version = result.rows.item(0).user_version;
    
    console.log('[DebugHelper] 📊 Database version:', version);
    console.log('[DebugHelper] 📊 Target version: 2');
    
    if (version < 2) {
      console.log('[DebugHelper] ⚠️ Database cần update! Chạy forceUpdateSchema()');
    } else {
      console.log('[DebugHelper] ✅ Database đã ở version mới nhất');
    }
  } catch (error) {
    console.error('[DebugHelper] ❌ Lỗi khi check version:', error);
    throw error;
  }
}

/**
 * Mục đích: Kiểm tra schema của bảng Alarms
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi cần check schema hiện tại
 */
export async function checkAlarmsSchema(): Promise<void> {
  try {
    const db = await getDatabase();
    const [result] = await db.executeSql(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='Alarms'"
    );
    
    if (result.rows.length > 0) {
      const schema = result.rows.item(0).sql;
      console.log('[DebugHelper] 📋 Alarms table schema:');
      console.log(schema);
      
      // Check nếu có RANDOM trong CHECK constraint
      if (schema.includes("'RANDOM'")) {
        console.log('[DebugHelper] ✅ Schema đã support RANDOM type');
      } else {
        console.log('[DebugHelper] ❌ Schema CHƯA support RANDOM type');
        console.log('[DebugHelper] 💡 Chạy forceUpdateSchema() để fix');
      }
    } else {
      console.log('[DebugHelper] ⚠️ Bảng Alarms không tồn tại');
    }
  } catch (error) {
    console.error('[DebugHelper] ❌ Lỗi khi check schema:', error);
    throw error;
  }
}

// Export tất cả helpers vào global object để dễ gọi từ console
if (__DEV__) {
  (global as any).debugDB = {
    resetDatabase,
    forceUpdateSchema,
    checkDatabaseVersion,
    checkAlarmsSchema,
  };
  
  console.log('[DebugHelper] 🛠️ Debug helpers đã sẵn sàng!');
  console.log('[DebugHelper] 💡 Sử dụng: debugDB.checkDatabaseVersion()');
  console.log('[DebugHelper] 💡 Sử dụng: debugDB.checkAlarmsSchema()');
  console.log('[DebugHelper] 💡 Sử dụng: debugDB.forceUpdateSchema()');
  console.log('[DebugHelper] 💡 Sử dụng: debugDB.resetDatabase()');
}


/**
 * Mục đích: Module kết nối và quản lý SQLite database
 * Tham số vào: Không
 * Tham số ra: Database connection instance
 * Khi nào dùng: Khởi tạo app, trước khi truy vấn dữ liệu
 */

import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';

// Bật debug mode cho development
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const DATABASE_NAME = 'alarmnote.db';
const DATABASE_VERSION = 1;

let dbInstance: SQLiteDatabase | null = null;

/**
 * Mục đích: Mở kết nối database
 * Tham số vào: Không
 * Tham số ra: Promise<SQLiteDatabase>
 * Khi nào dùng: Lần đầu truy cập DB hoặc sau khi đóng
 */
export async function openDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    console.log('[DB] Sử dụng kết nối DB hiện tại');
    return dbInstance;
  }

  try {
    console.log('[DB] Đang mở database:', DATABASE_NAME);
    const db = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
    });

    dbInstance = db;
    console.log('[DB] Mở database thành công');
    return db;
  } catch (error) {
    console.error('[DB] Lỗi khi mở database:', error);
    throw error;
  }
}

/**
 * Mục đích: Đóng kết nối database
 * Tham số vào: Không
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi app đóng hoặc cần reset connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    console.log('[DB] Đang đóng database');
    await dbInstance.close();
    dbInstance = null;
    console.log('[DB] Đóng database thành công');
  }
}

/**
 * Mục đích: Lấy instance database hiện tại
 * Tham số vào: Không
 * Tham số ra: Promise<SQLiteDatabase>
 * Khi nào dùng: Mỗi khi cần thực hiện query
 */
export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbInstance) {
    return await openDatabase();
  }
  return dbInstance;
}

/**
 * Mục đích: Lấy version hiện tại của database
 * Tham số vào: Không
 * Tham số ra: number
 * Khi nào dùng: Kiểm tra version để migration
 */
export function getDatabaseVersion(): number {
  return DATABASE_VERSION;
}


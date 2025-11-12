/**
 * Mục đích: Quản lý database migrations
 * Tham số vào: Database instance
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi khởi tạo app hoặc nâng cấp database version
 */

import {SQLiteDatabase} from 'react-native-sqlite-storage';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Mục đích: Migration v1 - Tạo schema ban đầu
 * Tham số vào: db (SQLiteDatabase)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Lần đầu khởi tạo database
 */
async function migrationV1(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration] Chạy migration v1');

  // Bảng Notes - Lưu ghi chú
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  // Index cho tìm kiếm và sắp xếp
  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_notes_updated 
    ON Notes(updatedAt DESC);
  `);

  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_notes_title 
    ON Notes(title COLLATE NOCASE);
  `);

  // Bảng Alarms - Lưu báo thức
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Alarms (
      id TEXT PRIMARY KEY NOT NULL,
      noteId TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ONE_TIME', 'REPEATING', 'RANDOM')),
      timeHHmm TEXT NOT NULL,
      dateISO TEXT,
      daysOfWeek TEXT,
      randomTimes TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      nextFireAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (noteId) REFERENCES Notes(id) ON DELETE CASCADE
    );
  `);

  // Index cho query alarms theo note
  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_alarms_note 
    ON Alarms(noteId);
  `);

  // Index cho query alarms enabled
  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_alarms_enabled 
    ON Alarms(enabled, nextFireAt);
  `);

  // Bảng Preferences - Lưu cài đặt
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  console.log('[Migration] Migration v1 hoàn thành');
}

/**
 * Mục đích: Seed dữ liệu mặc định cho Preferences
 * Tham số vào: db (SQLiteDatabase)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Sau khi chạy migration v1
 */
async function seedPreferences(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration] Seed preferences mặc định');

  const currentTimezone = dayjs.tz.guess();

  // Kiểm tra xem đã có preferences chưa
  const [result] = await db.executeSql(
    'SELECT COUNT(*) as count FROM Preferences',
  );
  const count = result.rows.item(0).count;

  if (count === 0) {
    // Chèn giá trị mặc định
    await db.executeSql(
      `INSERT INTO Preferences (key, value) VALUES 
       ('snoozeMinutesDefault', '10'),
       ('timezone', ?),
       ('onboardingCompleted', 'false')`,
      [currentTimezone],
    );
    console.log('[Migration] Seed preferences thành công');
  } else {
    console.log('[Migration] Preferences đã tồn tại, bỏ qua seed');
  }
}

/**
 * Mục đích: Migration v2 - Thêm support cho RANDOM alarm type
 * Tham số vào: db (SQLiteDatabase)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Upgrade từ v1 lên v2
 */
async function migrationV2(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration] Chạy migration v2 - Thêm RANDOM alarm type');

  // SQLite không cho phép ALTER CHECK constraint trực tiếp
  // Cần recreate table với CHECK constraint mới

  // Bước 1: Tạo bảng mới với schema đầy đủ
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Alarms_new (
      id TEXT PRIMARY KEY NOT NULL,
      noteId TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ONE_TIME', 'REPEATING', 'RANDOM')),
      timeHHmm TEXT NOT NULL,
      dateISO TEXT,
      daysOfWeek TEXT,
      randomTimes TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      nextFireAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (noteId) REFERENCES Notes(id) ON DELETE CASCADE
    );
  `);

  // Bước 2: Copy data từ bảng cũ sang bảng mới
  await db.executeSql(`
    INSERT INTO Alarms_new (id, noteId, type, timeHHmm, dateISO, daysOfWeek, randomTimes, enabled, nextFireAt, createdAt, updatedAt)
    SELECT id, noteId, type, timeHHmm, dateISO, daysOfWeek, NULL as randomTimes, enabled, nextFireAt, createdAt, updatedAt
    FROM Alarms;
  `);

  // Bước 3: Xóa bảng cũ
  await db.executeSql(`DROP TABLE Alarms;`);

  // Bước 4: Rename bảng mới thành tên cũ
  await db.executeSql(`ALTER TABLE Alarms_new RENAME TO Alarms;`);

  // Bước 5: Recreate indexes
  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_alarms_note
    ON Alarms(noteId);
  `);

  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_alarms_enabled
    ON Alarms(enabled, nextFireAt);
  `);

  console.log('[Migration] Migration v2 hoàn thành');
}

/**
 * Mục đích: Lấy version hiện tại của database
 * Tham số vào: db (SQLiteDatabase)
 * Tham số ra: Promise<number>
 * Khi nào dùng: Trước khi chạy migrations
 */
async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const [result] = await db.executeSql('PRAGMA user_version');
    const version = result.rows.item(0).user_version;
    console.log('[Migration] Database version hiện tại:', version);
    return version;
  } catch (error) {
    console.error('[Migration] Lỗi khi lấy version:', error);
    return 0;
  }
}

/**
 * Mục đích: Cập nhật version của database
 * Tham số vào: db (SQLiteDatabase), version (number)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Sau khi chạy migration thành công
 */
async function setVersion(
  db: SQLiteDatabase,
  version: number,
): Promise<void> {
  await db.executeSql(`PRAGMA user_version = ${version}`);
  console.log('[Migration] Cập nhật database version thành:', version);
}

/**
 * Mục đích: Chạy tất cả migrations cần thiết
 * Tham số vào: db (SQLiteDatabase)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi khởi tạo database
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration] Bắt đầu kiểm tra migrations');

  const currentVersion = await getCurrentVersion(db);
  const targetVersion = 2; // Version hiện tại của schema

  if (currentVersion >= targetVersion) {
    console.log('[Migration] Database đã ở version mới nhất');
    return;
  }

  try {
    // Chạy migrations theo thứ tự
    if (currentVersion < 1) {
      await migrationV1(db);
      await seedPreferences(db);
      await setVersion(db, 1);
    }

    // Migration v2: Thêm RANDOM alarm type
    if (currentVersion < 2) {
      await migrationV2(db);
      await setVersion(db, 2);
    }

    console.log('[Migration] Tất cả migrations hoàn thành');
  } catch (error) {
    console.error('[Migration] Lỗi khi chạy migrations:', error);
    throw error;
  }
}

/**
 * Mục đích: Xóa toàn bộ database (dùng cho development/testing)
 * Tham số vào: db (SQLiteDatabase)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Reset database trong development
 */
export async function dropAllTables(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration] Xóa tất cả bảng');
  await db.executeSql('DROP TABLE IF EXISTS Alarms');
  await db.executeSql('DROP TABLE IF EXISTS Notes');
  await db.executeSql('DROP TABLE IF EXISTS Preferences');
  await db.executeSql('PRAGMA user_version = 0');
  console.log('[Migration] Đã xóa tất cả bảng');
}

/**
 * Mục đích: Force chạy lại migration v2 (dùng khi cần fix migration)
 * Tham số vào: db (SQLiteDatabase)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi cần force update schema mà không mất data
 */
export async function forceMigrationV2(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration] Force chạy lại migration v2');

  // Set version về 1 để trigger migration v2
  await db.executeSql('PRAGMA user_version = 1');

  // Chạy lại migration v2
  await migrationV2(db);
  await setVersion(db, 2);

  console.log('[Migration] Force migration v2 hoàn thành');
}


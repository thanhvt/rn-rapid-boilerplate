/**
 * Mục đích: Repository cho Preferences - Key-value storage
 * Tham số vào: Database queries
 * Tham số ra: Preferences values
 * Khi nào dùng: Đọc/ghi cài đặt ứng dụng
 */

import {getDatabase} from '@/database/db';
import {Preferences, PreferenceKey, PreferenceRow} from '@/types/alarmNote';

/**
 * Mục đích: Lấy tất cả preferences
 * Tham số vào: Không
 * Tham số ra: Promise<Preferences>
 * Khi nào dùng: Khởi tạo app, load settings
 */
export async function getAllPreferences(): Promise<Preferences> {
  const db = await getDatabase();
  const [result] = await db.executeSql('SELECT * FROM Preferences');

  const prefs: Partial<Preferences> = {};

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i) as PreferenceRow;
    const key = row.key as PreferenceKey;

    // Parse value theo type
    if (key === 'snoozeMinutesDefault') {
      prefs[key] = parseInt(row.value, 10);
    } else if (key === 'onboardingCompleted') {
      prefs[key] = row.value === 'true';
    } else if (key === 'timezone') {
      prefs[key] = row.value;
    }
  }

  // Default values nếu chưa có
  const defaults: Preferences = {
    snoozeMinutesDefault: 10,
    timezone: 'Asia/Ho_Chi_Minh',
    onboardingCompleted: false,
  };

  console.log('[PrefsRepo] Lấy tất cả preferences');
  return {...defaults, ...prefs};
}

/**
 * Mục đích: Lấy một preference theo key
 * Tham số vào: key (PreferenceKey)
 * Tham số ra: Promise<any>
 * Khi nào dùng: Đọc một cài đặt cụ thể
 */
export async function getPreference(key: PreferenceKey): Promise<any> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT value FROM Preferences WHERE key = ?',
    [key],
  );

  if (result.rows.length === 0) {
    console.log('[PrefsRepo] Preference không tồn tại:', key);
    return null;
  }

  const row = result.rows.item(0) as PreferenceRow;
  let value: any = row.value;

  // Parse value theo type
  if (key === 'snoozeMinutesDefault') {
    value = parseInt(value, 10);
  } else if (key === 'onboardingCompleted') {
    value = value === 'true';
  }

  console.log('[PrefsRepo] Lấy preference:', key, '=', value);
  return value;
}

/**
 * Mục đích: Cập nhật hoặc tạo mới preference
 * Tham số vào: key (PreferenceKey), value (any)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Lưu cài đặt
 */
export async function setPreference(
  key: PreferenceKey,
  value: any,
): Promise<void> {
  const db = await getDatabase();

  // Convert value sang string
  let stringValue: string;
  if (typeof value === 'boolean') {
    stringValue = value ? 'true' : 'false';
  } else if (typeof value === 'number') {
    stringValue = value.toString();
  } else {
    stringValue = value;
  }

  // Upsert (INSERT OR REPLACE)
  await db.executeSql(
    `INSERT OR REPLACE INTO Preferences (key, value) VALUES (?, ?)`,
    [key, stringValue],
  );

  console.log('[PrefsRepo] Cập nhật preference:', key, '=', stringValue);
}

/**
 * Mục đích: Cập nhật nhiều preferences cùng lúc
 * Tham số vào: prefs (Partial<Preferences>)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Lưu nhiều cài đặt cùng lúc
 */
export async function setMultiplePreferences(
  prefs: Partial<Preferences>,
): Promise<void> {
  const keys = Object.keys(prefs) as PreferenceKey[];

  for (const key of keys) {
    await setPreference(key, prefs[key]);
  }

  console.log('[PrefsRepo] Cập nhật nhiều preferences:', keys.length);
}


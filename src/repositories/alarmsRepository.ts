/**
 * Mục đích: Repository cho Alarms - CRUD operations
 * Tham số vào: Database queries
 * Tham số ra: Alarm models
 * Khi nào dùng: Mọi thao tác với Alarms table
 */

import {getDatabase} from '@/database/db';
import {
  Alarm,
  CreateAlarmInput,
  UpdateAlarmInput,
  AlarmRow,
  mapAlarmRowToModel,
  mapAlarmModelToRow,
} from '@/types/alarmNote';
import {generateId, isValidTimeHHmm, isValidDaysOfWeek} from '@/utils/alarmNoteHelpers';
import {useSettingsStore} from '@/stores/settingsStore';
import {calculateNextFireAt} from '../services/alarmLogic';

/**
 * Mục đích: Tạo báo thức mới
 * Tham số vào: input (CreateAlarmInput)
 * Tham số ra: Promise<Alarm>
 * Khi nào dùng: Khi người dùng tạo báo thức mới
 */
export async function createAlarm(input: CreateAlarmInput): Promise<Alarm> {
  // Validate input
  if (!isValidTimeHHmm(input.timeHHmm)) {
    throw new Error('Định dạng giờ không hợp lệ (phải là HH:mm)');
  }

  if (input.type === 'ONE_TIME' && !input.dateISO) {
    throw new Error('Báo thức ONE_TIME phải có dateISO');
  }

  if (input.type === 'REPEATING') {
    if (!input.daysOfWeek || !isValidDaysOfWeek(input.daysOfWeek)) {
      throw new Error('Báo thức REPEATING phải có daysOfWeek hợp lệ');
    }
  }

  const db = await getDatabase();
  const now = Date.now();
  const id = generateId();

  // Lấy timezone từ settings
  const timezone = useSettingsStore.getState().timezone;
  console.log('[AlarmsRepo] 🔍 ========================================');
  console.log('[AlarmsRepo] 🔍 INPUT DATA:');
  console.log('[AlarmsRepo]   - type:', input.type);
  console.log('[AlarmsRepo]   - timeHHmm:', input.timeHHmm);
  console.log('[AlarmsRepo]   - dateISO:', input.dateISO);
  console.log('[AlarmsRepo]   - daysOfWeek:', input.daysOfWeek);
  console.log('[AlarmsRepo]   - timezone:', timezone);
  console.log('[AlarmsRepo] 🔍 ========================================');

  // Tính nextFireAt với timezone
  const nextFireAt = calculateNextFireAt({
    type: input.type,
    timeHHmm: input.timeHHmm,
    dateISO: input.dateISO,
    daysOfWeek: input.daysOfWeek,
  }, timezone);

  console.log('[AlarmsRepo] 📊 RESULT:');
  console.log('[AlarmsRepo]   - nextFireAt timestamp:', nextFireAt);
  console.log('[AlarmsRepo]   - nextFireAt ISO:', nextFireAt ? new Date(nextFireAt).toISOString() : null);
  console.log('[AlarmsRepo]   - nextFireAt VN:', nextFireAt ? new Date(nextFireAt).toLocaleString('vi-VN', {timeZone: timezone}) : null);

  const alarm: Alarm = {
    id,
    noteId: input.noteId,
    type: input.type,
    timeHHmm: input.timeHHmm,
    dateISO: input.dateISO || null,
    daysOfWeek: input.daysOfWeek || null,
    enabled: true,
    nextFireAt,
    createdAt: now,
    updatedAt: now,
  };

  const row = mapAlarmModelToRow(alarm);

  await db.executeSql(
    `INSERT INTO Alarms 
     (id, noteId, type, timeHHmm, dateISO, daysOfWeek, enabled, nextFireAt, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.noteId,
      row.type,
      row.timeHHmm,
      row.dateISO,
      row.daysOfWeek,
      row.enabled,
      row.nextFireAt,
      row.createdAt,
      row.updatedAt,
    ],
  );

  console.log('[AlarmsRepo] Tạo báo thức mới:', alarm.id);
  return alarm;
}

/**
 * Mục đích: Lấy tất cả báo thức của một ghi chú
 * Tham số vào: noteId (string)
 * Tham số ra: Promise<Alarm[]>
 * Khi nào dùng: Hiển thị danh sách báo thức trong AlarmManager
 */
export async function getAlarmsByNoteId(noteId: string): Promise<Alarm[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM Alarms WHERE noteId = ? ORDER BY createdAt DESC',
    [noteId],
  );

  const alarms: Alarm[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i) as AlarmRow;
    alarms.push(mapAlarmRowToModel(row));
  }

  console.log('[AlarmsRepo] Lấy báo thức theo noteId:', noteId, '- Kết quả:', alarms.length);
  return alarms;
}

/**
 * Mục đích: Lấy báo thức theo ID
 * Tham số vào: id (string)
 * Tham số ra: Promise<Alarm | null>
 * Khi nào dùng: Xem chi tiết hoặc chỉnh sửa báo thức
 */
export async function getAlarmById(id: string): Promise<Alarm | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql('SELECT * FROM Alarms WHERE id = ?', [
    id,
  ]);

  if (result.rows.length === 0) {
    console.log('[AlarmsRepo] Không tìm thấy báo thức:', id);
    return null;
  }

  const row = result.rows.item(0) as AlarmRow;
  console.log('[AlarmsRepo] Lấy báo thức:', id);
  return mapAlarmRowToModel(row);
}

/**
 * Mục đích: Cập nhật báo thức
 * Tham số vào: input (UpdateAlarmInput)
 * Tham số ra: Promise<Alarm | null>
 * Khi nào dùng: Khi người dùng chỉnh sửa báo thức
 */
export async function updateAlarm(
  input: UpdateAlarmInput,
): Promise<Alarm | null> {
  const db = await getDatabase();
  const now = Date.now();

  // Validate input nếu có
  if (input.timeHHmm && !isValidTimeHHmm(input.timeHHmm)) {
    throw new Error('Định dạng giờ không hợp lệ (phải là HH:mm)');
  }

  if (input.daysOfWeek && !isValidDaysOfWeek(input.daysOfWeek)) {
    throw new Error('daysOfWeek không hợp lệ');
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  if (input.type !== undefined) {
    updates.push('type = ?');
    values.push(input.type);
  }
  if (input.timeHHmm !== undefined) {
    updates.push('timeHHmm = ?');
    values.push(input.timeHHmm);
  }
  if (input.dateISO !== undefined) {
    updates.push('dateISO = ?');
    values.push(input.dateISO);
  }
  if (input.daysOfWeek !== undefined) {
    updates.push('daysOfWeek = ?');
    values.push(JSON.stringify(input.daysOfWeek));
  }
  if (input.enabled !== undefined) {
    updates.push('enabled = ?');
    values.push(input.enabled ? 1 : 0);
  }

  if (updates.length === 0) {
    console.log('[AlarmsRepo] Không có gì để cập nhật');
    return await getAlarmById(input.id);
  }

  updates.push('updatedAt = ?');
  values.push(now);
  values.push(input.id);

  await db.executeSql(
    `UPDATE Alarms SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  console.log('[AlarmsRepo] Cập nhật báo thức:', input.id);
  return await getAlarmById(input.id);
}

/**
 * Mục đích: Xóa báo thức
 * Tham số vào: id (string)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi người dùng xóa báo thức
 */
export async function deleteAlarm(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM Alarms WHERE id = ?', [id]);
  console.log('[AlarmsRepo] Xóa báo thức:', id);
}

/**
 * Mục đích: Xóa tất cả báo thức của một ghi chú
 * Tham số vào: noteId (string)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi xóa ghi chú (cascade)
 */
export async function deleteAlarmsByNoteId(noteId: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM Alarms WHERE noteId = ?', [noteId]);
  console.log('[AlarmsRepo] Xóa tất cả báo thức của note:', noteId);
}

/**
 * Mục đích: Lấy tất cả báo thức đang enabled
 * Tham số vào: Không
 * Tham số ra: Promise<Alarm[]>
 * Khi nào dùng: Sync với notification scheduler
 */
export async function getAllEnabledAlarms(): Promise<Alarm[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM Alarms WHERE enabled = 1 ORDER BY nextFireAt ASC',
  );

  const alarms: Alarm[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i) as AlarmRow;
    alarms.push(mapAlarmRowToModel(row));
  }

  console.log('[AlarmsRepo] Lấy tất cả báo thức enabled:', alarms.length);
  return alarms;
}

/**
 * Mục đích: Cập nhật nextFireAt cho báo thức
 * Tham số vào: id (string), nextFireAt (number | null)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Sau khi tính toán nextFireAt (Phase 3)
 */
export async function updateNextFireAt(
  id: string,
  nextFireAt: number | null,
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE Alarms SET nextFireAt = ? WHERE id = ?', [
    nextFireAt,
    id,
  ]);
  console.log('[AlarmsRepo] Cập nhật nextFireAt cho alarm:', id, nextFireAt);
}

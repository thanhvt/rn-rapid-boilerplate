/**
 * Mục đích: Định nghĩa types cho domain models của AlarmNote
 * Tham số vào: Không
 * Tham số ra: Type definitions
 * Khi nào dùng: Import vào các module cần sử dụng types
 */

// ============ Note Models ============

export interface Note {
  id: string;
  title: string;
  content: string | null;
  createdAt: number; // Unix timestamp (ms)
  updatedAt: number; // Unix timestamp (ms)
}

export interface CreateNoteInput {
  title: string;
  content?: string;
}

export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
}

// ============ Alarm Models ============

export type AlarmType = 'ONE_TIME' | 'REPEATING' | 'RANDOM';

export interface Alarm {
  id: string;
  noteId: string;
  type: AlarmType;
  timeHHmm: string; // Format: "HH:mm" (24h)
  dateISO: string | null; // ISO date string cho ONE_TIME
  daysOfWeek: number[] | null; // [0-6] cho REPEATING và RANDOM (0=Sunday)
  randomTimes: Record<number, string> | null; // {0: '09:30', 1: '14:15'} cho RANDOM
  enabled: boolean;
  nextFireAt: number | null; // Unix timestamp (ms)
  createdAt: number;
  updatedAt: number;
}

export interface CreateAlarmInput {
  noteId: string;
  type: AlarmType;
  timeHHmm: string;
  dateISO?: string; // Required nếu type = ONE_TIME
  daysOfWeek?: number[]; // Required nếu type = REPEATING hoặc RANDOM
  randomTimes?: Record<number, string>; // Required nếu type = RANDOM
}

export interface UpdateAlarmInput {
  id: string;
  type?: AlarmType;
  timeHHmm?: string;
  dateISO?: string;
  daysOfWeek?: number[];
  randomTimes?: Record<number, string>;
  enabled?: boolean;
}

// ============ Preferences Models ============

export interface Preferences {
  snoozeMinutesDefault: number;
  timezone: string;
  onboardingCompleted: boolean;
}

export type PreferenceKey = keyof Preferences;

// ============ Database Row Types ============
// Mapping giữa DB rows và domain models

export interface NoteRow {
  id: string;
  title: string;
  content: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AlarmRow {
  id: string;
  noteId: string;
  type: string;
  timeHHmm: string;
  dateISO: string | null;
  daysOfWeek: string | null; // JSON string
  randomTimes: string | null; // JSON string cho RANDOM type
  enabled: number; // SQLite boolean (0/1)
  nextFireAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface PreferenceRow {
  key: string;
  value: string;
}

// ============ Helper Functions ============

/**
 * Mục đích: Chuyển AlarmRow từ DB sang Alarm domain model
 * Tham số vào: row (AlarmRow)
 * Tham số ra: Alarm
 * Khi nào dùng: Sau khi query từ database
 */
export function mapAlarmRowToModel(row: AlarmRow): Alarm {
  return {
    id: row.id,
    noteId: row.noteId,
    type: row.type as AlarmType,
    timeHHmm: row.timeHHmm,
    dateISO: row.dateISO,
    daysOfWeek: row.daysOfWeek ? JSON.parse(row.daysOfWeek) : null,
    randomTimes: row.randomTimes ? JSON.parse(row.randomTimes) : null,
    enabled: row.enabled === 1,
    nextFireAt: row.nextFireAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Mục đích: Chuyển Alarm domain model sang AlarmRow để lưu DB
 * Tham số vào: alarm (Alarm)
 * Tham số ra: Partial<AlarmRow>
 * Khi nào dùng: Trước khi insert/update vào database
 */
export function mapAlarmModelToRow(alarm: Partial<Alarm>): Partial<AlarmRow> {
  const row: Partial<AlarmRow> = {};

  if (alarm.id !== undefined) row.id = alarm.id;
  if (alarm.noteId !== undefined) row.noteId = alarm.noteId;
  if (alarm.type !== undefined) row.type = alarm.type;
  if (alarm.timeHHmm !== undefined) row.timeHHmm = alarm.timeHHmm;
  if (alarm.dateISO !== undefined) row.dateISO = alarm.dateISO;
  if (alarm.daysOfWeek !== undefined) {
    row.daysOfWeek = alarm.daysOfWeek ? JSON.stringify(alarm.daysOfWeek) : null;
  }
  if (alarm.randomTimes !== undefined) {
    row.randomTimes = alarm.randomTimes ? JSON.stringify(alarm.randomTimes) : null;
  }
  if (alarm.enabled !== undefined) row.enabled = alarm.enabled ? 1 : 0;
  if (alarm.nextFireAt !== undefined) row.nextFireAt = alarm.nextFireAt;
  if (alarm.createdAt !== undefined) row.createdAt = alarm.createdAt;
  if (alarm.updatedAt !== undefined) row.updatedAt = alarm.updatedAt;

  return row;
}

/**
 * Mục đích: Chuyển NoteRow từ DB sang Note domain model
 * Tham số vào: row (NoteRow)
 * Tham số ra: Note
 * Khi nào dùng: Sau khi query từ database
 */
export function mapNoteRowToModel(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}


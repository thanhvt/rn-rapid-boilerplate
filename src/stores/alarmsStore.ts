/**
 * Mục đích: Zustand store cho Alarms state management
 * Tham số vào: Không (global state)
 * Tham số ra: Store hooks
 * Khi nào dùng: Quản lý state Alarms trong toàn app
 */

import {create} from 'zustand';
import {Alarm, CreateAlarmInput, UpdateAlarmInput} from '@/types/alarmNote';
import * as alarmsRepo from '@/repositories/alarmsRepository';

interface AlarmsState {
  alarms: Alarm[];
  loading: boolean;
  error: string | null;

  // Actions
  loadAlarmsByNoteId: (noteId: string) => Promise<void>;
  loadAllEnabledAlarms: () => Promise<void>;
  createAlarm: (input: CreateAlarmInput) => Promise<Alarm>;
  updateAlarm: (input: UpdateAlarmInput) => Promise<Alarm | null>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarmEnabled: (id: string, enabled: boolean) => Promise<void>;
  getAlarmById: (id: string) => Alarm | undefined;
  getAlarmsByNoteId: (noteId: string) => Alarm[];
}

export const useAlarmsStore = create<AlarmsState>((set, get) => ({
  alarms: [],
  loading: false,
  error: null,

  /**
   * Mục đích: Load tất cả alarms của một note
   * Tham số vào: noteId (string)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Mở AlarmManager screen
   */
  loadAlarmsByNoteId: async (noteId: string) => {
    set({loading: true, error: null});
    try {
      const alarms = await alarmsRepo.getAlarmsByNoteId(noteId);
      // Merge với alarms hiện tại (giữ alarms của notes khác)
      set(state => ({
        alarms: [
          ...state.alarms.filter(a => a.noteId !== noteId),
          ...alarms,
        ],
        loading: false,
      }));
      console.log('[AlarmsStore] Load alarms cho note:', noteId, '- Kết quả:', alarms.length);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[AlarmsStore] Lỗi load alarms:', error);
    }
  },

  /**
   * Mục đích: Load tất cả alarms đang enabled
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: Sync với notification scheduler
   */
  loadAllEnabledAlarms: async () => {
    set({loading: true, error: null});
    try {
      const alarms = await alarmsRepo.getAllEnabledAlarms();
      set({alarms, loading: false});
      console.log('[AlarmsStore] Load enabled alarms:', alarms.length);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[AlarmsStore] Lỗi load enabled alarms:', error);
    }
  },

  /**
   * Mục đích: Tạo alarm mới
   * Tham số vào: input (CreateAlarmInput)
   * Tham số ra: Promise<Alarm>
   * Khi nào dùng: Người dùng tạo alarm mới
   */
  createAlarm: async (input: CreateAlarmInput) => {
    set({loading: true, error: null});
    try {
      const alarm = await alarmsRepo.createAlarm(input);
      set(state => ({
        alarms: [alarm, ...state.alarms],
        loading: false,
      }));
      console.log('[AlarmsStore] Tạo alarm thành công:', alarm.id);
      return alarm;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[AlarmsStore] Lỗi tạo alarm:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Cập nhật alarm
   * Tham số vào: input (UpdateAlarmInput)
   * Tham số ra: Promise<Alarm | null>
   * Khi nào dùng: Người dùng chỉnh sửa alarm
   */
  updateAlarm: async (input: UpdateAlarmInput) => {
    set({loading: true, error: null});
    try {
      const updatedAlarm = await alarmsRepo.updateAlarm(input);
      if (updatedAlarm) {
        set(state => ({
          alarms: state.alarms.map(a =>
            a.id === updatedAlarm.id ? updatedAlarm : a,
          ),
          loading: false,
        }));
        console.log('[AlarmsStore] Cập nhật alarm thành công:', updatedAlarm.id);
      }
      return updatedAlarm;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[AlarmsStore] Lỗi cập nhật alarm:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Xóa alarm
   * Tham số vào: id (string)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Người dùng xóa alarm
   */
  deleteAlarm: async (id: string) => {
    set({loading: true, error: null});
    try {
      await alarmsRepo.deleteAlarm(id);
      set(state => ({
        alarms: state.alarms.filter(a => a.id !== id),
        loading: false,
      }));
      console.log('[AlarmsStore] Xóa alarm thành công:', id);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[AlarmsStore] Lỗi xóa alarm:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Bật/tắt alarm
   * Tham số vào: id (string), enabled (boolean)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Người dùng toggle switch alarm
   */
  toggleAlarmEnabled: async (id: string, enabled: boolean) => {
    try {
      await get().updateAlarm({id, enabled});
      console.log('[AlarmsStore] Toggle alarm:', id, '- Enabled:', enabled);
    } catch (error) {
      console.error('[AlarmsStore] Lỗi toggle alarm:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Lấy alarm theo ID từ state
   * Tham số vào: id (string)
   * Tham số ra: Alarm | undefined
   * Khi nào dùng: Selector để lấy alarm từ state
   */
  getAlarmById: (id: string) => {
    return get().alarms.find(a => a.id === id);
  },

  /**
   * Mục đích: Lấy tất cả alarms của một note từ state
   * Tham số vào: noteId (string)
   * Tham số ra: Alarm[]
   * Khi nào dùng: Selector để lấy alarms của note từ state
   */
  getAlarmsByNoteId: (noteId: string) => {
    return get().alarms.filter(a => a.noteId === noteId);
  },
}));


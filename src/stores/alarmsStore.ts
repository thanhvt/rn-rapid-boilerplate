/**
 * Mục đích: Zustand store cho Alarms state management
 * Tham số vào: Không (global state)
 * Tham số ra: Store hooks
 * Khi nào dùng: Quản lý state Alarms trong toàn app
 */

import {create} from 'zustand';
import {Alarm, CreateAlarmInput, UpdateAlarmInput} from '@/types/alarmNote';
import * as alarmsRepo from '@/repositories/alarmsRepository';
import {scheduleAlarmNotification, cancelAlarmNotification} from '@/services/notificationService';
import {useNotesStore} from './notesStore';
import {useSettingsStore} from './settingsStore';
import {calculateNextFireAt} from '@/services/alarmLogic';

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
      // 1. Tạo alarm trong DB (đã tính nextFireAt trong repository)
      const alarm = await alarmsRepo.createAlarm(input);

      // 2. Update state
      set(state => ({
        alarms: [alarm, ...state.alarms],
        loading: false,
      }));

      console.log('[AlarmsStore] Tạo alarm thành công:', alarm.id);
      console.log('[AlarmsStore] Alarm data:', {
        type: alarm.type,
        timeHHmm: alarm.timeHHmm,
        dateISO: alarm.dateISO,
        daysOfWeek: alarm.daysOfWeek,
        nextFireAt: alarm.nextFireAt,
        enabled: alarm.enabled,
      });

      // Log thời gian báo thức theo múi giờ Việt Nam
      if (alarm.nextFireAt) {
        const fireDate = new Date(alarm.nextFireAt);
        const timezone = useSettingsStore.getState().timezone;
        const now = Date.now();
        const diff = alarm.nextFireAt - now;
        const minutes = Math.floor(diff / 1000 / 60);
        const hours = Math.floor(minutes / 60);

        console.log('⏰ [AlarmsStore] ========================================');
        console.log('⏰ [AlarmsStore] THỜI GIAN BÁO THỨC:');
        console.log('⏰ [AlarmsStore] - Múi giờ:', timezone);
        console.log('⏰ [AlarmsStore] - ⏱️  CÒN:', hours > 0 ? `${hours} giờ ${minutes % 60} phút` : `${minutes} phút`);
        console.log('⏰ [AlarmsStore] - 🕐 SẼ RÉO VÀO:', fireDate.toLocaleString('vi-VN', {timeZone: timezone}));
        console.log('⏰ [AlarmsStore] - 📆 Ngày:', fireDate.toLocaleDateString('vi-VN', {timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}));
        console.log('⏰ [AlarmsStore] - 🕐 Giờ:', fireDate.toLocaleTimeString('vi-VN', {timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit'}));
        console.log('⏰ [AlarmsStore] - Timestamp:', alarm.nextFireAt);
        console.log('⏰ [AlarmsStore] - ISO String:', fireDate.toISOString());
        console.log('⏰ [AlarmsStore] ========================================');
      }

      // 3. Schedule notification nếu alarm enabled
      if (alarm.enabled && alarm.nextFireAt) {
        try {
          // Lấy note title và content để hiển thị trong notification
          const note = useNotesStore.getState().notes.find(n => n.id === alarm.noteId);
          const noteTitle = note?.title || 'Báo thức';
          const noteContent = note?.content || null;

          const fireDate = new Date(alarm.nextFireAt);
          const timezone = useSettingsStore.getState().timezone;

          console.log('[AlarmsStore] 📅 Scheduling notification cho alarm:', alarm.id);
          console.log('[AlarmsStore] Note title:', noteTitle);
          console.log('[AlarmsStore] 🕐 Báo thức sẽ reo vào:', fireDate.toLocaleString('vi-VN', {timeZone: timezone}));
          console.log('[AlarmsStore] 📆 Chi tiết:', {
            ngày: fireDate.toLocaleDateString('vi-VN', {timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}),
            giờ: fireDate.toLocaleTimeString('vi-VN', {timeZone: timezone, hour: '2-digit', minute: '2-digit'}),
          });

          await scheduleAlarmNotification(alarm, noteTitle, noteContent);
          console.log('[AlarmsStore] ✅ Đã schedule notification thành công');
        } catch (scheduleError) {
          console.error('[AlarmsStore] ❌ Lỗi schedule notification:', scheduleError);
          // Không throw error, vẫn cho phép tạo alarm thành công
        }
      } else {
        console.log('[AlarmsStore] ⚠️ Alarm không được schedule (enabled:', alarm.enabled, ', nextFireAt:', alarm.nextFireAt, ')');
      }

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
      // 1. Lấy alarm cũ để so sánh
      const oldAlarm = get().alarms.find(a => a.id === input.id);

      // 2. Nếu có thay đổi về time/date/daysOfWeek, cần recalculate nextFireAt
      const needsRecalculation =
        input.type !== undefined ||
        input.timeHHmm !== undefined ||
        input.dateISO !== undefined ||
        input.daysOfWeek !== undefined;

      if (needsRecalculation && oldAlarm) {
        // Tính nextFireAt mới
        const timezone = useSettingsStore.getState().timezone;
        const alarmForCalculation = {
          ...oldAlarm,
          ...input,
        };

        const newNextFireAt = calculateNextFireAt(alarmForCalculation, timezone);
        console.log('[AlarmsStore] Recalculate nextFireAt:', newNextFireAt);

        // Update nextFireAt trong input
        if (newNextFireAt !== null) {
          await alarmsRepo.updateNextFireAt(input.id, newNextFireAt);
        }
      }

      // 3. Update alarm trong DB
      const updatedAlarm = await alarmsRepo.updateAlarm(input);

      if (updatedAlarm) {
        // 4. Update state
        set(state => ({
          alarms: state.alarms.map(a =>
            a.id === updatedAlarm.id ? updatedAlarm : a,
          ),
          loading: false,
        }));

        console.log('[AlarmsStore] Cập nhật alarm thành công:', updatedAlarm.id);

        // 5. Reschedule notification
        try {
          // Cancel notification cũ
          await cancelAlarmNotification(updatedAlarm.id);
          console.log('[AlarmsStore] ❌ Đã cancel notification cũ');

          // Schedule lại nếu enabled
          if (updatedAlarm.enabled && updatedAlarm.nextFireAt) {
            const note = useNotesStore.getState().notes.find(n => n.id === updatedAlarm.noteId);
            const noteTitle = note?.title || 'Báo thức';
            const noteContent = note?.content || null;

            const fireDate = new Date(updatedAlarm.nextFireAt);
            const timezone = useSettingsStore.getState().timezone;

            console.log('[AlarmsStore] 📅 Rescheduling notification cho alarm:', updatedAlarm.id);
            console.log('[AlarmsStore] 🕐 Báo thức sẽ reo vào:', fireDate.toLocaleString('vi-VN', {timeZone: timezone}));

            await scheduleAlarmNotification(updatedAlarm, noteTitle, noteContent);
            console.log('[AlarmsStore] ✅ Đã reschedule notification thành công');
          } else {
            console.log('[AlarmsStore] ⚠️ Alarm disabled hoặc không có nextFireAt, không schedule');
          }
        } catch (scheduleError) {
          console.error('[AlarmsStore] ❌ Lỗi reschedule notification:', scheduleError);
        }
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
      // 1. Cancel notification trước
      try {
        await cancelAlarmNotification(id);
        console.log('[AlarmsStore] ❌ Đã cancel notification');
      } catch (cancelError) {
        console.error('[AlarmsStore] Lỗi cancel notification:', cancelError);
      }

      // 2. Xóa alarm khỏi DB
      await alarmsRepo.deleteAlarm(id);

      // 3. Update state
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
}));


/**
 * Mục đích: Business logic cho Alarm - tính toán nextFireAt
 * Tham số vào: Alarm data
 * Tham số ra: nextFireAt timestamp
 * Khi nào dùng: Khi tạo/cập nhật alarm, tính lần nổ kế tiếp
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import {Alarm, AlarmType} from '@/types/alarmNote';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

/**
 * Mục đích: Tính nextFireAt cho ONE_TIME alarm
 * Tham số vào: dateISO (string), timeHHmm (string), tz (string)
 * Tham số ra: number (timestamp ms) hoặc null
 * Khi nào dùng: Khi tạo/cập nhật ONE_TIME alarm
 */
export function calculateNextFireAtOneTime(
  dateISO: string,
  timeHHmm: string,
  tz: string = 'Asia/Ho_Chi_Minh',
): number | null {
  try {
    const [hour, minute] = timeHHmm.split(':').map(Number);
    
    // Tạo datetime từ dateISO + timeHHmm
    const targetDate = dayjs.tz(dateISO, tz)
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0);

    const now = dayjs.tz(undefined, tz);

    // Nếu thời gian đã qua, trả về null (hoặc có thể suggest ngày mai)
    if (targetDate.isSameOrBefore(now)) {
      console.log('[AlarmLogic] ONE_TIME đã qua, không schedule:', targetDate.format());
      return null;
    }

    const timestamp = targetDate.valueOf();
    console.log('[AlarmLogic] ONE_TIME nextFireAt:', targetDate.format(), '- Timestamp:', timestamp);
    return timestamp;
  } catch (error) {
    console.error('[AlarmLogic] Lỗi tính ONE_TIME nextFireAt:', error);
    return null;
  }
}

/**
 * Mục đích: Suggest ngày kế tiếp nếu ONE_TIME đã qua
 * Tham số vào: dateISO (string), timeHHmm (string), tz (string)
 * Tham số ra: string (ISO date) cho ngày mai
 * Khi nào dùng: Khi người dùng chọn thời gian đã qua
 */
export function suggestNextDayForOneTime(
  dateISO: string,
  timeHHmm: string,
  tz: string = 'Asia/Ho_Chi_Minh',
): string {
  const [hour, minute] = timeHHmm.split(':').map(Number);
  
  const targetDate = dayjs.tz(dateISO, tz)
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0);

  const now = dayjs.tz(undefined, tz);

  if (targetDate.isSameOrBefore(now)) {
    // Suggest ngày mai cùng giờ
    const tomorrow = now.add(1, 'day')
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0);
    
    const suggestedDate = tomorrow.format('YYYY-MM-DD');
    console.log('[AlarmLogic] Suggest ngày mai:', suggestedDate);
    return suggestedDate;
  }

  return dateISO;
}

/**
 * Mục đích: Tính nextFireAt cho REPEATING alarm
 * Tham số vào: timeHHmm (string), daysOfWeek (number[]), tz (string)
 * Tham số ra: number (timestamp ms) hoặc null
 * Khi nào dùng: Khi tạo/cập nhật REPEATING alarm
 */
export function calculateNextFireAtRepeating(
  timeHHmm: string,
  daysOfWeek: number[],
  tz: string = 'Asia/Ho_Chi_Minh',
): number | null {
  try {
    if (!daysOfWeek || daysOfWeek.length === 0) {
      console.error('[AlarmLogic] REPEATING phải có daysOfWeek');
      return null;
    }

    const [hour, minute] = timeHHmm.split(':').map(Number);
    const now = dayjs.tz(undefined, tz);

    // Tìm lần nổ kế tiếp trong 7 ngày tới
    for (let i = 0; i < 7; i++) {
      const candidate = now.add(i, 'day')
        .hour(hour)
        .minute(minute)
        .second(0)
        .millisecond(0);

      const candidateWeekday = candidate.day(); // 0=Sunday, 1=Monday...

      // Kiểm tra xem ngày này có trong daysOfWeek không
      if (daysOfWeek.includes(candidateWeekday)) {
        // Nếu là hôm nay, phải sau thời điểm hiện tại
        if (i === 0 && candidate.isSameOrBefore(now)) {
          continue;
        }

        const timestamp = candidate.valueOf();
        console.log('[AlarmLogic] REPEATING nextFireAt:', candidate.format(), '- Timestamp:', timestamp);
        return timestamp;
      }
    }

    console.error('[AlarmLogic] Không tìm thấy nextFireAt cho REPEATING');
    return null;
  } catch (error) {
    console.error('[AlarmLogic] Lỗi tính REPEATING nextFireAt:', error);
    return null;
  }
}

/**
 * Mục đích: Tính nextFireAt cho alarm (wrapper)
 * Tham số vào: alarm (Partial<Alarm>), tz (string)
 * Tham số ra: number | null
 * Khi nào dùng: Khi tạo/cập nhật alarm
 */
export function calculateNextFireAt(
  alarm: Partial<Alarm>,
  tz: string = 'Asia/Ho_Chi_Minh',
): number | null {
  if (!alarm.type || !alarm.timeHHmm) {
    console.error('[AlarmLogic] Thiếu type hoặc timeHHmm');
    return null;
  }

  if (alarm.type === 'ONE_TIME') {
    if (!alarm.dateISO) {
      console.error('[AlarmLogic] ONE_TIME phải có dateISO');
      return null;
    }
    return calculateNextFireAtOneTime(alarm.dateISO, alarm.timeHHmm, tz);
  } else if (alarm.type === 'REPEATING') {
    if (!alarm.daysOfWeek || alarm.daysOfWeek.length === 0) {
      console.error('[AlarmLogic] REPEATING phải có daysOfWeek');
      return null;
    }
    return calculateNextFireAtRepeating(alarm.timeHHmm, alarm.daysOfWeek, tz);
  }

  return null;
}

/**
 * Mục đích: Validate alarm input
 * Tham số vào: type, timeHHmm, dateISO, daysOfWeek
 * Tham số ra: {valid: boolean, error?: string}
 * Khi nào dùng: Trước khi lưu alarm
 */
export function validateAlarmInput(
  type: AlarmType,
  timeHHmm: string,
  dateISO?: string,
  daysOfWeek?: number[],
): {valid: boolean; error?: string} {
  // Validate timeHHmm format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(timeHHmm)) {
    return {valid: false, error: 'Định dạng giờ không hợp lệ (phải là HH:mm)'};
  }

  if (type === 'ONE_TIME') {
    if (!dateISO) {
      return {valid: false, error: 'Báo thức ONE_TIME phải có ngày'};
    }

    // Validate dateISO format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateISO)) {
      return {valid: false, error: 'Định dạng ngày không hợp lệ (phải là YYYY-MM-DD)'};
    }
  } else if (type === 'REPEATING') {
    if (!daysOfWeek || daysOfWeek.length === 0) {
      return {valid: false, error: 'Báo thức REPEATING phải chọn ít nhất 1 ngày'};
    }

    // Validate daysOfWeek values (0-6)
    const invalidDays = daysOfWeek.filter(day => day < 0 || day > 6);
    if (invalidDays.length > 0) {
      return {valid: false, error: 'Ngày trong tuần không hợp lệ (phải từ 0-6)'};
    }
  }

  return {valid: true};
}

/**
 * Mục đích: Tạo alarm Snooze (now + N phút)
 * Tham số vào: originalAlarm (Alarm), snoozeMinutes (number), tz (string)
 * Tham số ra: Partial<Alarm> cho alarm mới
 * Khi nào dùng: Khi người dùng nhấn Snooze
 */
export function createSnoozeAlarm(
  originalAlarm: Alarm,
  snoozeMinutes: number,
  tz: string = 'Asia/Ho_Chi_Minh',
): Partial<Alarm> {
  const now = dayjs.tz(undefined, tz);
  const snoozeTime = now.add(snoozeMinutes, 'minute');

  const snoozeAlarm: Partial<Alarm> = {
    noteId: originalAlarm.noteId,
    type: 'ONE_TIME',
    timeHHmm: snoozeTime.format('HH:mm'),
    dateISO: snoozeTime.format('YYYY-MM-DD'),
    daysOfWeek: null,
    enabled: true,
    nextFireAt: snoozeTime.valueOf(),
  };

  console.log('[AlarmLogic] Tạo snooze alarm:', snoozeTime.format(), '- Snooze:', snoozeMinutes, 'phút');
  return snoozeAlarm;
}

/**
 * Mục đích: Recompute nextFireAt cho REPEATING alarm sau khi nổ
 * Tham số vào: alarm (Alarm), tz (string)
 * Tham số ra: number | null
 * Khi nào dùng: Sau khi REPEATING alarm nổ, tính lần kế tiếp
 */
export function recomputeNextFireAtAfterFire(
  alarm: Alarm,
  tz: string = 'Asia/Ho_Chi_Minh',
): number | null {
  if (alarm.type !== 'REPEATING') {
    // ONE_TIME không recompute, disable sau khi nổ
    return null;
  }

  return calculateNextFireAtRepeating(alarm.timeHHmm, alarm.daysOfWeek!, tz);
}


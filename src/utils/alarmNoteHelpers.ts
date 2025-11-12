/**
 * Mục đích: Utility functions dùng chung cho AlarmNote
 * Tham số vào: Tùy function
 * Tham số ra: Tùy function
 * Khi nào dùng: Import vào các module cần sử dụng
 */

/**
 * Mục đích: Tạo UUID đơn giản (timestamp + random)
 * Tham số vào: Không
 * Tham số ra: string
 * Khi nào dùng: Tạo ID cho Note, Alarm
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${randomPart}`;
}

/**
 * Mục đích: Validate format HH:mm
 * Tham số vào: time (string)
 * Tham số ra: boolean
 * Khi nào dùng: Validate input giờ báo thức
 */
export function isValidTimeHHmm(time: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

/**
 * Mục đích: Validate daysOfWeek array
 * Tham số vào: days (number[])
 * Tham số ra: boolean
 * Khi nào dùng: Validate input ngày lặp báo thức
 */
export function isValidDaysOfWeek(days: number[]): boolean {
  if (!Array.isArray(days) || days.length === 0) {
    return false;
  }
  return days.every(day => day >= 0 && day <= 6);
}

/**
 * Mục đích: Generate random time trong khoảng 08:00 - 18:00, chia hết cho 5 phút
 * Tham số vào: Không
 * Tham số ra: string (HH:mm format)
 * Khi nào dùng: Tạo random time cho RANDOM alarm type
 */
export function generateRandomTime(): string {
  // Random giờ từ 8 đến 18 (8:00 AM - 6:00 PM)
  const minHour = 8;
  const maxHour = 18;

  // Random phút chia hết cho 5 (0, 5, 10, ..., 55)
  const minuteIntervals = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const hour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
  const minute = minuteIntervals[Math.floor(Math.random() * minuteIntervals.length)];

  // Format HH:mm
  const hourStr = hour.toString().padStart(2, '0');
  const minuteStr = minute.toString().padStart(2, '0');

  return `${hourStr}:${minuteStr}`;
}

/**
 * Mục đích: Generate random times cho tất cả các ngày được chọn
 * Tham số vào: daysOfWeek (number[])
 * Tham số ra: Record<number, string> - {0: '09:30', 1: '14:15', ...}
 * Khi nào dùng: Tạo random times cho RANDOM alarm type
 */
export function generateRandomTimesForDays(daysOfWeek: number[]): Record<number, string> {
  const randomTimes: Record<number, string> = {};

  for (const day of daysOfWeek) {
    randomTimes[day] = generateRandomTime();
  }

  return randomTimes;
}

/**
 * Mục đích: Format timestamp thành string hiển thị
 * Tham số vào: timestamp (number)
 * Tham số ra: string
 * Khi nào dùng: Hiển thị ngày giờ trong UI
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN');
}

/**
 * Mục đích: Lấy tên ngày trong tuần (tiếng Việt)
 * Tham số vào: dayIndex (0-6, 0=Sunday)
 * Tham số ra: string
 * Khi nào dùng: Hiển thị ngày lặp báo thức
 */
export function getDayName(dayIndex: number): string {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[dayIndex] || '';
}

/**
 * Mục đích: Lấy tên đầy đủ ngày trong tuần (tiếng Việt)
 * Tham số vào: dayIndex (0-6, 0=Sunday)
 * Tham số ra: string
 * Khi nào dùng: Hiển thị chi tiết ngày lặp
 */
export function getDayFullName(dayIndex: number): string {
  const days = [
    'Chủ nhật',
    'Thứ hai',
    'Thứ ba',
    'Thứ tư',
    'Thứ năm',
    'Thứ sáu',
    'Thứ bảy',
  ];
  return days[dayIndex] || '';
}


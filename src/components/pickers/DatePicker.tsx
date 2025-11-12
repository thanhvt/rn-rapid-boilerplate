/**
 * Mục đích: Component chọn ngày (YYYY-MM-DD)
 * Tham số vào: value (string ISO date), onChange (callback)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi cần chọn ngày trong AlarmEditor (ONE_TIME)
 */

import React, {useState, useCallback, useMemo} from 'react';
import {View, Pressable, Platform} from 'react-native';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import {AppText, Icon, AppButton, Chip} from '@/components/ui';
import {useColors} from '@/hooks/useColors';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  label?: string;
}

export function DatePicker({
  value,
  onChange,
  label = 'Ngày',
}: DatePickerProps): React.JSX.Element {
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);

  /**
   * Mục đích: Chuyển YYYY-MM-DD string thành Date object
   * Tham số vào: dateStr (string YYYY-MM-DD)
   * Tham số ra: Date
   * Khi nào dùng: Khi cần hiển thị picker
   */
  const parseDate = useCallback((dateStr: string): Date => {
    return dayjs(dateStr).toDate();
  }, []);

  /**
   * Mục đích: Xử lý khi người dùng chọn ngày
   * Tham số vào: event, selectedDate (Date)
   * Tham số ra: void
   * Khi nào dùng: Callback từ DateTimePicker
   */
  const handleChange = useCallback(
    (_event: any, selectedDate?: Date) => {
      setShowPicker(Platform.OS === 'ios'); // iOS giữ picker mở, Android đóng

      if (selectedDate) {
        const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
        onChange(dateStr);
      }
    },
    [onChange],
  );

  /**
   * Mục đích: Mở picker
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User nhấn vào date display
   */
  const handleOpen = useCallback(() => {
    setShowPicker(true);
  }, []);

  /**
   * Mục đích: Đóng picker
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User nhấn Done (iOS)
   */
  const handleClose = useCallback(() => {
    setShowPicker(false);
  }, []);

  /**
   * Mục đích: Quick date selection
   * Tham số vào: daysToAdd (number)
   * Tham số ra: void
   * Khi nào dùng: User chọn quick date
   */
  const setQuickDate = useCallback(
    (daysToAdd: number) => {
      const newDate = dayjs().add(daysToAdd, 'day').format('YYYY-MM-DD');
      onChange(newDate);
    },
    [onChange],
  );

  // Format hiển thị
  const displayDate = useMemo(() => dayjs(value).format('DD/MM/YYYY'), [value]);
  const displayDay = useMemo(() => {
    const day = dayjs(value);
    const today = dayjs();
    const diff = day.diff(today, 'day');

    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Ngày mai';
    if (diff === 2) return 'Ngày kia';
    return day.format('dddd');
  }, [value]);

  return (
    <View className="mb-6">
      <AppText variant="body" weight="semibold" className="text-foreground mb-3">
        {label}
      </AppText>

      {/* Quick date buttons */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        <Chip
          variant={dayjs(value).isSame(dayjs(), 'day') ? 'primary' : 'outline'}
          selected={dayjs(value).isSame(dayjs(), 'day')}
          onPress={() => setQuickDate(0)}
          icon={<Icon name="Calendar" className="w-4 h-4" />}>
          Hôm nay
        </Chip>
        <Chip
          variant={
            dayjs(value).isSame(dayjs().add(1, 'day'), 'day') ? 'primary' : 'outline'
          }
          selected={dayjs(value).isSame(dayjs().add(1, 'day'), 'day')}
          onPress={() => setQuickDate(1)}
          icon={<Icon name="CalendarPlus" className="w-4 h-4" />}>
          Ngày mai
        </Chip>
        <Chip
          variant={
            dayjs(value).isSame(dayjs().add(2, 'day'), 'day') ? 'primary' : 'outline'
          }
          selected={dayjs(value).isSame(dayjs().add(2, 'day'), 'day')}
          onPress={() => setQuickDate(2)}
          icon={<Icon name="CalendarDays" className="w-4 h-4" />}>
          Ngày kia
        </Chip>
      </View>

      {/* Nút hiển thị ngày hiện tại */}
      <Pressable
        onPress={handleOpen}
        style={{
          backgroundColor: colors.neutrals1000,
          borderColor: colors.primary,
        }}
        className="rounded-lg p-6 border-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <AppText variant="bodySmall" className="text-neutrals400 mb-1">
              {displayDay}
            </AppText>
            <AppText variant="heading2" weight="bold" className="text-primary" raw>
              {displayDate}
            </AppText>
          </View>
          <Icon name="Calendar" className="w-8 h-8 text-primary" />
        </View>
      </Pressable>

      {/* DateTimePicker */}
      {showPicker && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <DateTimePicker
            value={parseDate(value)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            minimumDate={new Date()} // Không cho chọn ngày quá khứ
          />
        </Animated.View>
      )}

      {/* Nút Done cho iOS */}
      {showPicker && Platform.OS === 'ios' && (
        <Animated.View
          entering={FadeIn.delay(100).duration(200)}
          exiting={FadeOut.duration(200)}
          className="mt-3">
          <AppButton variant="primary" onPress={handleClose}>
            <View className="flex-row items-center gap-2">
              <Icon name="Check" className="w-5 h-5 text-background" />
              <AppText variant="body" weight="semibold" className="text-background" raw>
                Xong
              </AppText>
            </View>
          </AppButton>
        </Animated.View>
      )}
    </View>
  );
}


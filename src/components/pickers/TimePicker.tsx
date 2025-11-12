/**
 * Mục đích: Component chọn giờ (HH:mm)
 * Tham số vào: value (string HH:mm), onChange (callback)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi cần chọn giờ trong AlarmEditor
 */

import React, {useState, useCallback} from 'react';
import {View, Pressable, Platform} from 'react-native';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import {AppText, Icon, AppButton} from '@/components/ui';
import {useColors} from '@/hooks/useColors';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({
  value,
  onChange,
  label = 'Thời gian',
}: TimePickerProps): React.JSX.Element {
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);

  /**
   * Mục đích: Chuyển HH:mm string thành Date object
   * Tham số vào: timeStr (string HH:mm)
   * Tham số ra: Date
   * Khi nào dùng: Khi cần hiển thị picker
   */
  const parseTimeToDate = useCallback((timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    return date;
  }, []);

  /**
   * Mục đích: Xử lý khi người dùng chọn giờ
   * Tham số vào: event, selectedDate (Date)
   * Tham số ra: void
   * Khi nào dùng: Callback từ DateTimePicker
   */
  const handleChange = useCallback(
    (event: any, selectedDate?: Date) => {
      setShowPicker(Platform.OS === 'ios'); // iOS giữ picker mở, Android đóng

      if (selectedDate) {
        const hours = selectedDate.getHours().toString().padStart(2, '0');
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
        onChange(`${hours}:${minutes}`);
      }
    },
    [onChange],
  );

  /**
   * Mục đích: Mở picker
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User nhấn vào time display
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

  return (
    <View className="mb-6">
      <AppText variant="body" weight="semibold" className="text-foreground mb-3">
        {label}
      </AppText>

      {/* Nút hiển thị giờ hiện tại */}
      <Pressable
        onPress={handleOpen}
        style={{
          backgroundColor: colors.neutrals1000,
          borderColor: colors.primary,
        }}
        className="rounded-lg p-6 border-2 items-center">
        <View className="flex-row items-center gap-3">
          <Icon name="Clock" className="w-8 h-8 text-primary" />
          <AppText
            variant="heading1"
            weight="bold"
            className="text-primary"
            style={{fontSize: 48}}
            raw>
            {value}
          </AppText>
        </View>
      </Pressable>

      {/* DateTimePicker */}
      {showPicker && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <DateTimePicker
            value={parseTimeToDate(value)}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
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


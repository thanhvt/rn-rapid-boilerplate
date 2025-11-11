/**
 * Mục đích: Component chọn giờ (HH:mm)
 * Tham số vào: value (string HH:mm), onChange (callback)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi cần chọn giờ trong AlarmEditor
 */

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

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
  const [showPicker, setShowPicker] = useState(false);

  /**
   * Mục đích: Chuyển HH:mm string thành Date object
   * Tham số vào: timeStr (string HH:mm)
   * Tham số ra: Date
   * Khi nào dùng: Khi cần hiển thị picker
   */
  const parseTimeToDate = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    return date;
  };

  /**
   * Mục đích: Xử lý khi người dùng chọn giờ
   * Tham số vào: event, selectedDate (Date)
   * Tham số ra: void
   * Khi nào dùng: Callback từ DateTimePicker
   */
  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // iOS giữ picker mở, Android đóng

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>

      {/* Nút hiển thị giờ hiện tại */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-white rounded-lg p-4 border border-gray-200">
        <Text className="text-3xl font-bold text-center text-gray-800">
          {value}
        </Text>
      </TouchableOpacity>

      {/* DateTimePicker */}
      {showPicker && (
        <DateTimePicker
          value={parseTimeToDate(value)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}

      {/* Nút Done cho iOS */}
      {showPicker && Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={() => setShowPicker(false)}
          className="bg-primary-500 py-3 rounded-lg mt-2">
          <Text className="text-white text-center font-semibold">Xong</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


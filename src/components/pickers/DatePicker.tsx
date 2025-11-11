/**
 * Mục đích: Component chọn ngày (YYYY-MM-DD)
 * Tham số vào: value (string ISO date), onChange (callback)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi cần chọn ngày trong AlarmEditor (ONE_TIME)
 */

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

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
  const [showPicker, setShowPicker] = useState(false);

  /**
   * Mục đích: Chuyển YYYY-MM-DD string thành Date object
   * Tham số vào: dateStr (string YYYY-MM-DD)
   * Tham số ra: Date
   * Khi nào dùng: Khi cần hiển thị picker
   */
  const parseDate = (dateStr: string): Date => {
    return dayjs(dateStr).toDate();
  };

  /**
   * Mục đích: Xử lý khi người dùng chọn ngày
   * Tham số vào: event, selectedDate (Date)
   * Tham số ra: void
   * Khi nào dùng: Callback từ DateTimePicker
   */
  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // iOS giữ picker mở, Android đóng

    if (selectedDate) {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      onChange(dateStr);
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>

      {/* Nút hiển thị ngày hiện tại */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-white rounded-lg p-4 border border-gray-200">
        <Text className="text-lg font-semibold text-center text-gray-800">
          {dayjs(value).format('DD/MM/YYYY')}
        </Text>
      </TouchableOpacity>

      {/* DateTimePicker */}
      {showPicker && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={new Date()} // Không cho chọn ngày quá khứ
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


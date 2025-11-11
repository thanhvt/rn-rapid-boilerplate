/**
 * Mục đích: Màn hình tạo/chỉnh sửa báo thức
 * Tham số vào: navigation props, route params (noteId, alarmId?)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi người dùng tạo mới hoặc chỉnh sửa báo thức
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAlarmsStore} from '@/stores/alarmsStore';
import {useSettingsStore} from '@/stores/settingsStore';
import {AlarmType} from '@/types/alarmNote';
import {
  validateAlarmInput,
  suggestNextDayForOneTime,
} from '@/services/alarmLogic';
import {getDayFullName} from '@/utils/alarmNoteHelpers';
import {TimePicker} from '@/components/pickers/TimePicker';
import {DatePicker} from '@/components/pickers/DatePicker';
import dayjs from 'dayjs';
import type {RootStackParamList} from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmEditor'>;

export function AlarmEditorScreen({route, navigation}: Props): React.JSX.Element {
  const {noteId, alarmId} = route.params;
  const isEditing = !!alarmId;

  const alarm = useAlarmsStore(state =>
    alarmId ? state.getAlarmById(alarmId) : undefined,
  );
  const createAlarm = useAlarmsStore(state => state.createAlarm);
  const updateAlarm = useAlarmsStore(state => state.updateAlarm);
  const timezone = useSettingsStore(state => state.timezone);

  // Form state
  const [type, setType] = useState<AlarmType>(alarm?.type || 'ONE_TIME');
  const [timeHHmm, setTimeHHmm] = useState(alarm?.timeHHmm || '08:00');
  const [dateISO, setDateISO] = useState(
    alarm?.dateISO || dayjs().format('YYYY-MM-DD'),
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    alarm?.daysOfWeek || [],
  );

  useEffect(() => {
    // Load alarm data nếu đang edit
    if (alarm) {
      setType(alarm.type);
      setTimeHHmm(alarm.timeHHmm);
      setDateISO(alarm.dateISO || dayjs().format('YYYY-MM-DD'));
      setDaysOfWeek(alarm.daysOfWeek || []);
    }
  }, [alarm]);

  /**
   * Mục đích: Toggle ngày trong tuần
   * Tham số vào: day (number 0-6)
   * Tham số ra: void
   * Khi nào dùng: Khi người dùng chọn/bỏ chọn ngày
   */
  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  /**
   * Mục đích: Chọn tất cả các ngày
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Khi người dùng nhấn "Tất cả các ngày"
   */
  const selectAllDays = () => {
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
  };

  /**
   * Mục đích: Xử lý lưu alarm
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: Khi người dùng nhấn nút Lưu
   */
  const handleSave = async () => {
    // Validate input
    const validation = validateAlarmInput(type, timeHHmm, dateISO, daysOfWeek);
    if (!validation.valid) {
      Alert.alert('Lỗi', validation.error);
      return;
    }

    // Kiểm tra nếu ONE_TIME đã qua, suggest ngày mai
    if (type === 'ONE_TIME') {
      const suggestedDate = suggestNextDayForOneTime(dateISO, timeHHmm, timezone);
      if (suggestedDate !== dateISO) {
        Alert.alert(
          'Thời gian đã qua',
          `Thời gian bạn chọn đã qua. Bạn có muốn đặt cho ngày mai (${dayjs(
            suggestedDate,
          ).format('DD/MM/YYYY')})?`,
          [
            {text: 'Hủy', style: 'cancel'},
            {
              text: 'Đồng ý',
              onPress: () => {
                setDateISO(suggestedDate);
                saveAlarm(suggestedDate);
              },
            },
          ],
        );
        return;
      }
    }

    await saveAlarm(dateISO);
  };

  /**
   * Mục đích: Lưu alarm vào DB
   * Tham số vào: finalDateISO (string)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Internal helper
   */
  const saveAlarm = async (finalDateISO: string) => {
    try {
      if (isEditing && alarmId) {
        // Update existing alarm
        await updateAlarm({
          id: alarmId,
          type,
          timeHHmm,
          dateISO: type === 'ONE_TIME' ? finalDateISO : undefined,
          daysOfWeek: type === 'REPEATING' ? daysOfWeek : undefined,
        });
      } else {
        // Create new alarm
        await createAlarm({
          noteId,
          type,
          timeHHmm,
          dateISO: type === 'ONE_TIME' ? finalDateISO : undefined,
          daysOfWeek: type === 'REPEATING' ? daysOfWeek : undefined,
        });
      }

      Alert.alert('Thành công', 'Đã lưu báo thức', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu báo thức');
      console.error('[AlarmEditor] Lỗi lưu alarm:', error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Chọn loại báo thức */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Loại báo thức
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setType('ONE_TIME')}
              className={`flex-1 mr-2 py-3 rounded-lg border-2 ${
                type === 'ONE_TIME'
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-200'
              }`}>
              <Text
                className={`text-center font-medium ${
                  type === 'ONE_TIME' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                Một lần
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType('REPEATING')}
              className={`flex-1 ml-2 py-3 rounded-lg border-2 ${
                type === 'REPEATING'
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-200'
              }`}>
              <Text
                className={`text-center font-medium ${
                  type === 'REPEATING' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                Lặp lại
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chọn giờ */}
        <TimePicker value={timeHHmm} onChange={setTimeHHmm} />

        {/* Chọn ngày (ONE_TIME) */}
        {type === 'ONE_TIME' && (
          <DatePicker value={dateISO} onChange={setDateISO} />
        )}

        {/* Chọn ngày trong tuần (REPEATING) */}
        {type === 'REPEATING' && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Lặp vào các ngày
            </Text>

            {/* Nút "Tất cả các ngày" */}
            <TouchableOpacity
              onPress={selectAllDays}
              className="bg-blue-50 py-2 px-4 rounded-lg mb-3">
              <Text className="text-blue-600 text-center font-medium">
                Tất cả các ngày
              </Text>
            </TouchableOpacity>

            {/* Chips ngày trong tuần */}
            <View className="flex-row flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(day)}
                  className={`mr-2 mb-2 px-4 py-2 rounded-full border-2 ${
                    daysOfWeek.includes(day)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}>
                  <Text
                    className={`font-medium ${
                      daysOfWeek.includes(day) ? 'text-white' : 'text-gray-600'
                    }`}>
                    {getDayFullName(day)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {daysOfWeek.length === 0 && (
              <Text className="text-red-500 text-sm mt-2">
                * Vui lòng chọn ít nhất 1 ngày
              </Text>
            )}
          </View>
        )}

        {/* Nút Lưu */}
        <TouchableOpacity
          onPress={handleSave}
          className="bg-blue-500 py-4 rounded-lg mt-4">
          <Text className="text-white text-center font-semibold text-base">
            {isEditing ? 'Cập nhật' : 'Tạo báo thức'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


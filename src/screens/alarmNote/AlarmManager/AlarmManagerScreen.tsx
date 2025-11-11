/**
 * Mục đích: Màn hình quản lý báo thức của một ghi chú
 * Tham số vào: navigation props, route params (noteId)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi người dùng muốn xem/quản lý báo thức của ghi chú
 */

import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAlarmsStore} from '@/stores/alarmsStore';
import {useNotesStore} from '@/stores/notesStore';
import {getDayName} from '@/utils/alarmNoteHelpers';
import dayjs from 'dayjs';
import type {RootStackParamList} from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmManager'>;

export function AlarmManagerScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const {noteId} = route.params;

  const notes = useNotesStore(state => state.notes);
  const note = useMemo(() => notes.find(n => n.id === noteId), [notes, noteId]);

  // Lấy alarms từ state và filter bằng useMemo để tránh re-render
  const allAlarms = useAlarmsStore(state => state.alarms);
  const alarms = useMemo(
    () => allAlarms.filter(a => a.noteId === noteId),
    [allAlarms, noteId]
  );

  const loading = useAlarmsStore(state => state.loading);
  const loadAlarmsByNoteId = useAlarmsStore(state => state.loadAlarmsByNoteId);
  const toggleAlarmEnabled = useAlarmsStore(state => state.toggleAlarmEnabled);
  const deleteAlarm = useAlarmsStore(state => state.deleteAlarm);

  useEffect(() => {
    // Load alarms khi vào màn hình
    loadAlarmsByNoteId(noteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  /**
   * Mục đích: Xử lý toggle enable/disable alarm
   * Tham số vào: alarmId (string), enabled (boolean)
   * Tham số ra: void
   * Khi nào dùng: Khi người dùng toggle switch
   */
  const handleToggle = async (alarmId: string, enabled: boolean) => {
    try {
      await toggleAlarmEnabled(alarmId, enabled);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật báo thức');
    }
  };

  /**
   * Mục đích: Xử lý xóa alarm
   * Tham số vào: alarmId (string)
   * Tham số ra: void
   * Khi nào dùng: Khi người dùng nhấn nút xóa
   */
  const handleDelete = (alarmId: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa báo thức này?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAlarm(alarmId);
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa báo thức');
          }
        },
      },
    ]);
  };

  /**
   * Mục đích: Format hiển thị alarm
   * Tham số vào: alarm
   * Tham số ra: string
   * Khi nào dùng: Render alarm item
   */
  const formatAlarmDisplay = (alarm: any) => {
    if (alarm.type === 'ONE_TIME') {
      const date = dayjs(alarm.dateISO).format('DD/MM/YYYY');
      return `${alarm.timeHHmm} - ${date}`;
    } else {
      const days = alarm.daysOfWeek
        .map((d: number) => getDayName(d))
        .join(', ');
      return `${alarm.timeHHmm} - ${days}`;
    }
  };

  if (loading && alarms.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800">
          {note?.title || 'Ghi chú'}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          {alarms.length} báo thức
        </Text>
      </View>

      {/* Danh sách alarms */}
      <FlatList
        data={alarms}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 16}}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 text-center mb-4">
              Chưa có báo thức nào
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Nhấn nút + để thêm báo thức mới
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-800">
                  {formatAlarmDisplay(item)}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {item.type === 'ONE_TIME' ? 'Một lần' : 'Lặp lại'}
                </Text>
                {item.nextFireAt && (
                  <Text className="text-xs text-gray-400 mt-1">
                    Kế tiếp: {dayjs(item.nextFireAt).format('DD/MM HH:mm')}
                  </Text>
                )}
              </View>

              <Switch
                value={item.enabled}
                onValueChange={enabled => handleToggle(item.id, enabled)}
                trackColor={{false: '#d1d5db', true: '#93c5fd'}}
                thumbColor={item.enabled ? '#3b82f6' : '#f3f4f6'}
              />
            </View>

            {/* Actions */}
            <View className="flex-row mt-3 pt-3 border-t border-gray-100">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AlarmEditor', {
                    noteId,
                    alarmId: item.id,
                  })
                }
                className="flex-1 mr-2 py-2 bg-blue-50 rounded-md">
                <Text className="text-blue-600 text-center font-medium">
                  Chỉnh sửa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                className="flex-1 ml-2 py-2 bg-red-50 rounded-md">
                <Text className="text-red-600 text-center font-medium">Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Nút thêm báo thức */}
      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.navigate('AlarmEditor', {noteId})}
          className="bg-blue-500 py-3 rounded-lg">
          <Text className="text-white text-center font-semibold text-base">
            + Thêm báo thức
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


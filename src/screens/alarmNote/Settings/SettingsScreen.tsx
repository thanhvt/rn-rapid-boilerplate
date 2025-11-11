/**
 * Mục đích: Màn hình cài đặt ứng dụng
 * Tham số vào: navigation props
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi người dùng muốn thay đổi cài đặt (snooze, permissions...)
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSettingsStore} from '@/stores/settingsStore';
import {requestNotificationPermission} from '@/services/notificationService';
import {forceRescheduleAll} from '@/services/backgroundRefreshService';
import type {RootStackParamList} from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmNoteSettings'>;

const SNOOZE_OPTIONS = [5, 10, 15, 30];

export function SettingsScreen({}: Props): React.JSX.Element {
  const {
    snoozeMinutesDefault,
    timezone,
    loading,
    loadPreferences,
    setSnoozeMinutes,
  } = useSettingsStore();

  const [notificationPermission, setNotificationPermission] = useState<
    'granted' | 'denied' | 'unknown'
  >('unknown');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load preferences khi mount
  useEffect(() => {
    loadPreferences();
    checkNotificationPermission();
  }, [loadPreferences]);

  // Kiểm tra notification permission
  const checkNotificationPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
    } catch (error) {
      console.error('Lỗi khi kiểm tra notification permission:', error);
      setNotificationPermission('unknown');
    }
  };

  // Xử lý thay đổi snooze duration
  const handleSnoozeChange = async (minutes: number) => {
    try {
      await setSnoozeMinutes(minutes);
      Alert.alert('Thành công', `Đã đặt thời gian báo lại: ${minutes} phút`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật cài đặt');
      console.error('Lỗi khi cập nhật snooze:', error);
    }
  };

  // Xử lý request notification permission
  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
      if (granted) {
        Alert.alert('Thành công', 'Đã cấp quyền thông báo');
      } else {
        Alert.alert(
          'Bị từ chối',
          'Vui lòng vào Cài đặt > AlarmNote để cấp quyền thông báo',
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể yêu cầu quyền thông báo');
      console.error('Lỗi khi request permission:', error);
    }
  };

  // Xử lý force refresh notifications
  const handleRefreshNotifications = async () => {
    try {
      setIsRefreshing(true);
      console.log('[Settings] Bắt đầu force refresh notifications...');
      await forceRescheduleAll();
      Alert.alert(
        'Thành công',
        'Đã làm mới tất cả thông báo. Tất cả alarms đã được reschedule.',
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể làm mới thông báo');
      console.error('Lỗi khi refresh notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-4">Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Snooze Settings */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Thời gian báo lại
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Chọn thời gian báo lại mặc định khi nhấn "Snooze"
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {SNOOZE_OPTIONS.map(minutes => (
              <TouchableOpacity
                key={minutes}
                className={`px-4 py-3 rounded-lg ${
                  snoozeMinutesDefault === minutes
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
                onPress={() => handleSnoozeChange(minutes)}>
                <Text
                  className={`font-medium ${
                    snoozeMinutesDefault === minutes
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}>
                  {minutes} phút
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notification Permission */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Quyền thông báo
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            App cần quyền thông báo để gửi báo thức
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={`w-3 h-3 rounded-full mr-2 ${
                  notificationPermission === 'granted'
                    ? 'bg-green-500'
                    : notificationPermission === 'denied'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }`}
              />
              <Text className="text-gray-700">
                {notificationPermission === 'granted'
                  ? 'Đã cấp quyền'
                  : notificationPermission === 'denied'
                  ? 'Bị từ chối'
                  : 'Chưa xác định'}
              </Text>
            </View>

            {notificationPermission !== 'granted' && (
              <TouchableOpacity
                className="bg-blue-500 px-4 py-2 rounded-lg"
                onPress={handleRequestPermission}>
                <Text className="text-white font-medium">Yêu cầu quyền</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Refresh Notifications */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Làm mới thông báo
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Reschedule tất cả alarms. Hữu ích khi thông báo không hoạt động đúng
            hoặc sau khi cập nhật app.
          </Text>

          <TouchableOpacity
            className={`px-4 py-3 rounded-lg ${
              isRefreshing ? 'bg-gray-400' : 'bg-blue-500'
            }`}
            onPress={handleRefreshNotifications}
            disabled={isRefreshing}>
            <View className="flex-row items-center justify-center">
              {isRefreshing && (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                  className="mr-2"
                />
              )}
              <Text className="text-white font-medium text-center">
                {isRefreshing ? 'Đang làm mới...' : 'Làm mới thông báo'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Timezone Info */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Múi giờ
          </Text>
          <Text className="text-sm text-gray-600 mb-2">
            Múi giờ hiện tại của thiết bị
          </Text>
          <Text className="text-gray-700 font-mono">{timezone}</Text>
        </View>

        {/* App Info */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Thông tin ứng dụng
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Phiên bản</Text>
              <Text className="text-gray-800 font-medium">1.0.0</Text>
            </View>

            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Build</Text>
              <Text className="text-gray-800 font-medium">1</Text>
            </View>

            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Platform</Text>
              <Text className="text-gray-800 font-medium">{Platform.OS}</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Giới thiệu
          </Text>
          <Text className="text-sm text-gray-600 leading-6">
            AlarmNote là ứng dụng kết hợp ghi chú và báo thức, giúp bạn không
            bao giờ quên những việc quan trọng.
          </Text>
          <Text className="text-sm text-gray-500 mt-4">
            Phát triển bởi Vu Tien Thanh
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}


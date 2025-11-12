/**
 * Mục đích: Màn hình cài đặt ứng dụng
 * Tham số vào: navigation props
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi người dùng muốn thay đổi cài đặt (snooze, permissions...)
 */

import React, {useEffect, useState, useCallback} from 'react';
import {View, ScrollView, Platform} from 'react-native';
import Animated, {FadeInDown, FadeIn} from 'react-native-reanimated';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSettingsStore} from '@/stores/settingsStore';
import {requestNotificationPermission} from '@/services/notificationService';
import {forceRescheduleAll} from '@/services/backgroundRefreshService';
import type {RootStackParamList} from '@/navigation/types';
import {AppText, AppButton, Icon, Chip, Badge} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {useToast} from '@/components/ui/ToastProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmNoteSettings'>;

const SNOOZE_OPTIONS = [5, 10, 15, 30];

export function SettingsScreen({}: Props): React.JSX.Element {
  const colors = useColors();
  const {showSuccess, showError} = useToast();

  const snoozeMinutesDefault = useSettingsStore(
    state => state.snoozeMinutesDefault,
  );
  const timezone = useSettingsStore(state => state.timezone);
  const loading = useSettingsStore(state => state.loading);
  const loadPreferences = useSettingsStore(state => state.loadPreferences);
  const setSnoozeMinutes = useSettingsStore(state => state.setSnoozeMinutes);

  const [notificationPermission, setNotificationPermission] = useState<
    'granted' | 'denied' | 'unknown'
  >('unknown');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Mục đích: Kiểm tra notification permission
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: Component mount
   */
  const checkNotificationPermission = useCallback(async () => {
    try {
      const granted = await requestNotificationPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
    } catch (error) {
      console.error('Lỗi khi kiểm tra notification permission:', error);
      setNotificationPermission('unknown');
    }
  }, []);

  /**
   * Mục đích: Load preferences khi mount
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Component mount
   */
  useEffect(() => {
    loadPreferences();
    checkNotificationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Mục đích: Xử lý thay đổi snooze duration
   * Tham số vào: minutes (number)
   * Tham số ra: Promise<void>
   * Khi nào dùng: User chọn snooze option
   */
  const handleSnoozeChange = useCallback(
    async (minutes: number) => {
      try {
        await setSnoozeMinutes(minutes);
        showSuccess(`Đã đặt thời gian báo lại: ${minutes} phút`);
      } catch (error) {
        showError('Không thể cập nhật cài đặt');
        console.error('Lỗi khi cập nhật snooze:', error);
      }
    },
    [setSnoozeMinutes, showSuccess, showError],
  );

  /**
   * Mục đích: Xử lý request notification permission
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: User nhấn nút yêu cầu quyền
   */
  const handleRequestPermission = useCallback(async () => {
    try {
      const granted = await requestNotificationPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
      if (granted) {
        showSuccess('Đã cấp quyền thông báo');
      } else {
        showError('Vui lòng vào Cài đặt > AlarmNote để cấp quyền thông báo');
      }
    } catch (error) {
      showError('Không thể yêu cầu quyền thông báo');
      console.error('Lỗi khi request permission:', error);
    }
  }, [showSuccess, showError]);

  /**
   * Mục đích: Xử lý force refresh notifications
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: User nhấn nút làm mới thông báo
   */
  const handleRefreshNotifications = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('[Settings] Bắt đầu force refresh notifications...');
      await forceRescheduleAll();
      showSuccess(
        'Đã làm mới tất cả thông báo. Tất cả alarms đã được reschedule.',
      );
    } catch (error) {
      showError('Không thể làm mới thông báo');
      console.error('Lỗi khi refresh notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [showSuccess, showError]);

  // Loading state
  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{backgroundColor: colors.background}}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Icon name="Settings" className="w-16 h-16 text-primary mb-4" />
          <AppText variant="body" className="text-neutrals400">
            Đang tải cài đặt...
          </AppText>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{backgroundColor: colors.background}}
      showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Snooze Settings */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{
            backgroundColor: colors.neutrals1000,
            borderColor: colors.neutrals800,
          }}
          className="rounded-lg p-4 mb-4 shadow-sm border">
          <View className="flex-row items-center gap-2 mb-2">
            <Icon name="Timer" className="w-5 h-5 text-primary" />
            <AppText variant="heading3" weight="bold" className="text-foreground">
              Thời gian báo lại
            </AppText>
          </View>
          <AppText variant="bodySmall" className="text-neutrals400 mb-4">
            Chọn thời gian báo lại mặc định khi nhấn "Snooze"
          </AppText>

          <View className="flex-row flex-wrap gap-2">
            {SNOOZE_OPTIONS.map(minutes => (
              <Chip
                key={minutes}
                variant={snoozeMinutesDefault === minutes ? 'primary' : 'outline'}
                selected={snoozeMinutesDefault === minutes}
                onPress={() => handleSnoozeChange(minutes)}>
                {minutes} phút
              </Chip>
            ))}
          </View>
        </Animated.View>

        {/* Notification Permission */}
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={{
            backgroundColor: colors.neutrals1000,
            borderColor: colors.neutrals800,
          }}
          className="rounded-lg p-4 mb-4 shadow-sm border">
          <View className="flex-row items-center gap-2 mb-2">
            <Icon name="Bell" className="w-5 h-5 text-primary" />
            <AppText variant="heading3" weight="bold" className="text-foreground">
              Quyền thông báo
            </AppText>
          </View>
          <AppText variant="bodySmall" className="text-neutrals400 mb-4">
            App cần quyền thông báo để gửi báo thức
          </AppText>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Badge
                variant={
                  notificationPermission === 'granted'
                    ? 'success'
                    : notificationPermission === 'denied'
                    ? 'error'
                    : 'default'
                }>
                {notificationPermission === 'granted'
                  ? 'Đã cấp quyền'
                  : notificationPermission === 'denied'
                  ? 'Bị từ chối'
                  : 'Chưa xác định'}
              </Badge>
            </View>

            {notificationPermission !== 'granted' && (
              <AppButton
                variant="primary"
                size="sm"
                onPress={handleRequestPermission}>
                Yêu cầu quyền
              </AppButton>
            )}
          </View>
        </Animated.View>

        {/* Refresh Notifications */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{
            backgroundColor: colors.neutrals1000,
            borderColor: colors.neutrals800,
          }}
          className="rounded-lg p-4 mb-4 shadow-sm border">
          <View className="flex-row items-center gap-2 mb-2">
            <Icon name="RefreshCw" className="w-5 h-5 text-primary" />
            <AppText variant="heading3" weight="bold" className="text-foreground">
              Làm mới thông báo
            </AppText>
          </View>
          <AppText variant="bodySmall" className="text-neutrals400 mb-4">
            Reschedule tất cả alarms. Hữu ích khi thông báo không hoạt động đúng
            hoặc sau khi cập nhật app.
          </AppText>

          <AppButton
            variant="outline"
            onPress={handleRefreshNotifications}
            loading={isRefreshing}
            disabled={isRefreshing}>
            <View className="flex-row items-center gap-2">
              <Icon name="RefreshCw" className="w-5 h-5 text-foreground" />
              <AppText variant="body" weight="semibold" className="text-foreground" raw>
                {isRefreshing ? 'Đang làm mới...' : 'Làm mới thông báo'}
              </AppText>
            </View>
          </AppButton>
        </Animated.View>

        {/* Timezone Info */}
        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          style={{
            backgroundColor: colors.neutrals1000,
            borderColor: colors.neutrals800,
          }}
          className="rounded-lg p-4 mb-4 shadow-sm border">
          <View className="flex-row items-center gap-2 mb-2">
            <Icon name="Globe" className="w-5 h-5 text-primary" />
            <AppText variant="heading3" weight="bold" className="text-foreground">
              Múi giờ
            </AppText>
          </View>
          <AppText variant="bodySmall" className="text-neutrals400 mb-2">
            Múi giờ hiện tại của thiết bị
          </AppText>
          <View
            className="p-3 rounded-lg"
            style={{backgroundColor: colors.neutrals900}}>
            <AppText variant="body" className="text-primary font-mono" raw>
              {timezone}
            </AppText>
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={{
            backgroundColor: colors.neutrals1000,
            borderColor: colors.neutrals800,
          }}
          className="rounded-lg p-4 mb-4 shadow-sm border">
          <View className="flex-row items-center gap-2 mb-4">
            <Icon name="Info" className="w-5 h-5 text-primary" />
            <AppText variant="heading3" weight="bold" className="text-foreground">
              Thông tin ứng dụng
            </AppText>
          </View>

          <View className="gap-3">
            <View
              className="flex-row justify-between py-3 border-b"
              style={{borderBottomColor: colors.neutrals800}}>
              <AppText variant="body" className="text-neutrals400">
                Phiên bản
              </AppText>
              <AppText variant="body" weight="semibold" className="text-foreground">
                1.0.0
              </AppText>
            </View>

            <View
              className="flex-row justify-between py-3 border-b"
              style={{borderBottomColor: colors.neutrals800}}>
              <AppText variant="body" className="text-neutrals400">
                Build
              </AppText>
              <AppText variant="body" weight="semibold" className="text-foreground">
                1
              </AppText>
            </View>

            <View className="flex-row justify-between py-3">
              <AppText variant="body" className="text-neutrals400">
                Platform
              </AppText>
              <AppText variant="body" weight="semibold" className="text-foreground">
                {Platform.OS}
              </AppText>
            </View>
          </View>
        </Animated.View>

        {/* About */}
        <Animated.View
          entering={FadeInDown.delay(350).springify()}
          style={{
            backgroundColor: colors.neutrals1000,
            borderColor: colors.neutrals800,
          }}
          className="rounded-lg p-4 mb-4 shadow-sm border">
          <View className="flex-row items-center gap-2 mb-3">
            <Icon name="Heart" className="w-5 h-5 text-error" />
            <AppText variant="heading3" weight="bold" className="text-foreground">
              Giới thiệu
            </AppText>
          </View>
          <AppText variant="body" className="text-neutrals300 leading-6 mb-4">
            AlarmNote là ứng dụng kết hợp ghi chú và báo thức, giúp bạn không bao
            giờ quên những việc quan trọng.
          </AppText>
          <View className="flex-row items-center gap-2">
            <Icon name="Code" className="w-4 h-4 text-primary" />
            <AppText variant="bodySmall" className="text-neutrals400">
              Phát triển bởi Vu Tien Thanh
            </AppText>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}


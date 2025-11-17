/**
 * Mục đích: Màn hình quản lý báo thức của một ghi chú
 * Tham số vào: navigation props, route params (noteId)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi người dùng muốn xem/quản lý báo thức của ghi chú
 */

import React, {useEffect, useMemo, useCallback, useState} from 'react';
import {View, FlatList, Pressable} from 'react-native';
import Animated, {FadeInDown, FadeInUp} from 'react-native-reanimated';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAlarmsStore} from '@/stores/alarmsStore';
import {useNotesStore} from '@/stores/notesStore';
import type {RootStackParamList} from '@/navigation/types';
import {AppText, AppButton, Icon, Badge} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {useToast} from '@/components/ui/ToastProvider';
import {useDialog} from '@/components/ui/DialogProvider';
import {AlarmCard, EmptyState, SkeletonLoader} from '@/components/alarmNote';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmManager'>;

export function AlarmManagerScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const colors = useColors();
  const {showSuccess, showError} = useToast();
  const {showConfirm} = useDialog();

  const {noteId} = route.params;

  const notes = useNotesStore(state => state.notes);
  const note = useMemo(() => notes.find(n => n.id === noteId), [notes, noteId]);

  // Lấy alarms từ state và filter bằng useMemo để tránh re-render
  const allAlarms = useAlarmsStore(state => state.alarms);
  const alarms = useMemo(
    () => allAlarms.filter(a => a.noteId === noteId),
    [allAlarms, noteId],
  );

  const loading = useAlarmsStore(state => state.loading);
  const loadAlarmsByNoteId = useAlarmsStore(state => state.loadAlarmsByNoteId);
  const toggleAlarmEnabled = useAlarmsStore(state => state.toggleAlarmEnabled);
  const deleteAlarm = useAlarmsStore(state => state.deleteAlarm);

  const [refreshing, setRefreshing] = useState(false);

  /**
   * Mục đích: Load alarms khi vào màn hình
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Component mount
   */
  useEffect(() => {
    loadAlarmsByNoteId(noteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  /**
   * Mục đích: Xử lý pull to refresh
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: User kéo xuống để refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAlarmsByNoteId(noteId);
    } catch (error) {
      console.error('Lỗi khi refresh alarms:', error);
    } finally {
      setRefreshing(false);
    }
  }, [noteId, loadAlarmsByNoteId]);

  /**
   * Mục đích: Xử lý toggle enable/disable alarm
   * Tham số vào: alarmId (string), enabled (boolean)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Khi người dùng toggle switch
   */
  const handleToggle = useCallback(
    async (alarmId: string, enabled: boolean) => {
      try {
        await toggleAlarmEnabled(alarmId, enabled);
        showSuccess(enabled ? 'Đã bật báo thức' : 'Đã tắt báo thức');
      } catch (error) {
        showError('Không thể cập nhật báo thức');
        console.error('Lỗi khi toggle alarm:', error);
      }
    },
    [toggleAlarmEnabled, showSuccess, showError],
  );

  /**
   * Mục đích: Xử lý xóa alarm
   * Tham số vào: alarmId (string)
   * Tham số ra: void
   * Khi nào dùng: Khi người dùng nhấn nút xóa
   */
  const handleDelete = useCallback(
    (alarmId: string) => {
      showConfirm(
        'Xóa báo thức',
        'Bạn có chắc muốn xóa báo thức này?',
        async () => {
          try {
            await deleteAlarm(alarmId);
            showSuccess('Đã xóa báo thức');
          } catch (error) {
            showError('Không thể xóa báo thức');
            console.error('Lỗi khi xóa alarm:', error);
          }
        },
      );
    },
    [deleteAlarm, showConfirm, showSuccess, showError],
  );

  /**
   * Mục đích: Xử lý edit alarm
   * Tham số vào: alarmId (string)
   * Tham số ra: void
   * Khi nào dùng: User nhấn nút edit
   */
  const handleEdit = useCallback(
    (alarmId: string) => {
      navigation.navigate('AlarmEditor', {noteId, alarmId});
    },
    [navigation, noteId],
  );

  /**
   * Mục đích: Xử lý thêm alarm mới
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User nhấn nút thêm
   */
  const handleAddAlarm = useCallback(() => {
    navigation.navigate('AlarmEditor', {noteId});
  }, [navigation, noteId]);

  // Tính toán stats
  const enabledCount = useMemo(
    () => alarms.filter(a => a.enabled).length,
    [alarms],
  );
  const disabledCount = alarms.length - enabledCount;

  // Loading state
  if (loading && alarms.length === 0) {
    return (
      <View
        className="flex-1"
        style={{backgroundColor: colors.background}}>
        <SkeletonLoader type="alarm" count={5} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{backgroundColor: colors.background}}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          backgroundColor: colors.neutrals1000,
          borderBottomColor: colors.neutrals800,
        }}
        className="px-4 pt-2 pb-4 shadow-sm border">
        <View className="flex-row items-center justify-between mb-2">
          <AppText variant="heading2" weight="bold" className="text-foreground flex-1">
            {note?.title || 'Ghi chú'}
          </AppText>
          {/* <Pressable
            onPress={handleAddAlarm}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{backgroundColor: colors.primary}}>
            <Icon name="Plus" className="w-5 h-5 text-background" />
          </Pressable> */}
        </View>

        {/* Stats */}
        <View className="flex-row items-center gap-2">
          <Badge variant="primary" size="sm">
            <AppText variant="labelSmall" className="text-white">
              {alarms.length} báo thức
            </AppText>
          </Badge>
          {enabledCount > 0 && (
            <Badge variant="success" size="sm">
              <AppText variant="labelSmall" className="text-success">
                {enabledCount} đang bật
              </AppText>
            </Badge>
          )}
          {disabledCount > 0 && (
            <Badge variant="default" size="sm">
              <AppText variant="labelSmall" className="text-neutrals100">
                {disabledCount} đã tắt
              </AppText>
            </Badge>
          )}
        </View>
      </Animated.View>

      {/* Danh sách alarms */}
      <FlatList
        data={alarms}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 16}}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <EmptyState
            iconName="AlarmClock"
            title="Chưa có báo thức"
            description="Nhấn nút + ở trên để thêm báo thức mới cho ghi chú này"
            actionLabel="Thêm báo thức"
            onAction={handleAddAlarm}
          />
        }
        renderItem={({item, index}) => (
          <AlarmCard
            alarm={item}
            index={index}
            onToggle={enabled => handleToggle(item.id, enabled)}
            onEdit={() => handleEdit(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />

      {/* Bottom action bar - chỉ hiện khi có alarms */}
      {alarms.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={{
            backgroundColor: colors.neutrals1000,
            borderTopColor: colors.neutrals800,
          }}
          className="p-4 border-t">
          <AppButton variant="primary" onPress={handleAddAlarm}>
            <View className="flex-row items-center gap-2">
              <Icon name="Plus" className="w-5 h-5 text-background" />
              <AppText variant="body" weight="semibold" className="text-background" raw>
                Thêm báo thức mới
              </AppText>
            </View>
          </AppButton>
        </Animated.View>
      )}
    </View>
  );
}


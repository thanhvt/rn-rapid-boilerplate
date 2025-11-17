/**
 * Mục đích: Card component hiển thị alarm item trong danh sách
 * Tham số vào: alarm object, onToggle, onEdit, onDelete
 * Tham số ra: JSX.Element
 * Khi nào dùng: Render alarm item trong AlarmManagerScreen
 */

import React, {useEffect} from 'react';
import {View, Pressable} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import {AppText, Badge, Icon, Switch} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import type {Alarm} from '@/types/alarmNote';
import {getDayName} from '@/utils/alarmNoteHelpers';

interface AlarmCardProps {
  alarm: Alarm;
  index: number;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AlarmCard({
  alarm,
  index,
  onToggle,
  onEdit,
  onDelete,
}: AlarmCardProps): React.JSX.Element {
  const colors = useColors();
  const scale = useSharedValue(1);
  const bellScale = useSharedValue(1);

  /**
   * Mục đích: Animation cho bell icon khi alarm enabled
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Khi alarm được enable
   */
  useEffect(() => {
    if (alarm.enabled) {
      bellScale.value = withRepeat(
        withSequence(
          withSpring(1.2, {damping: 10}),
          withSpring(1, {damping: 10}),
        ),
        -1,
        false,
      );
    } else {
      bellScale.value = withSpring(1);
    }
  }, [alarm.enabled, bellScale]);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {damping: 15, stiffness: 300});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 15, stiffness: 300});
  };

  const handleEdit = () => {
    onEdit();
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    onDelete();
  };

  const handleToggle = (enabled: boolean) => {
    onToggle(enabled);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: bellScale.value}],
  }));

  // Format thời gian hiển thị
  const displayTime = alarm.type === 'ONE_TIME'
    ? `${alarm.timeHHmm} - ${alarm.dateISO}`
    : alarm.type === 'RANDOM'
    ? 'Ngẫu nhiên'
    : alarm.timeHHmm;

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 50)
        .duration(400)
        .springify()
        .damping(15)}
      exiting={FadeOutUp.duration(300)}
      style={[
        animatedStyle,
        {
          backgroundColor: alarm.enabled ? colors.primary + '10' : colors.neutrals1000,
          borderColor: alarm.enabled ? colors.primary : colors.neutrals800,
        },
      ]}
      className="p-4 mb-3 rounded-xl border shadow-sm"
      onPress={handleEdit}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <View className="flex-row justify-between items-start">
        {/* Left: Icon và Time */}
        <View className="flex-row items-center gap-3 flex-1">
          <Animated.View style={bellAnimatedStyle}>
            <Icon
              name={alarm.enabled ? 'Bell' : 'BellOff'}
              className={alarm.enabled ? 'w-6 h-6 text-primary' : 'w-6 h-6 text-neutrals400'}
            />
          </Animated.View>

          <View className="flex-1">
            <AppText
              variant="heading5"
              weight="bold"
              className={alarm.enabled ? 'text-foreground' : 'text-neutrals400'}>
              {displayTime}
            </AppText>

            {/* Hiển thị type và days */}
            <View className="flex-row items-center gap-2 mt-1 flex-wrap">
              <Badge
                variant={
                  alarm.type === 'REPEATING'
                    ? 'primary'
                    : alarm.type === 'RANDOM'
                    ? 'warning'
                    : 'secondary'
                }
                size="sm">
                <AppText variant="overline" className="text-white" raw>
                  {alarm.type === 'REPEATING'
                    ? 'Lặp lại'
                    : alarm.type === 'RANDOM'
                    ? 'Ngẫu nhiên'
                    : 'Một lần'}
                </AppText>
              </Badge>

              {alarm.type === 'REPEATING' && alarm.daysOfWeek && alarm.daysOfWeek.length > 0 && (
                <AppText variant="caption" className="text-neutrals400">
                  {alarm.daysOfWeek.map(d => getDayName(d)).join(', ')}
                </AppText>
              )}

              {alarm.type === 'RANDOM' && alarm.daysOfWeek && alarm.daysOfWeek.length > 0 && (
                <AppText variant="label" className="text-neutrals400">
                  {alarm.daysOfWeek.map(d => getDayName(d)).join(', ')}
                </AppText>
              )}
            </View>

            {/* Hiển thị chi tiết random times */}
            {alarm.type === 'RANDOM' && alarm.randomTimes && alarm.daysOfWeek && alarm.daysOfWeek.length > 0 && (
              <View className="mt-2 flex-row flex-wrap gap-1">
                {alarm.daysOfWeek.map(day => (
                  <View
                    key={day}
                    className="px-2 py-0.5 rounded"
                    style={{backgroundColor: colors.primary + '20'}}>
                    <AppText variant="labelSmall" className="text-primary">
                      {getDayName(day)}: {alarm.randomTimes![day] || '??:??'}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Right: Switch và Delete */}
        <View className="flex-row items-center gap-3">
          <Switch value={alarm.enabled} onValueChange={handleToggle} />

          <Pressable
            onPress={handleDelete}
            className="active:opacity-70"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="Trash2" className="w-5 h-5 text-error" />
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}


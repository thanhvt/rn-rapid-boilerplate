/**
 * Mục đích: Card component hiển thị note item trong danh sách
 * Tham số vào: note object, onPress, onAlarmPress, onDeletePress
 * Tham số ra: JSX.Element
 * Khi nào dùng: Render note item trong NotesListScreen
 */

import React from 'react';
import {View, Pressable} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {AppText, Badge, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import type {Note} from '@/types/alarmNote';

interface NoteCardProps {
  note: Note;
  enabledAlarmsCount: number;
  index: number;
  onPress: () => void;
  onAlarmPress: () => void;
  onDeletePress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NoteCard({
  note,
  enabledAlarmsCount,
  index,
  onPress,
  onAlarmPress,
  onDeletePress,
}: NoteCardProps): React.JSX.Element {
  const colors = useColors();
  const scale = useSharedValue(1);

  /**
   * Mục đích: Xử lý animation khi press
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Khi user press vào card
   */
  const handlePressIn = () => {
    scale.value = withSpring(0.98, {damping: 15, stiffness: 300});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 15, stiffness: 300});
  };

  const handlePress = () => {
    onPress();
  };

  const handleAlarmPress = (e: any) => {
    e.stopPropagation();
    onAlarmPress();
  };

  const handleDeletePress = (e: any) => {
    e.stopPropagation();
    onDeletePress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

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
          backgroundColor: colors.neutrals1000,
          borderColor: colors.neutrals800,
        },
      ]}
      className="p-4 mb-3 rounded-xl border shadow-sm"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      {/* Header với title, alarm badge, và action buttons */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 flex-row items-start gap-2">
          <AppText
            variant="body"
            weight="semibold"
            className="flex-1 text-foreground"
            numberOfLines={2}>
            {note.title}
          </AppText>

          {/* {enabledAlarmsCount > 0 && (
            <Animated.View entering={FadeInDown.springify()}>
              <Badge variant="primary" size="sm">
                <View className="flex-row items-center gap-1">
                  <Icon name="Bell" className="w-3 h-3 text-white" />
                  <AppText variant="caption" className="text-white" raw>
                    {enabledAlarmsCount}
                  </AppText>
                </View>
              </Badge>
            </Animated.View>
          )} */}
        </View>

        {/* Action buttons - Cùng dòng với title */}
        <View className="flex-row gap-2 ml-2">
          {/* Nút Báo thức - Icon only, tối giản */}
          <Pressable
            onPress={handleAlarmPress}
            style={{backgroundColor: colors.primary + '15'}}
            className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="Bell" className="w-4 h-4 text-primary" />
          </Pressable>

          {/* Nút Xóa - Icon only, tối giản */}
          <Pressable
            onPress={handleDeletePress}
            style={{backgroundColor: colors.error + '15'}}
            className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="Trash2" className="w-4 h-4 text-error" />
          </Pressable>
        </View>
      </View>

      {/* Content preview */}
      {note.content && (
        <AppText
          variant="bodySmall"
          className="text-neutrals300"
          numberOfLines={2}>
          {note.content}
        </AppText>
      )}
    </AnimatedPressable>
  );
}


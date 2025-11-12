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
import {formatTimestamp} from '@/utils/alarmNoteHelpers';

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
      {/* Header với title và alarm badge */}
      <View className="flex-row justify-between items-start mb-2">
        <AppText
          variant="body"
          weight="semibold"
          className="flex-1 text-foreground"
          numberOfLines={2}>
          {note.title}
        </AppText>

        {enabledAlarmsCount > 0 && (
          <Animated.View
            entering={FadeInDown.springify()}
            className="ml-2">
            <Badge variant="primary" size="sm">
              <View className="flex-row items-center gap-1">
                <Icon name="Bell" className="w-3 h-3 text-white" />
                <AppText variant="caption" className="text-white" raw>
                  {enabledAlarmsCount}
                </AppText>
              </View>
            </Badge>
          </Animated.View>
        )}
      </View>

      {/* Content preview */}
      {note.content && (
        <AppText
          variant="bodySmall"
          className="text-neutrals300 mb-3"
          numberOfLines={2}>
          {note.content}
        </AppText>
      )}

      {/* Footer với timestamp và actions */}
      <View className="flex-row justify-between items-center pt-3 border-t border-neutrals800">
        <View className="flex-row items-center gap-1.5">
          <Icon name="Clock" className="w-3.5 h-3.5 text-neutrals400" />
          <AppText variant="caption" className="text-neutrals400" raw>
            {formatTimestamp(note.updatedAt)}
          </AppText>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={handleAlarmPress}
            className="bg-primary/20 px-3 py-1.5 rounded-lg active:opacity-70"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <AppText variant="caption" weight="medium" className="text-primary" raw>
              Báo thức
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleDeletePress}
            className="bg-error/20 px-3 py-1.5 rounded-lg active:opacity-70"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <AppText variant="caption" weight="medium" className="text-error" raw>
              Xóa
            </AppText>
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}


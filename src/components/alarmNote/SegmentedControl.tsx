/**
 * Mục đích: Segmented control component cho việc chọn giữa các options
 * Tham số vào: options, selectedValue, onChange
 * Tham số ra: JSX.Element
 * Khi nào dùng: Chọn alarm type (ONE_TIME/REPEATING)
 */

import React from 'react';
import {View, Pressable, LayoutChangeEvent} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';

interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SegmentedControl({
  options,
  selectedValue,
  onChange,
}: SegmentedControlProps): React.JSX.Element {
  const colors = useColors();
  const selectedIndex = options.findIndex(opt => opt.value === selectedValue);
  const translateX = useSharedValue(0);
  const segmentWidth = useSharedValue(0);

  /**
   * Mục đích: Xử lý layout change để tính toán vị trí indicator
   * Tham số vào: event
   * Tham số ra: void
   * Khi nào dùng: Khi component được render hoặc resize
   */
  const handleLayout = (event: LayoutChangeEvent) => {
    const {width} = event.nativeEvent.layout;
    const itemWidth = width / options.length;
    segmentWidth.value = itemWidth;
    translateX.value = withSpring(selectedIndex * itemWidth, {
      damping: 20,
      stiffness: 300,
    });
  };

  /**
   * Mục đích: Xử lý khi user chọn option
   * Tham số vào: value, index
   * Tham số ra: void
   * Khi nào dùng: Khi user tap vào segment
   */
  const handleSelect = (value: string, index: number) => {
    translateX.value = withSpring(index * segmentWidth.value, {
      damping: 20,
      stiffness: 300,
    });
    onChange(value);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
    width: segmentWidth.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.springify()}
      onLayout={handleLayout}
      style={{
        backgroundColor: colors.neutrals900,
        borderColor: colors.neutrals800,
      }}
      className="flex-row p-1 rounded-xl border relative">
      {/* Animated indicator */}
      <Animated.View
        style={[
          indicatorStyle,
          {
            backgroundColor: colors.primary,
          },
        ]}
        className="absolute h-[calc(100%-8px)] top-1 rounded-lg"
      />

      {/* Options */}
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;

        return (
          <AnimatedPressable
            key={option.value}
            onPress={() => handleSelect(option.value, index)}
            className="flex-1 py-2.5 items-center justify-center z-10"
            style={{
              opacity: 1,
            }}>
            <AppText
              variant="body"
              weight={isSelected ? 'bold' : 'medium'}
              className={isSelected ? 'text-background' : 'text-neutrals400'}
              raw>
              {option.label}
            </AppText>
          </AnimatedPressable>
        );
      })}
    </Animated.View>
  );
}


/**
 * Mục đích: Skeleton loader component cho loading state
 * Tham số vào: type (note hoặc alarm), count
 * Tham số ra: JSX.Element
 * Khi nào dùng: Hiển thị khi đang load dữ liệu
 */

import React, {useEffect} from 'react';
import {View} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import {useColors} from '@/hooks/useColors';

interface SkeletonLoaderProps {
  type: 'note' | 'alarm';
  count?: number;
}

/**
 * Mục đích: Single skeleton item component
 * Tham số vào: type, index
 * Tham số ra: JSX.Element
 * Khi nào dùng: Render từng skeleton item
 */
function SkeletonItem({
  type,
  index,
}: {
  type: 'note' | 'alarm';
  index: number;
}): React.JSX.Element {
  const colors = useColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {duration: 1000, easing: Easing.inOut(Easing.ease)}),
        withTiming(0.3, {duration: 1000, easing: Easing.inOut(Easing.ease)}),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (type === 'note') {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={{
          backgroundColor: colors.neutrals1000,
          borderColor: colors.neutrals800,
        }}
        className="p-4 mb-3 rounded-xl border">
        {/* Title skeleton */}
        <Animated.View
          style={[
            animatedStyle,
            {backgroundColor: colors.neutrals800},
          ]}
          className="h-5 w-3/4 rounded-md mb-3"
        />

        {/* Content skeleton */}
        <Animated.View
          style={[
            animatedStyle,
            {backgroundColor: colors.neutrals800},
          ]}
          className="h-4 w-full rounded-md mb-2"
        />
        <Animated.View
          style={[
            animatedStyle,
            {backgroundColor: colors.neutrals800},
          ]}
          className="h-4 w-2/3 rounded-md mb-4"
        />

        {/* Footer skeleton */}
        <View className="flex-row justify-between items-center pt-3 border-t border-neutrals800">
          <Animated.View
            style={[
              animatedStyle,
              {backgroundColor: colors.neutrals800},
            ]}
            className="h-3 w-24 rounded-md"
          />
          <View className="flex-row gap-2">
            <Animated.View
              style={[
                animatedStyle,
                {backgroundColor: colors.neutrals800},
              ]}
              className="h-6 w-16 rounded-lg"
            />
            <Animated.View
              style={[
                animatedStyle,
                {backgroundColor: colors.neutrals800},
              ]}
              className="h-6 w-12 rounded-lg"
            />
          </View>
        </View>
      </Animated.View>
    );
  }

  // Alarm skeleton
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={{
        backgroundColor: colors.neutrals1000,
        borderColor: colors.neutrals800,
      }}
      className="p-4 mb-3 rounded-xl border">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-3 flex-1">
          {/* Icon skeleton */}
          <Animated.View
            style={[
              animatedStyle,
              {backgroundColor: colors.neutrals800},
            ]}
            className="w-6 h-6 rounded-full"
          />

          <View className="flex-1">
            {/* Time skeleton */}
            <Animated.View
              style={[
                animatedStyle,
                {backgroundColor: colors.neutrals800},
              ]}
              className="h-6 w-20 rounded-md mb-2"
            />
            {/* Badge skeleton */}
            <Animated.View
              style={[
                animatedStyle,
                {backgroundColor: colors.neutrals800},
              ]}
              className="h-4 w-16 rounded-full"
            />
          </View>
        </View>

        {/* Switch skeleton */}
        <Animated.View
          style={[
            animatedStyle,
            {backgroundColor: colors.neutrals800},
          ]}
          className="w-12 h-6 rounded-full"
        />
      </View>
    </Animated.View>
  );
}

export function SkeletonLoader({
  type,
  count = 3,
}: SkeletonLoaderProps): React.JSX.Element {
  return (
    <View className="flex-1 px-4 pt-4">
      {Array.from({length: count}).map((_, index) => (
        <SkeletonItem key={index} type={type} index={index} />
      ))}
    </View>
  );
}


/**
 * Mục đích: Component hiển thị empty state với icon và message
 * Tham số vào: iconName, title, description, actionLabel, onAction
 * Tham số ra: JSX.Element
 * Khi nào dùng: Hiển thị khi danh sách rỗng hoặc không có kết quả tìm kiếm
 */

import React from 'react';
import {View} from 'react-native';
import Animated, {FadeIn, FadeInDown} from 'react-native-reanimated';
import {AppText, AppButton, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import type {LucideIcon} from 'lucide-react-native';

interface EmptyStateProps {
  iconName: keyof typeof LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  iconName,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      className="flex-1 justify-center items-center px-8 py-12">
      {/* Icon với gradient background */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={{
          backgroundColor: colors.primary + '20',
        }}
        className="w-24 h-24 rounded-full items-center justify-center mb-6">
        <Icon name={iconName} className="w-12 h-12 text-primary" />
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <AppText
          variant="heading4"
          weight="bold"
          className="text-foreground text-center mb-2">
          {title}
        </AppText>
      </Animated.View>

      {/* Description */}
      {description && (
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          className="mb-8">
          <AppText
            variant="body"
            className="text-neutrals400 text-center max-w-xs">
            {description}
          </AppText>
        </Animated.View>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <AppButton variant="primary" onPress={onAction}>
            {actionLabel}
          </AppButton>
        </Animated.View>
      )}
    </Animated.View>
  );
}


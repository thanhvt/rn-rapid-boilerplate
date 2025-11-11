/**
 * Mục đích: Button component với accessibility support
 * Tham số vào: TouchableOpacity props + accessibility props
 * Tham số ra: JSX.Element
 * Khi nào dùng: Thay thế TouchableOpacity để đảm bảo accessibility
 */

import React from 'react';
import {TouchableOpacity, TouchableOpacityProps, StyleSheet} from 'react-native';

interface AccessibleButtonProps extends TouchableOpacityProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'search' | 'image' | 'text';
}

export function AccessibleButton({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  style,
  ...props
}: AccessibleButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      style={[styles.minHitTarget, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  // Đảm bảo hit target tối thiểu 44x44pt theo iOS HIG
  minHitTarget: {
    minWidth: 44,
    minHeight: 44,
  },
});


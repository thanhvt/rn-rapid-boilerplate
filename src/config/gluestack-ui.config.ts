/**
 * Mục đích: Cấu hình theme cho gluestack-ui
 * Tham số vào: Không
 * Tham số ra: Config object
 * Khi nào dùng: Import vào GluestackUIProvider
 */

import {createConfig} from '@gluestack-style/react';

export const config = createConfig({
  aliases: {
    bg: 'backgroundColor',
    p: 'padding',
    m: 'margin',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    mx: 'marginHorizontal',
    my: 'marginVertical',
  },
  tokens: {
    colors: {
      // Màu chủ đạo
      primary500: '#3b82f6',
      primary600: '#2563eb',
      danger500: '#ef4444',
      danger600: '#dc2626',
      success500: '#10b981',
      success600: '#059669',
      // Màu nền và text
      white: '#ffffff',
      black: '#000000',
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray400: '#9ca3af',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray800: '#1f2937',
      gray900: '#111827',
    },
    space: {
      '0': 0,
      '1': 4,
      '2': 8,
      '3': 12,
      '4': 16,
      '5': 20,
      '6': 24,
      '8': 32,
      '10': 40,
      '12': 48,
      '16': 64,
    },
    radii: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
  },
  globalStyle: {},
} as const);

export type Config = typeof config;


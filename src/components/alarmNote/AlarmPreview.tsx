/**
 * Mục đích: Preview component hiển thị tóm tắt alarm sẽ được tạo
 * Tham số vào: alarm data (type, time, date, days)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Hiển thị preview trong AlarmEditorScreen
 */

import React from 'react';
import {View} from 'react-native';
import Animated, {FadeIn, FadeInDown} from 'react-native-reanimated';
import {AppText, Badge, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import dayjs from 'dayjs';

interface AlarmPreviewProps {
  type: 'ONE_TIME' | 'REPEATING' | 'RANDOM';
  time: string;
  date?: string;
  selectedDays?: number[];
  randomTimes?: Record<number, string>;
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function AlarmPreview({
  type,
  time,
  date,
  selectedDays = [],
  randomTimes,
}: AlarmPreviewProps): React.JSX.Element {
  const colors = useColors();

  /**
   * Mục đích: Format preview message
   * Tham số vào: Không
   * Tham số ra: string
   * Khi nào dùng: Hiển thị message preview
   */
  const getPreviewMessage = (): string => {
    if (type === 'ONE_TIME' && date) {
      const alarmDateTime = dayjs(`${date} ${time}`);
      const now = dayjs();
      const diffHours = alarmDateTime.diff(now, 'hour');
      const diffMinutes = alarmDateTime.diff(now, 'minute') % 60;

      if (diffHours > 24) {
        return `Báo thức sẽ kêu vào ${alarmDateTime.format('DD/MM/YYYY')} lúc ${time}`;
      } else if (diffHours > 0) {
        return `Báo thức sẽ kêu sau ${diffHours} giờ ${diffMinutes} phút`;
      } else if (diffMinutes > 0) {
        return `Báo thức sẽ kêu sau ${diffMinutes} phút`;
      }
      return 'Báo thức sẽ kêu ngay';
    }

    if (type === 'REPEATING' && selectedDays.length > 0) {
      const dayNames = selectedDays.map(d => DAY_LABELS[d]).join(', ');
      return `Báo thức sẽ lặp lại vào ${dayNames} lúc ${time}`;
    }

    if (type === 'RANDOM' && selectedDays.length > 0 && randomTimes) {
      // Hiển thị chi tiết giờ ngẫu nhiên cho từng ngày
      const dayTimeDetails = selectedDays
        .map(d => `${DAY_LABELS[d]}: ${randomTimes[d] || '??:??'}`)
        .join(', ');
      return `Báo thức ngẫu nhiên - ${dayTimeDetails}`;
    }

    return 'Vui lòng chọn thời gian và ngày';
  };

  const isValid =
    (type === 'ONE_TIME' && date && time) ||
    (type === 'REPEATING' && selectedDays.length > 0 && time) ||
    (type === 'RANDOM' && selectedDays.length > 0);

  if (!isValid) {
    return <View />;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{
        backgroundColor: colors.primary + '15',
        borderColor: colors.primary + '40',
      }}
      className="p-5 rounded-2xl border-2 shadow-sm">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        className="flex-row items-center gap-3 mb-4 pb-3 border-b"
        style={{borderBottomColor: colors.primary + '30'}}>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{backgroundColor: colors.primary + '20'}}>
          <Icon name="Bell" className="w-5 h-5 text-primary" />
        </View>
        <AppText variant="heading5" weight="bold" className="text-primary">
          Xem trước báo thức
        </AppText>
      </Animated.View>

      {/* Preview content */}
      <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-4">
        <AppText variant="body" className="text-foreground leading-6">
          {getPreviewMessage()}
        </AppText>
      </Animated.View>

      {/* Details */}
      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        className="flex-row flex-wrap gap-2">
        {/* Chỉ hiển thị time badge cho ONE_TIME và REPEATING */}
        {type !== 'RANDOM' && (
          <Badge variant="primary" size="md">
            <View className="flex-row items-center gap-1.5">
              <Icon name="Clock" className="w-4 h-4 text-white" />
              <AppText variant="body" weight="semibold" className="text-white">
                {time}
              </AppText>
            </View>
          </Badge>
        )}

        {type === 'ONE_TIME' && date && (
          <Badge variant="secondary" size="md">
            <View className="flex-row items-center gap-1.5">
              <Icon name="Calendar" className="w-4 h-4 text-white" />
              <AppText variant="body" weight="semibold" className="text-white">
                {dayjs(date).format('DD/MM/YYYY')}
              </AppText>
            </View>
          </Badge>
        )}

        {type === 'REPEATING' && selectedDays.length > 0 && (
          <Badge variant="success" size="md">
            <View className="flex-row items-center gap-1.5">
              <Icon name="Repeat" className="w-4 h-4 text-white" />
              <AppText variant="body" weight="semibold" className="text-white">
                {selectedDays.length === 7
                  ? 'Hàng ngày'
                  : `${selectedDays.length} ngày`}
              </AppText>
            </View>
          </Badge>
        )}

        {type === 'RANDOM' && selectedDays.length > 0 && (
          <Badge variant="warning" size="md">
            <View className="flex-row items-center gap-1.5">
              <Icon name="Shuffle" className="w-4 h-4 text-white" />
              <AppText variant="body" weight="semibold" className="text-white">
                {selectedDays.length === 7
                  ? 'Hàng ngày'
                  : `${selectedDays.length} ngày`}
              </AppText>
            </View>
          </Badge>
        )}
      </Animated.View>

      {/* Chi tiết random times cho từng ngày */}
      {type === 'RANDOM' && selectedDays.length > 0 && randomTimes && (
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          className="mt-4 pt-4 border-t"
          style={{borderTopColor: colors.primary + '30'}}>
          <AppText variant="caption" weight="semibold" className="text-foreground/70 mb-2">
            Giờ ngẫu nhiên cho từng ngày:
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {selectedDays.map(day => (
              <View
                key={day}
                className="px-3 py-1.5 rounded-lg"
                style={{backgroundColor: colors.background}}>
                <AppText variant="caption" className="text-foreground">
                  <AppText variant="caption" weight="semibold" className="text-primary">
                    {DAY_LABELS[day]}:
                  </AppText>
                  {' '}
                  {randomTimes[day] || '??:??'}
                </AppText>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}


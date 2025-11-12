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
  type: 'ONE_TIME' | 'REPEATING';
  time: string;
  date?: string;
  selectedDays?: number[];
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function AlarmPreview({
  type,
  time,
  date,
  selectedDays = [],
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

    return 'Vui lòng chọn thời gian và ngày';
  };

  const isValid =
    (type === 'ONE_TIME' && date && time) ||
    (type === 'REPEATING' && selectedDays.length > 0 && time);

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
      className="mx-4 p-4 rounded-xl border mb-4">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        className="flex-row items-center gap-2 mb-3">
        <Icon name="Info" className="w-5 h-5 text-primary" />
        <AppText variant="body" weight="semibold" className="text-primary" raw>
          Xem trước
        </AppText>
      </Animated.View>

      {/* Preview content */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <AppText variant="body" className="text-foreground mb-3">
          {getPreviewMessage()}
        </AppText>
      </Animated.View>

      {/* Details */}
      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        className="flex-row flex-wrap gap-2">
        <Badge variant="primary" size="sm">
          <View className="flex-row items-center gap-1">
            <Icon name="Clock" className="w-3 h-3 text-white" />
            <AppText variant="caption" className="text-white" raw>
              {time}
            </AppText>
          </View>
        </Badge>

        {type === 'ONE_TIME' && date && (
          <Badge variant="secondary" size="sm">
            <View className="flex-row items-center gap-1">
              <Icon name="Calendar" className="w-3 h-3 text-white" />
              <AppText variant="caption" className="text-white" raw>
                {dayjs(date).format('DD/MM/YYYY')}
              </AppText>
            </View>
          </Badge>
        )}

        {type === 'REPEATING' && selectedDays.length > 0 && (
          <Badge variant="success" size="sm">
            <View className="flex-row items-center gap-1">
              <Icon name="Repeat" className="w-3 h-3 text-white" />
              <AppText variant="caption" className="text-white" raw>
                {selectedDays.length === 7
                  ? 'Hàng ngày'
                  : `${selectedDays.length} ngày`}
              </AppText>
            </View>
          </Badge>
        )}
      </Animated.View>
    </Animated.View>
  );
}


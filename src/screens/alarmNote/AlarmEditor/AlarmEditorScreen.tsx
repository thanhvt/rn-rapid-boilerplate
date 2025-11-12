/**
 * Mục đích: Màn hình tạo/chỉnh sửa báo thức
 * Tham số vào: navigation props, route params (noteId, alarmId?)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi người dùng tạo mới hoặc chỉnh sửa báo thức
 */

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {View, ScrollView} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAlarmsStore} from '@/stores/alarmsStore';
import {useSettingsStore} from '@/stores/settingsStore';
import {AlarmType} from '@/types/alarmNote';
import {
  validateAlarmInput,
  suggestNextDayForOneTime,
} from '@/services/alarmLogic';
import {getDayFullName} from '@/utils/alarmNoteHelpers';
import {TimePicker} from '@/components/pickers/TimePicker';
import {DatePicker} from '@/components/pickers/DatePicker';
import dayjs from 'dayjs';
import type {RootStackParamList} from '@/navigation/types';
import {AppText, AppButton, Icon, Chip} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {useToast} from '@/components/ui/ToastProvider';
import {useDialog} from '@/components/ui/DialogProvider';
import {SegmentedControl, AlarmPreview} from '@/components/alarmNote';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmEditor'>;

export function AlarmEditorScreen({route, navigation}: Props): React.JSX.Element {
  const colors = useColors();
  const {showSuccess, showError, showWarning} = useToast();
  const {showConfirm} = useDialog();

  const {noteId, alarmId} = route.params;
  const isEditing = !!alarmId;

  const alarms = useAlarmsStore(state => state.alarms);
  const alarm = useMemo(
    () => (alarmId ? alarms.find(a => a.id === alarmId) : undefined),
    [alarms, alarmId],
  );
  const createAlarm = useAlarmsStore(state => state.createAlarm);
  const updateAlarm = useAlarmsStore(state => state.updateAlarm);
  const timezone = useSettingsStore(state => state.timezone);

  // Form state
  const [type, setType] = useState<AlarmType>(alarm?.type || 'ONE_TIME');
  const [timeHHmm, setTimeHHmm] = useState(alarm?.timeHHmm || '08:00');
  const [dateISO, setDateISO] = useState(
    alarm?.dateISO || dayjs().format('YYYY-MM-DD'),
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    alarm?.daysOfWeek || [],
  );

  /**
   * Mục đích: Load alarm data nếu đang edit
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Component mount với alarmId
   */
  useEffect(() => {
    if (alarm) {
      setType(alarm.type);
      setTimeHHmm(alarm.timeHHmm);
      setDateISO(alarm.dateISO || dayjs().format('YYYY-MM-DD'));
      setDaysOfWeek(alarm.daysOfWeek || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmId]);

  /**
   * Mục đích: Handle type change
   * Tham số vào: newType
   * Tham số ra: void
   * Khi nào dùng: User chọn loại alarm
   */
  const handleTypeChange = useCallback((newType: string) => {
    setType(newType as AlarmType);
  }, []);

  /**
   * Mục đích: Toggle ngày trong tuần
   * Tham số vào: day (number 0-6)
   * Tham số ra: void
   * Khi nào dùng: Khi người dùng chọn/bỏ chọn ngày
   */
  const toggleDay = useCallback(
    (day: number) => {
      if (daysOfWeek.includes(day)) {
        setDaysOfWeek(daysOfWeek.filter(d => d !== day));
      } else {
        setDaysOfWeek([...daysOfWeek, day].sort());
      }
    },
    [daysOfWeek],
  );

  /**
   * Mục đích: Chọn tất cả các ngày
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Khi người dùng nhấn "Tất cả các ngày"
   */
  const selectAllDays = useCallback(() => {
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
  }, []);

  /**
   * Mục đích: Quick time presets
   * Tham số vào: time (string)
   * Tham số ra: void
   * Khi nào dùng: User chọn preset time
   */
  const setQuickTime = useCallback((time: string) => {
    setTimeHHmm(time);
  }, []);

  /**
   * Mục đích: Lưu alarm vào DB
   * Tham số vào: finalDateISO (string)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Internal helper
   */
  const saveAlarm = useCallback(
    async (finalDateISO: string) => {
      try {
        if (isEditing && alarmId) {
          // Update existing alarm
          await updateAlarm({
            id: alarmId,
            type,
            timeHHmm,
            dateISO: type === 'ONE_TIME' ? finalDateISO : undefined,
            daysOfWeek: type === 'REPEATING' ? daysOfWeek : undefined,
          });
        } else {
          // Create new alarm
          await createAlarm({
            noteId,
            type,
            timeHHmm,
            dateISO: type === 'ONE_TIME' ? finalDateISO : undefined,
            daysOfWeek: type === 'REPEATING' ? daysOfWeek : undefined,
          });
        }

        showSuccess('Đã lưu báo thức thành công');
        navigation.goBack();
      } catch (error) {
        showError('Không thể lưu báo thức');
        console.error('[AlarmEditor] Lỗi lưu alarm:', error);
      }
    },
    [
      isEditing,
      alarmId,
      type,
      timeHHmm,
      daysOfWeek,
      noteId,
      updateAlarm,
      createAlarm,
      navigation,
      showSuccess,
      showError,
    ],
  );

  /**
   * Mục đích: Xử lý lưu alarm
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: Khi người dùng nhấn nút Lưu
   */
  const handleSave = useCallback(async () => {
    // Validate input
    const validation = validateAlarmInput(type, timeHHmm, dateISO, daysOfWeek);
    if (!validation.valid) {
      showWarning(validation.error || 'Vui lòng kiểm tra lại thông tin');
      return;
    }

    // Kiểm tra nếu ONE_TIME đã qua, suggest ngày mai
    if (type === 'ONE_TIME') {
      const suggestedDate = suggestNextDayForOneTime(dateISO, timeHHmm, timezone);
      if (suggestedDate !== dateISO) {
        showConfirm(
          'Thời gian đã qua',
          `Thời gian bạn chọn đã qua. Bạn có muốn đặt cho ngày mai (${dayjs(
            suggestedDate,
          ).format('DD/MM/YYYY')})?`,
          () => {
            setDateISO(suggestedDate);
            saveAlarm(suggestedDate);
          },
        );
        return;
      }
    }

    await saveAlarm(dateISO);
  }, [
    type,
    timeHHmm,
    dateISO,
    daysOfWeek,
    timezone,
    saveAlarm,
    showWarning,
    showConfirm,
  ]);

  return (
    <ScrollView
      className="flex-1"
      style={{backgroundColor: colors.background}}
      showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Chọn loại báo thức */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-6">
          <AppText variant="body" weight="semibold" className="text-foreground mb-3">
            Loại báo thức
          </AppText>

          <SegmentedControl
            options={[
              {label: 'Một lần', value: 'ONE_TIME'},
              {label: 'Lặp lại', value: 'REPEATING'},
            ]}
            selectedValue={type}
            onChange={handleTypeChange}
          />
        </Animated.View>

        {/* Quick time presets */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-6">
          <AppText variant="body" weight="semibold" className="text-foreground mb-3">
            Thời gian nhanh
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            <Chip
              variant={timeHHmm === '06:00' ? 'primary' : 'outline'}
              selected={timeHHmm === '06:00'}
              onPress={() => setQuickTime('06:00')}
              icon={<Icon name="Sunrise" className="w-4 h-4" />}>
              Sáng sớm (6:00)
            </Chip>
            <Chip
              variant={timeHHmm === '08:00' ? 'primary' : 'outline'}
              selected={timeHHmm === '08:00'}
              onPress={() => setQuickTime('08:00')}
              icon={<Icon name="Coffee" className="w-4 h-4" />}>
              Buổi sáng (8:00)
            </Chip>
            <Chip
              variant={timeHHmm === '12:00' ? 'primary' : 'outline'}
              selected={timeHHmm === '12:00'}
              onPress={() => setQuickTime('12:00')}
              icon={<Icon name="Sun" className="w-4 h-4" />}>
              Trưa (12:00)
            </Chip>
            <Chip
              variant={timeHHmm === '18:00' ? 'primary' : 'outline'}
              selected={timeHHmm === '18:00'}
              onPress={() => setQuickTime('18:00')}
              icon={<Icon name="Sunset" className="w-4 h-4" />}>
              Chiều (18:00)
            </Chip>
            <Chip
              variant={timeHHmm === '21:00' ? 'primary' : 'outline'}
              selected={timeHHmm === '21:00'}
              onPress={() => setQuickTime('21:00')}
              icon={<Icon name="Moon" className="w-4 h-4" />}>
              Tối (21:00)
            </Chip>
          </View>
        </Animated.View>

        {/* Chọn giờ */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TimePicker value={timeHHmm} onChange={setTimeHHmm} />
        </Animated.View>

        {/* Chọn ngày (ONE_TIME) */}
        {type === 'ONE_TIME' && (
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <DatePicker value={dateISO} onChange={setDateISO} />
          </Animated.View>
        )}

        {/* Chọn ngày trong tuần (REPEATING) */}
        {type === 'REPEATING' && (
          <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-6">
            <AppText variant="body" weight="semibold" className="text-foreground mb-3">
              Lặp vào các ngày
            </AppText>

            {/* Nút "Tất cả các ngày" */}
            <AppButton variant="outline" onPress={selectAllDays} className="mb-3">
              <View className="flex-row items-center gap-2">
                <Icon name="CalendarDays" className="w-5 h-5 text-foreground" />
                <AppText variant="body" weight="semibold" className="text-foreground" raw>
                  Tất cả các ngày
                </AppText>
              </View>
            </AppButton>

            {/* Chips ngày trong tuần */}
            <View className="flex-row flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <Chip
                  key={day}
                  variant={daysOfWeek.includes(day) ? 'primary' : 'outline'}
                  selected={daysOfWeek.includes(day)}
                  onPress={() => toggleDay(day)}>
                  {getDayFullName(day)}
                </Chip>
              ))}
            </View>

            {daysOfWeek.length === 0 && (
              <View className="flex-row items-center gap-2 mt-3">
                <Icon name="Info" className="w-4 h-4 text-error" />
                <AppText variant="bodySmall" className="text-error">
                  Vui lòng chọn ít nhất 1 ngày
                </AppText>
              </View>
            )}
          </Animated.View>
        )}

        {/* Preview */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
          <AlarmPreview
            type={type}
            time={timeHHmm}
            date={dateISO}
            selectedDays={daysOfWeek}
          />
        </Animated.View>

        {/* Nút Lưu */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <AppButton variant="primary" onPress={handleSave}>
            <View className="flex-row items-center gap-2">
              <Icon name="Save" className="w-5 h-5 text-background" />
              <AppText variant="body" weight="semibold" className="text-background" raw>
                {isEditing ? 'Cập nhật báo thức' : 'Tạo báo thức'}
              </AppText>
            </View>
          </AppButton>
        </Animated.View>
      </View>
    </ScrollView>
  );
}


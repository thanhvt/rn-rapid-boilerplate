/**
 * Mục đích: Component chọn giờ (HH:mm) với Bottom Sheet
 * Tham số vào: value (string HH:mm), onChange (callback)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi cần chọn giờ trong AlarmEditor
 */

import React, {useRef, useCallback} from 'react';
import {View, Pressable} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {BottomSheetModal, BottomSheetView, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import type {BottomSheetBackdropProps} from '@gorhom/bottom-sheet';
import {AppText, Icon, AppButton} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {useInsets} from '@/hooks/useInsets';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({
  value,
  onChange,
  label = 'Thời gian',
}: TimePickerProps): React.JSX.Element {
  const colors = useColors();
  const insets = useInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  /**
   * Mục đích: Chuyển HH:mm string thành Date object
   * Tham số vào: timeStr (string HH:mm)
   * Tham số ra: Date
   * Khi nào dùng: Khi cần hiển thị picker
   */
  const parseTimeToDate = useCallback((timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    return date;
  }, []);

  /**
   * Mục đích: Xử lý khi người dùng chọn giờ
   * Tham số vào: event, selectedDate (Date)
   * Tham số ra: void
   * Khi nào dùng: Callback từ DateTimePicker
   */
  const handleChange = useCallback(
    (_event: any, selectedDate?: Date) => {
      if (selectedDate) {
        const hours = selectedDate.getHours().toString().padStart(2, '0');
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
        onChange(`${hours}:${minutes}`);
      }
    },
    [onChange],
  );

  /**
   * Mục đích: Mở bottom sheet picker
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User nhấn vào time display
   */
  const handleOpen = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  /**
   * Mục đích: Đóng bottom sheet picker
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User nhấn nút Xong
   */
  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  /**
   * Mục đích: Render backdrop cho bottom sheet
   * Tham số vào: props (BottomSheetBackdropProps)
   * Tham số ra: JSX.Element
   * Khi nào dùng: Bottom sheet cần backdrop
   */
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <>
      <View className="mb-6">
        <AppText variant="body" weight="semibold" className="text-foreground mb-3">
          {label}
        </AppText>

        {/* Nút hiển thị giờ hiện tại */}
        <Pressable
          onPress={handleOpen}
          style={{
            backgroundColor: colors.neutrals1000,
            borderColor: colors.primary,
          }}
          className="rounded-xl p-6 border-2 items-center active:opacity-80">
          <View className="flex-row items-center gap-4">
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{backgroundColor: colors.primary + '20'}}>
              <Icon name="Clock" className="w-7 h-7 text-primary" />
            </View>
            <AppText
              variant="heading1"
              weight="bold"
              className="text-primary"
              style={{fontSize: 52, letterSpacing: 2}}>
              {value}
            </AppText>
          </View>
        </Pressable>
      </View>

      {/* Bottom Sheet Time Picker */}
      <BottomSheetModal
        ref={bottomSheetRef}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        enableContentPanningGesture
        enableDynamicSizing
        backgroundStyle={{backgroundColor: colors.neutrals1000}}
        handleIndicatorStyle={{backgroundColor: colors.neutrals400}}>
        <BottomSheetView
          style={{
            paddingBottom: insets.bottom || 16,
          }}>
          <View className="px-6 py-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4 pb-4 border-b" style={{borderBottomColor: colors.neutrals800}}>
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{backgroundColor: colors.primary + '20'}}>
                  <Icon name="Clock" className="w-5 h-5 text-primary" />
                </View>
                <AppText variant="heading4" weight="bold" className="text-foreground">
                  Chọn giờ
                </AppText>
              </View>
              <AppText variant="heading3" weight="bold" className="text-primary">
                {value}
              </AppText>
            </View>

            {/* Time Picker */}
            <View className="items-center py-4">
              <DateTimePicker
                value={parseTimeToDate(value)}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleChange}
                textColor={colors.foreground}
                style={{
                  width: '100%',
                  height: 200,
                }}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-4">
              <View className="flex-1">
                <AppButton variant="outline" onPress={handleClose}>
                  <View className="flex-row items-center justify-center gap-2">
                    <Icon name="X" className="w-5 h-5 text-foreground" />
                    <AppText variant="body" weight="semibold" className="text-foreground">
                      Hủy
                    </AppText>
                  </View>
                </AppButton>
              </View>
              <View className="flex-1">
                <AppButton variant="primary" onPress={handleClose}>
                  <View className="flex-row items-center justify-center gap-2">
                    <Icon name="Check" className="w-5 h-5 text-background" />
                    <AppText variant="body" weight="semibold" className="text-background">
                      Xong
                    </AppText>
                  </View>
                </AppButton>
              </View>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}


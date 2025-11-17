/**
 * Mục đích: Màn hình tạo/sửa ghi chú
 * Tham số vào: navigation props, route params (noteId optional)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi người dùng tạo mới hoặc chỉnh sửa ghi chú
 */

import React, {useEffect, useState, useCallback, useRef} from 'react';
import {View, ScrollView, KeyboardAvoidingView, Platform, TextInput, Keyboard} from 'react-native';
import Animated, {FadeInDown, FadeIn} from 'react-native-reanimated';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNotesStore} from '@/stores/notesStore';
import type {RootStackParamList} from '@/navigation/types';
import {AppText, AppInput, AppButton, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {useToast} from '@/components/ui/ToastProvider';
import {useDialog} from '@/components/ui/DialogProvider';
import {useInsets} from '@/hooks/useInsets';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteEditor'>;

export function NoteEditorScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const colors = useColors();
  const insets = useInsets();
  const {showSuccess, showError, showWarning} = useToast();
  const {showConfirm} = useDialog();

  const {noteId} = route.params || {};
  const notes = useNotesStore(state => state.notes);
  const createNote = useNotesStore(state => state.createNote);
  const updateNote = useNotesStore(state => state.updateNote);
  const deleteNote = useNotesStore(state => state.deleteNote);
  const loading = useNotesStore(state => state.loading);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const originalTitle = useRef('');
  const originalContent = useRef('');
  const contentInputRef = useRef<TextInput>(null);

  const isEditMode = !!noteId;

  /**
   * Mục đích: Load note nếu edit mode
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Component mount với noteId
   */
  useEffect(() => {
    if (noteId) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content || '');
        originalTitle.current = note.title;
        originalContent.current = note.content || '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  /**
   * Mục đích: Set header title
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Component mount hoặc isEditMode thay đổi
   */
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú mới',
    });
  }, [navigation, isEditMode]);

  /**
   * Mục đích: Listen keyboard show/hide để hiển thị sticky buttons
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Component mount
   */
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  /**
   * Mục đích: Detect changes để hiển thị warning khi cancel
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: title hoặc content thay đổi
   */
  useEffect(() => {
    const changed =
      title !== originalTitle.current || content !== originalContent.current;
    setHasChanges(changed);
  }, [title, content]);

  /**
   * Mục đích: Validate title input
   * Tham số vào: value
   * Tham số ra: boolean (valid or not)
   * Khi nào dùng: Khi user nhập title
   */
  const validateTitle = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setTitleError('Vui lòng nhập tiêu đề ghi chú');
      return false;
    }
    if (value.trim().length < 3) {
      setTitleError('Tiêu đề phải có ít nhất 3 ký tự');
      return false;
    }
    if (value.trim().length > 100) {
      setTitleError('Tiêu đề không được quá 100 ký tự');
      return false;
    }
    setTitleError('');
    return true;
  }, []);

  /**
   * Mục đích: Handle title change
   * Tham số vào: value
   * Tham số ra: void
   * Khi nào dùng: User nhập title
   */
  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (titleError) {
        validateTitle(value);
      }
    },
    [titleError, validateTitle],
  );

  /**
   * Mục đích: Xử lý lưu note
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: User nhấn nút lưu
   */
  const handleSave = useCallback(async () => {
    // Validation
    if (!validateTitle(title)) {
      showWarning('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && noteId) {
        // Update existing note
        await updateNote({
          id: noteId,
          title: title.trim(),
          content: content.trim() || undefined,
        });
        showSuccess('Đã cập nhật ghi chú thành công');
        navigation.goBack();
      } else {
        // Create new note
        await createNote({
          title: title.trim(),
          content: content.trim() || undefined,
        });
        showSuccess('Đã tạo ghi chú mới thành công');
        navigation.goBack();
      }
    } catch (error) {
      showError('Không thể lưu ghi chú');
      console.error('Lỗi khi lưu ghi chú:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    content,
    isEditMode,
    noteId,
    validateTitle,
    updateNote,
    createNote,
    navigation,
    showSuccess,
    showError,
    showWarning,
  ]);

  /**
   * Mục đích: Xử lý xóa note
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User nhấn nút xóa
   */
  const handleDelete = useCallback(() => {
    if (!noteId) return;

    showConfirm(
      'Xóa ghi chú',
      'Bạn có chắc muốn xóa ghi chú này? Tất cả báo thức liên quan cũng sẽ bị xóa.',
      async () => {
        try {
          await deleteNote(noteId);
          showSuccess('Đã xóa ghi chú thành công');
          navigation.goBack();
        } catch (error) {
          showError('Không thể xóa ghi chú');
          console.error('Lỗi khi xóa ghi chú:', error);
        }
      },
    );
  }, [noteId, deleteNote, navigation, showConfirm, showSuccess, showError]);

  /**
   * Mục đích: Xử lý hủy/quay lại
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User nhấn nút hủy hoặc back
   */
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      showConfirm(
        'Hủy thay đổi',
        'Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.',
        () => {
          navigation.goBack();
        },
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation, showConfirm]);

  // Loading state
  if (loading && isEditMode) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{backgroundColor: colors.background}}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Icon name="FileText" className="w-16 h-16 text-primary mb-4" />
          <AppText variant="body" className="text-neutrals400">
            Đang tải ghi chú...
          </AppText>
        </Animated.View>
      </View>
    );
  }

  const titleLength = title.trim().length;
  const contentLength = content.trim().length;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 0 : 16 }}
        >
          <View className="p-4">
            {/* Title input */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="mb-4"
            >
              <View className="flex-row items-center justify-between mb-2">
                <AppText
                  variant="body"
                  weight="semibold"
                  className="text-foreground"
                >
                  Tiêu đề{" "}
                  <AppText variant="body" className="text-error" raw>
                    *
                  </AppText>
                </AppText>
                <AppText
                  variant="caption"
                  className={
                    titleLength > 100 ? "text-error" : "text-neutrals400"
                  }
                  raw
                >
                  {titleLength}/100
                </AppText>
              </View>

              <AppInput
                placeholder="Nhập tiêu đề ghi chú..."
                value={title}
                onChangeText={handleTitleChange}
                autoFocus={!isEditMode}
                errorText={titleError}
                leftIcon={
                  <Icon name="FileText" className="w-5 h-5 text-neutrals400" />
                }
                returnKeyType="next"
                onSubmitEditing={() => {
                  // Focus vào content input khi nhấn Enter/Done
                  contentInputRef.current?.focus();
                }}
              />
            </Animated.View>

            {/* Content input */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="mb-4"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.primary + "20" }}
                  >
                    <Icon name="FileText" className="w-4 h-4 text-primary" />
                  </View>
                  <AppText
                    variant="body"
                    weight="semibold"
                    className="text-foreground"
                  >
                    Nội dung ghi chú
                  </AppText>
                </View>
                <View
                  className="px-2 py-1 rounded-md"
                  style={{ backgroundColor: colors.neutrals900 }}
                >
                  <AppText variant="caption" className="text-neutrals400">
                    {contentLength} / 5000
                  </AppText>
                </View>
              </View>

              <View
                className="rounded-xl border-2 overflow-hidden"
                style={{
                  backgroundColor: colors.neutrals1000,
                  borderColor: content
                    ? colors.primary + "40"
                    : colors.neutrals800,
                }}
              >
                <AppInput
                  ref={contentInputRef}
                  placeholder="..."
                  value={content}
                  onChangeText={setContent}
                  multiline={true}
                  numberOfLines={12}
                  variant="textarea"
                  textAlignVertical="top"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    // Nhấn Enter/Done → Tự động save
                    Keyboard.dismiss();
                    handleSave();
                  }}
                  style={{
                    minHeight: 240,
                    paddingTop: 16,
                    paddingBottom: 16,
                    fontSize: 15,
                    lineHeight: 22,
                  }}
                  className="border-0"
                />

                {/* Footer helper */}
                <View
                  className="px-4 py-3 border-t flex-row items-center gap-2"
                  style={{
                    backgroundColor: colors.neutrals900,
                    borderTopColor: colors.neutrals800,
                  }}
                >
                  <Icon name="Info" className="w-4 h-4 text-neutrals400" />
                  <AppText variant="caption" className="text-neutrals400">
                    Nội dung này sẽ được hiển thị trong chi tiết ghi chú
                  </AppText>
                </View>
              </View>
            </Animated.View>

            {/* Info card */}
            {hasChanges && (
              <Animated.View
                entering={FadeInDown.springify()}
                style={{
                  backgroundColor: colors.warning + "20",
                  borderColor: colors.warning + "40",
                }}
                className="p-3 rounded-lg border mb-4 flex-row items-center gap-2"
              >
                <Icon name="Info" className="w-5 h-5 text-warning" />
                <AppText variant="bodySmall" className="text-warning flex-1">
                  Bạn có thay đổi chưa lưu
                </AppText>
              </Animated.View>
            )}

            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="gap-3"
            >
              <AppButton
                variant="primary"
                onPress={handleSave}
                loading={isSaving}
                disabled={isSaving}
              >
                <View className="flex-row items-center gap-2">
                  <Icon name="Save" className="w-5 h-5 text-background" />
                  <AppText
                    variant="body"
                    weight="semibold"
                    className="text-background"
                    raw
                  >
                    {isEditMode ? "Cập nhật" : "Tạo ghi chú"}
                  </AppText>
                </View>
              </AppButton>

              <AppButton
                variant="outline"
                onPress={handleCancel}
                disabled={isSaving}
              >
                <View className="flex-row items-center gap-2">
                  <Icon name="X" className="w-5 h-5 text-foreground" />
                  <AppText
                    variant="body"
                    weight="semibold"
                    className="text-foreground"
                    raw
                  >
                    Hủy
                  </AppText>
                </View>
              </AppButton>

              {isEditMode && (
                <AppButton
                  variant="ghost"
                  onPress={handleDelete}
                  disabled={isSaving}
                  className="border border-error/30"
                >
                  <View className="flex-row items-center gap-2">
                    <Icon name="Trash2" className="w-5 h-5 text-error" />
                    <AppText
                      variant="body"
                      weight="semibold"
                      className="text-error"
                      raw
                    >
                      Xóa ghi chú
                    </AppText>
                  </View>
                </AppButton>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky buttons khi keyboard hiển thị */}
      {/* {isKeyboardVisible && (
        <Animated.View
          entering={FadeInDown.springify()}
          style={{
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom || 16,
          }}
          className="border-t px-4 pt-3 gap-3"
        >
          <AppButton
            variant="primary"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
          >
            <View className="flex-row items-center gap-2">
              <Icon name="Save" className="w-5 h-5 text-background" />
              <AppText
                variant="body"
                weight="semibold"
                className="text-background"
                raw
              >
                {isEditMode ? "Cập nhật" : "Tạo ghi chú"}
              </AppText>
            </View>
          </AppButton>

          <AppButton
            variant="outline"
            onPress={handleCancel}
            disabled={isSaving}
          >
            <View className="flex-row items-center gap-2">
              <Icon name="X" className="w-5 h-5 text-foreground" />
              <AppText
                variant="body"
                weight="semibold"
                className="text-foreground"
                raw
              >
                Hủy
              </AppText>
            </View>
          </AppButton>
        </Animated.View>
      )} */}
    </View>
  );
}


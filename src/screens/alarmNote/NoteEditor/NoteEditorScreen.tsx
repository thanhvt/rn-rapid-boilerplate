/**
 * Mục đích: Màn hình tạo/sửa ghi chú
 * Tham số vào: navigation props, route params (noteId optional)
 * Tham số ra: JSX.Element
 * Khi nào dùng: Khi người dùng tạo mới hoặc chỉnh sửa ghi chú
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNotesStore} from '@/stores/notesStore';
import type {RootStackParamList} from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteEditor'>;

export function NoteEditorScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const {noteId} = route.params || {};
  const {getNoteById, createNote, updateNote, deleteNote, loading} =
    useNotesStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!noteId;

  // Load note nếu edit mode
  useEffect(() => {
    if (noteId) {
      const note = getNoteById(noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content || '');
      }
    }
  }, [noteId, getNoteById]);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú mới',
    });
  }, [navigation, isEditMode]);

  // Xử lý lưu
  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề ghi chú');
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
        Alert.alert('Thành công', 'Đã cập nhật ghi chú', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        // Create new note
        await createNote({
          title: title.trim(),
          content: content.trim() || undefined,
        });
        Alert.alert('Thành công', 'Đã tạo ghi chú mới', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu ghi chú');
      console.error('Lỗi khi lưu ghi chú:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý xóa
  const handleDelete = () => {
    if (!noteId) return;

    Alert.alert(
      'Xóa ghi chú',
      'Bạn có chắc muốn xóa ghi chú này? Tất cả báo thức liên quan cũng sẽ bị xóa.',
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              Alert.alert('Thành công', 'Đã xóa ghi chú', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa ghi chú');
              console.error('Lỗi khi xóa ghi chú:', error);
            }
          },
        },
      ],
    );
  };

  // Xử lý hủy
  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        'Hủy thay đổi',
        'Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.',
        [
          {text: 'Tiếp tục chỉnh sửa', style: 'cancel'},
          {text: 'Hủy', style: 'destructive', onPress: () => navigation.goBack()},
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading && isEditMode) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-4">Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="p-4">
          {/* Title input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-lg"
              placeholder="Nhập tiêu đề ghi chú..."
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
              autoFocus={!isEditMode}
            />
          </View>

          {/* Content input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Nội dung
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
              placeholder="Nhập nội dung ghi chú..."
              value={content}
              onChangeText={setContent}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              style={{minHeight: 200}}
            />
          </View>

          {/* Action buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              className={`py-3 rounded-lg ${
                isSaving ? 'bg-gray-400' : 'bg-blue-500'
              }`}
              onPress={handleSave}
              disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  {isEditMode ? 'Cập nhật' : 'Tạo ghi chú'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 py-3 rounded-lg"
              onPress={handleCancel}
              disabled={isSaving}>
              <Text className="text-gray-700 text-center font-semibold text-lg">
                Hủy
              </Text>
            </TouchableOpacity>

            {isEditMode && (
              <TouchableOpacity
                className="bg-red-500 py-3 rounded-lg"
                onPress={handleDelete}
                disabled={isSaving}>
                <Text className="text-white text-center font-semibold text-lg">
                  Xóa ghi chú
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


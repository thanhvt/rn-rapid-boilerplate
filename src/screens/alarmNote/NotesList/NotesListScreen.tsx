/**
 * Mục đích: Màn hình danh sách ghi chú
 * Tham số vào: navigation props
 * Tham số ra: JSX.Element
 * Khi nào dùng: Màn hình chính khi mở app, hiển thị danh sách ghi chú
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNotesStore} from '@/stores/notesStore';
import {useAlarmsStore} from '@/stores/alarmsStore';
import type {Note} from '@/types/alarmNote';
import {formatTimestamp} from '@/utils/alarmNoteHelpers';
import type {MainTabParamList, RootStackParamList} from '@/navigation/types';
import { checkPendingNotifications, testScheduleSimpleNotification } from '@/utils/testNotifications';
type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'NOTES'>,
  NativeStackScreenProps<RootStackParamList>
>;

type SortOption = 'date' | 'title';

export function NotesListScreen({navigation}: Props): React.JSX.Element {
  const {notes, loading, loadNotes, searchNotes, deleteNote} = useNotesStore();
  const alarms = useAlarmsStore(state => state.alarms);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [refreshing, setRefreshing] = useState(false);

  // Load notes khi mount
  useEffect(() => {
    loadNotes();
    // testScheduleSimpleNotification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchNotes(query);
    } else {
      await loadNotes();
    }
  };

  // Xử lý pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  // Xử lý delete note
  const handleDeleteNote = (noteId: string) => {
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
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa ghi chú');
            }
          },
        },
      ],
    );
  };

  // Sort notes
  const sortedNotes = React.useMemo(() => {
    const notesCopy = [...notes];
    if (sortBy === 'date') {
      return notesCopy.sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      return notesCopy.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [notes, sortBy]);

  // Render note item
  const renderNoteItem = ({item}: {item: Note}) => {
    const noteAlarms = alarms.filter(a => a.noteId === item.id);
    const enabledAlarmsCount = noteAlarms.filter(a => a.enabled).length;

    return (
      <TouchableOpacity
        className="bg-white p-4 mb-3 rounded-lg shadow-sm border border-gray-200"
        onPress={() => navigation.navigate('NoteEditor', {noteId: item.id})}
        activeOpacity={0.7}>
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-semibold text-gray-800 flex-1">
            {item.title}
          </Text>
          {enabledAlarmsCount > 0 && (
            <View className="bg-blue-100 px-2 py-1 rounded">
              <Text className="text-xs text-blue-600 font-medium">
                🔔 {enabledAlarmsCount}
              </Text>
            </View>
          )}
        </View>

        {item.content && (
          <Text className="text-gray-600 mb-2" numberOfLines={2}>
            {item.content}
          </Text>
        )}

        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-400">
            {formatTimestamp(item.updatedAt)}
          </Text>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="bg-blue-500 px-3 py-1 rounded"
              onPress={() =>
                navigation.navigate('AlarmManager', {noteId: item.id})
              }>
              <Text className="text-white text-xs font-medium">Báo thức</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-500 px-3 py-1 rounded"
              onPress={() => handleDeleteNote(item.id)}>
              <Text className="text-white text-xs font-medium">Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center py-20">
      <Text className="text-6xl mb-4">📝</Text>
      <Text className="text-xl font-semibold text-gray-700 mb-2">
        Chưa có ghi chú
      </Text>
      <Text className="text-gray-500 text-center px-8">
        Nhấn nút "+" bên dưới để tạo ghi chú đầu tiên
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          Ghi chú của tôi
        </Text>

        {/* Search bar */}
        <TextInput
          className="bg-gray-100 px-4 py-3 rounded-lg text-gray-800"
          placeholder="Tìm kiếm ghi chú..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#9CA3AF"
        />

        {/* Sort options */}
        <View className="flex-row mt-3 space-x-2">
          <TouchableOpacity
            className={`px-3 py-2 rounded ${
              sortBy === 'date' ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            onPress={() => setSortBy('date')}>
            <Text
              className={`text-sm font-medium ${
                sortBy === 'date' ? 'text-white' : 'text-gray-700'
              }`}>
              Mới nhất
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-2 rounded ${
              sortBy === 'title' ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            onPress={() => setSortBy('title')}>
            <Text
              className={`text-sm font-medium ${
                sortBy === 'title' ? 'text-white' : 'text-gray-700'
              }`}>
              Tên A-Z
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes list */}
      {loading && notes.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedNotes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 16}}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Floating action button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-500 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={() => navigation.navigate('NoteEditor', {})}
        activeOpacity={0.8}>
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}


/**
 * Mục đích: Màn hình danh sách ghi chú
 * Tham số vào: navigation props
 * Tham số ra: JSX.Element
 * Khi nào dùng: Màn hình chính khi mở app, hiển thị danh sách ghi chú
 */

import React, {useEffect, useState, useCallback} from 'react';
import {View, FlatList, RefreshControl, Pressable} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNotesStore} from '@/stores/notesStore';
import {useAlarmsStore} from '@/stores/alarmsStore';
import type {Note} from '@/types/alarmNote';
import type {MainTabParamList, RootStackParamList} from '@/navigation/types';
import {AppText, AppInput, Icon, Chip} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {useToast} from '@/components/ui/ToastProvider';
import {useDialog} from '@/components/ui/DialogProvider';
import {NoteCard, EmptyState, SkeletonLoader} from '@/components/alarmNote';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'NOTES'>,
  NativeStackScreenProps<RootStackParamList>
>;

type SortOption = 'date' | 'title';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NotesListScreen({navigation}: Props): React.JSX.Element {
  const colors = useColors();
  const {showSuccess, showError} = useToast();
  const {showConfirm} = useDialog();
  const insets = useSafeAreaInsets();

  const {notes, loading, loadNotes, searchNotes, deleteNote} = useNotesStore();
  const alarms = useAlarmsStore(state => state.alarms);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [refreshing, setRefreshing] = useState(false);

  const fabScale = useSharedValue(1);

  /**
   * Mục đích: Load notes khi mount
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: Component mount lần đầu
   */
  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Mục đích: Xử lý search notes
   * Tham số vào: query string
   * Tham số ra: Promise<void>
   * Khi nào dùng: User nhập vào search input
   */
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        await searchNotes(query);
      } else {
        await loadNotes();
      }
    },
    [searchNotes, loadNotes],
  );

  /**
   * Mục đích: Xử lý pull-to-refresh
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: User kéo xuống để refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  /**
   * Mục đích: Xử lý delete note
   * Tham số vào: noteId
   * Tham số ra: void
   * Khi nào dùng: User nhấn nút xóa note
   */
  const handleDeleteNote = useCallback(
    (noteId: string) => {
      showConfirm(
        'Xóa ghi chú',
        'Bạn có chắc muốn xóa ghi chú này? Tất cả báo thức liên quan cũng sẽ bị xóa.',
        async () => {
          try {
            await deleteNote(noteId);
            showSuccess('Đã xóa ghi chú thành công');
          } catch (error) {
            showError('Không thể xóa ghi chú');
          }
        },
      );
    },
    [deleteNote, showConfirm, showSuccess, showError],
  );

  /**
   * Mục đích: Sort notes theo option
   * Tham số vào: notes array, sortBy option
   * Tham số ra: sorted notes array
   * Khi nào dùng: Render danh sách notes
   */
  const sortedNotes = React.useMemo(() => {
    const notesCopy = [...notes];
    if (sortBy === 'date') {
      return notesCopy.sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      return notesCopy.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [notes, sortBy]);

  /**
   * Mục đích: Render note item
   * Tham số vào: item, index
   * Tham số ra: JSX.Element
   * Khi nào dùng: FlatList renderItem
   */
  const renderNoteItem = useCallback(
    ({item, index}: {item: Note; index: number}) => {
      const noteAlarms = alarms.filter(a => a.noteId === item.id);
      const enabledAlarmsCount = noteAlarms.filter(a => a.enabled).length;

      return (
        <NoteCard
          note={item}
          enabledAlarmsCount={enabledAlarmsCount}
          index={index}
          onPress={() => {
            navigation.navigate('NoteEditor', {noteId: item.id});
          }}
          onAlarmPress={() => {
            navigation.navigate('AlarmManager', {noteId: item.id});
          }}
          onDeletePress={() => handleDeleteNote(item.id)}
        />
      );
    },
    [alarms, navigation, handleDeleteNote],
  );

  /**
   * Mục đích: Render empty state
   * Tham số vào: Không
   * Tham số ra: JSX.Element
   * Khi nào dùng: Khi danh sách rỗng
   */
  const renderEmptyState = useCallback(
    () => (
      <EmptyState
        iconName="FileText"
        title={searchQuery ? 'Không tìm thấy ghi chú' : 'Chưa có ghi chú'}
        description={
          searchQuery
            ? 'Thử tìm kiếm với từ khóa khác'
            : 'Nhấn nút "+" bên dưới để tạo ghi chú đầu tiên'
        }
        actionLabel={searchQuery ? undefined : 'Tạo ghi chú mới'}
        onAction={
          searchQuery ? undefined : () => navigation.navigate('NoteEditor', {})
        }
      />
    ),
    [searchQuery, navigation],
  );

  /**
   * Mục đích: Get item layout cho FlatList optimization
   * Tham số vào: data, index
   * Tham số ra: {length, offset, index}
   * Khi nào dùng: FlatList getItemLayout
   */
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 120, // Approximate height của note card
      offset: 120 * index,
      index,
    }),
    [],
  );

  /**
   * Mục đích: Handle FAB press animation
   * Tham số vào: Không
   * Tham số ra: void
   * Khi nào dùng: User press FAB
   */
  const handleFABPressIn = () => {
    fabScale.value = withSpring(0.9, {damping: 15, stiffness: 300});
  };

  const handleFABPressOut = () => {
    fabScale.value = withSpring(1, {damping: 15, stiffness: 300});
  };

  const handleFABPress = () => {
    navigation.navigate('NoteEditor', {});
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: fabScale.value}],
  }));

  return (
    <View className="flex-1" style={{backgroundColor: colors.background}}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          backgroundColor: colors.neutrals1000,
          borderBottomColor: colors.neutrals800,
          paddingTop: insets.top + 16,
        }}
        className="px-4 pb-4 shadow-sm border-b">
        <AppText variant="heading2" weight="bold" className="text-foreground mb-4">
          Ghi chú của tôi
        </AppText>

        {/* Search bar */}
        <AppInput
          placeholder="Tìm kiếm ghi chú..."
          value={searchQuery}
          onChangeText={handleSearch}
          leftIcon={<Icon name="Search" className="w-5 h-5 text-neutrals400" />}
          rightIcon={
            searchQuery ? (
              <Pressable onPress={() => handleSearch('')}>
                <Icon name="X" className="w-5 h-5 text-neutrals400" />
              </Pressable>
            ) : undefined
          }
        />

        {/* Sort options */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="flex-row mt-3 gap-2">
          <Chip
            variant={sortBy === 'date' ? 'primary' : 'outline'}
            selected={sortBy === 'date'}
            onPress={() => {
              setSortBy('date');
            }}
            icon={<Icon name="Clock" className="w-4 h-4" />}>
            Mới nhất
          </Chip>

          <Chip
            variant={sortBy === 'title' ? 'primary' : 'outline'}
            selected={sortBy === 'title'}
            onPress={() => {
              setSortBy('title');
            }}
            icon={<Icon name="ArrowDownAZ" className="w-4 h-4" />}>
            Tên A-Z
          </Chip>
        </Animated.View>
      </Animated.View>

      {/* Notes list */}
      {loading && notes.length === 0 ? (
        <SkeletonLoader type="note" count={5} />
      ) : (
        <FlatList
          data={sortedNotes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 16, flexGrow: 1}}
          ListEmptyComponent={renderEmptyState}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Floating action button */}
      <AnimatedPressable
        entering={FadeInUp.delay(300).springify()}
        style={[
          fabAnimatedStyle,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={handleFABPress}
        onPressIn={handleFABPressIn}
        onPressOut={handleFABPressOut}>
        <Icon name="Plus" className="w-6 h-6 text-background" />
      </AnimatedPressable>
    </View>
  );
}


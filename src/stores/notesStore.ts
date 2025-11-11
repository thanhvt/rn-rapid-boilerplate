/**
 * Mục đích: Zustand store cho Notes state management
 * Tham số vào: Không (global state)
 * Tham số ra: Store hooks
 * Khi nào dùng: Quản lý state Notes trong toàn app
 */

import {create} from 'zustand';
import {Note, CreateNoteInput, UpdateNoteInput} from '@/types/alarmNote';
import * as notesRepo from '@/repositories/notesRepository';

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;

  // Actions
  loadNotes: () => Promise<void>;
  createNote: (input: CreateNoteInput) => Promise<Note>;
  updateNote: (input: UpdateNoteInput) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  getNoteById: (id: string) => Note | undefined;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  /**
   * Mục đích: Load tất cả ghi chú từ DB
   * Tham số vào: Không
   * Tham số ra: Promise<void>
   * Khi nào dùng: Khởi tạo app, refresh danh sách
   */
  loadNotes: async () => {
    set({loading: true, error: null});
    try {
      const notes = await notesRepo.getAllNotes();
      set({notes, loading: false});
      console.log('[NotesStore] Load notes thành công:', notes.length);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[NotesStore] Lỗi load notes:', error);
    }
  },

  /**
   * Mục đích: Tạo ghi chú mới
   * Tham số vào: input (CreateNoteInput)
   * Tham số ra: Promise<Note>
   * Khi nào dùng: Người dùng tạo ghi chú mới
   */
  createNote: async (input: CreateNoteInput) => {
    set({loading: true, error: null});
    try {
      const note = await notesRepo.createNote(input);
      set(state => ({
        notes: [note, ...state.notes],
        loading: false,
      }));
      console.log('[NotesStore] Tạo note thành công:', note.id);
      return note;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[NotesStore] Lỗi tạo note:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Cập nhật ghi chú
   * Tham số vào: input (UpdateNoteInput)
   * Tham số ra: Promise<Note | null>
   * Khi nào dùng: Người dùng chỉnh sửa ghi chú
   */
  updateNote: async (input: UpdateNoteInput) => {
    set({loading: true, error: null});
    try {
      const updatedNote = await notesRepo.updateNote(input);
      if (updatedNote) {
        set(state => ({
          notes: state.notes.map(n => (n.id === updatedNote.id ? updatedNote : n)),
          loading: false,
        }));
        console.log('[NotesStore] Cập nhật note thành công:', updatedNote.id);
      }
      return updatedNote;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[NotesStore] Lỗi cập nhật note:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Xóa ghi chú
   * Tham số vào: id (string)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Người dùng xóa ghi chú
   */
  deleteNote: async (id: string) => {
    set({loading: true, error: null});
    try {
      await notesRepo.deleteNote(id);
      set(state => ({
        notes: state.notes.filter(n => n.id !== id),
        loading: false,
      }));
      console.log('[NotesStore] Xóa note thành công:', id);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[NotesStore] Lỗi xóa note:', error);
      throw error;
    }
  },

  /**
   * Mục đích: Tìm kiếm ghi chú
   * Tham số vào: query (string)
   * Tham số ra: Promise<void>
   * Khi nào dùng: Người dùng tìm kiếm ghi chú
   */
  searchNotes: async (query: string) => {
    set({loading: true, error: null});
    try {
      const notes = query.trim()
        ? await notesRepo.searchNotesByTitle(query)
        : await notesRepo.getAllNotes();
      set({notes, loading: false});
      console.log('[NotesStore] Tìm kiếm notes:', query, '- Kết quả:', notes.length);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({error: errorMsg, loading: false});
      console.error('[NotesStore] Lỗi tìm kiếm notes:', error);
    }
  },

  /**
   * Mục đích: Lấy note theo ID từ state
   * Tham số vào: id (string)
   * Tham số ra: Note | undefined
   * Khi nào dùng: Selector để lấy note từ state
   */
  getNoteById: (id: string) => {
    return get().notes.find(n => n.id === id);
  },
}));


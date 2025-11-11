/**
 * Mục đích: Repository cho Notes - CRUD operations
 * Tham số vào: Database queries
 * Tham số ra: Note models
 * Khi nào dùng: Mọi thao tác với Notes table
 */

import {getDatabase} from '@/database/db';
import {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  NoteRow,
  mapNoteRowToModel,
} from '@/types/alarmNote';
import {generateId} from '@/utils/alarmNoteHelpers';

/**
 * Mục đích: Tạo ghi chú mới
 * Tham số vào: input (CreateNoteInput)
 * Tham số ra: Promise<Note>
 * Khi nào dùng: Khi người dùng tạo ghi chú mới
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const db = await getDatabase();
  const now = Date.now();
  const id = generateId();

  const note: Note = {
    id,
    title: input.title,
    content: input.content || null,
    createdAt: now,
    updatedAt: now,
  };

  await db.executeSql(
    `INSERT INTO Notes (id, title, content, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?)`,
    [note.id, note.title, note.content, note.createdAt, note.updatedAt],
  );

  console.log('[NotesRepo] Tạo ghi chú mới:', note.id);
  return note;
}

/**
 * Mục đích: Lấy tất cả ghi chú
 * Tham số vào: Không
 * Tham số ra: Promise<Note[]>
 * Khi nào dùng: Hiển thị danh sách ghi chú
 */
export async function getAllNotes(): Promise<Note[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM Notes ORDER BY updatedAt DESC',
  );

  const notes: Note[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i) as NoteRow;
    notes.push(mapNoteRowToModel(row));
  }

  console.log('[NotesRepo] Lấy tất cả ghi chú:', notes.length);
  return notes;
}

/**
 * Mục đích: Lấy ghi chú theo ID
 * Tham số vào: id (string)
 * Tham số ra: Promise<Note | null>
 * Khi nào dùng: Xem chi tiết hoặc chỉnh sửa ghi chú
 */
export async function getNoteById(id: string): Promise<Note | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql('SELECT * FROM Notes WHERE id = ?', [
    id,
  ]);

  if (result.rows.length === 0) {
    console.log('[NotesRepo] Không tìm thấy ghi chú:', id);
    return null;
  }

  const row = result.rows.item(0) as NoteRow;
  console.log('[NotesRepo] Lấy ghi chú:', id);
  return mapNoteRowToModel(row);
}

/**
 * Mục đích: Cập nhật ghi chú
 * Tham số vào: input (UpdateNoteInput)
 * Tham số ra: Promise<Note | null>
 * Khi nào dùng: Khi người dùng chỉnh sửa ghi chú
 */
export async function updateNote(
  input: UpdateNoteInput,
): Promise<Note | null> {
  const db = await getDatabase();
  const now = Date.now();

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  if (input.title !== undefined) {
    updates.push('title = ?');
    values.push(input.title);
  }
  if (input.content !== undefined) {
    updates.push('content = ?');
    values.push(input.content);
  }

  if (updates.length === 0) {
    console.log('[NotesRepo] Không có gì để cập nhật');
    return await getNoteById(input.id);
  }

  updates.push('updatedAt = ?');
  values.push(now);
  values.push(input.id);

  await db.executeSql(
    `UPDATE Notes SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  console.log('[NotesRepo] Cập nhật ghi chú:', input.id);
  return await getNoteById(input.id);
}

/**
 * Mục đích: Xóa ghi chú
 * Tham số vào: id (string)
 * Tham số ra: Promise<void>
 * Khi nào dùng: Khi người dùng xóa ghi chú (cascade xóa alarms)
 */
export async function deleteNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM Notes WHERE id = ?', [id]);
  console.log('[NotesRepo] Xóa ghi chú:', id);
}

/**
 * Mục đích: Tìm kiếm ghi chú theo tiêu đề
 * Tham số vào: query (string)
 * Tham số ra: Promise<Note[]>
 * Khi nào dùng: Khi người dùng tìm kiếm ghi chú
 */
export async function searchNotesByTitle(query: string): Promise<Note[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT * FROM Notes
     WHERE title LIKE ?
     ORDER BY updatedAt DESC`,
    [`%${query}%`],
  );

  const notes: Note[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i) as NoteRow;
    notes.push(mapNoteRowToModel(row));
  }

  console.log('[NotesRepo] Tìm kiếm ghi chú:', query, '- Kết quả:', notes.length);
  return notes;
}


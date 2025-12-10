import React, { useState } from 'react';
import { Job, Note } from '../../types';
import { XIcon, EditIcon } from '../shared/icons';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onAddNote: (jobId: string, noteText: string) => void;
  onUpdateNote?: (noteId: string, noteText: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, job, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(job.id, newNote.trim());
      setNewNote('');
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingText.trim() || !onUpdateNote) return;

    setIsSaving(true);
    try {
      await onUpdateNote(editingNoteId, editingText.trim());
      setEditingNoteId(null);
      setEditingText('');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!onDeleteNote) return;

    const confirmed = window.confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await onDeleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-full flex flex-col">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Job Notes</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{job.jobName} (#{job.jobNo})</p>
            </div>
            <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <XIcon />
            </button>
          </div>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          {(!job.notes || job.notes.length === 0) ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">No notes for this job yet.</div>
          ) : (
            <ul className="space-y-4">
              {job.notes.slice().reverse().map(note => (
                <li key={note.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                  {editingNoteId === note.id ? (
                    /* Edit Mode */
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-600 dark:text-gray-200 text-sm"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-500 hover:bg-gray-300 dark:hover:bg-gray-400 rounded disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSaving || !editingText.trim()}
                          className="px-3 py-1 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(note.date).toLocaleString()}
                        </p>
                        {(onUpdateNote || onDeleteNote) && (
                          <div className="flex items-center space-x-2">
                            {onUpdateNote && (
                              <button
                                onClick={() => handleStartEdit(note)}
                                className="text-xs text-brand-blue hover:text-brand-blue/80 font-medium"
                                title="Edit note"
                              >
                                Edit
                              </button>
                            )}
                            {onDeleteNote && (
                              <button
                                onClick={() => handleDelete(note.id)}
                                disabled={isSaving}
                                className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                                title="Delete note"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="newNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add a new note</label>
              <textarea
                id="newNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-700 dark:text-gray-200"
                placeholder="Type your note here..."
              />
            </div>
            <div className="text-right">
              <button
                type="submit"
                className="bg-brand-blue py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50"
                disabled={!newNote.trim()}
              >
                Add Note
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
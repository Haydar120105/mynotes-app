import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiService } from '../services/api';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('Offline Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    navigator.onLine = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Offline Storage', () => {
    it('should store folders in localStorage when offline', async () => {
      navigator.onLine = false;
      const folderData = { name: 'Offline Folder', icon: '📁' };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await apiService.createFolder(folderData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_folders',
        expect.stringContaining('Offline Folder')
      );
      expect(result).toMatchObject(folderData);
    });

    it('should store notes in localStorage when offline', async () => {
      navigator.onLine = false;
      const noteData = { title: 'Offline Note', content: 'Test content' };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await apiService.createNote(noteData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_notes',
        expect.stringContaining('Offline Note')
      );
      expect(result).toMatchObject(noteData);
    });

    it('should update existing offline folders', async () => {
      navigator.onLine = false;
      const existingFolders = [
        { id: 1, name: 'Old Name', icon: '📁', subfolders: [] }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingFolders));
      
      const updateData = { name: 'New Name' };
      const result = await apiService.updateFolder(1, updateData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_folders',
        expect.stringContaining('New Name')
      );
      expect(result).toMatchObject({ id: 1, ...updateData });
    });

    it('should soft delete notes when offline', async () => {
      navigator.onLine = false;
      const existingNotes = [
        { id: 1, title: 'Note to delete', content: 'Content', is_deleted: false }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingNotes));
      
      const result = await apiService.deleteNote(1);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_notes',
        expect.stringMatching(/"is_deleted":true/)
      );
      expect(result).toEqual({ message: 'Note deleted successfully' });
    });

    it('should retrieve offline folders when no network', async () => {
      navigator.onLine = false;
      const offlineFolders = [
        { id: 1, name: 'Offline Folder', icon: '📁', subfolders: [] }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(offlineFolders));
      
      const result = await apiService.getFolders();
      
      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual(offlineFolders);
    });

    it('should retrieve offline notes filtered by folder', async () => {
      navigator.onLine = false;
      const offlineNotes = [
        { id: 1, title: 'Note 1', folder_id: 1, is_deleted: false },
        { id: 2, title: 'Note 2', folder_id: 2, is_deleted: false },
        { id: 3, title: 'Note 3', folder_id: 1, is_deleted: false }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(offlineNotes));
      
      const result = await apiService.getNotes(1);
      
      expect(result).toHaveLength(2);
      expect(result.every(note => note.folder_id === 1)).toBe(true);
    });
  });

  describe('Sync Queue Management', () => {
    it('should add create operations to sync queue', async () => {
      navigator.onLine = false;
      const noteData = { title: 'Sync Note', content: 'Content' };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      
      await apiService.createNote(noteData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_sync_queue',
        expect.stringMatching(/"action":"create"/)
      );
    });

    it('should add update operations to sync queue', async () => {
      navigator.onLine = false;
      const existingNotes = [
        { id: 1, title: 'Original', content: 'Content' }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingNotes));
      
      await apiService.updateNote(1, { title: 'Updated' });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_sync_queue',
        expect.stringMatching(/"action":"update"/)
      );
    });

    it('should add delete operations to sync queue', async () => {
      navigator.onLine = false;
      const existingFolders = [
        { id: 1, name: 'To Delete', icon: '📁', subfolders: [] }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingFolders));
      
      await apiService.deleteFolder(1);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_sync_queue',
        expect.stringMatching(/"action":"delete"/)
      );
    });

    it('should include timestamp in sync queue entries', async () => {
      navigator.onLine = false;
      const noteData = { title: 'Timestamped Note', content: 'Content' };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      
      const beforeTime = new Date().toISOString();
      await apiService.createNote(noteData);
      const afterTime = new Date().toISOString();
      
      const syncQueueCall = localStorageMock.setItem.mock.calls.find(
        call => call[0] === 'mynotes_sync_queue'
      );
      
      expect(syncQueueCall).toBeDefined();
      const syncQueue = JSON.parse(syncQueueCall[1]);
      const entry = syncQueue[0];
      
      expect(entry.timestamp).toBeDefined();
      expect(entry.timestamp >= beforeTime).toBe(true);
      expect(entry.timestamp <= afterTime).toBe(true);
    });
  });

  describe('Online Sync Process', () => {
    it('should sync create operations when coming online', async () => {
      const syncQueue = [
        {
          type: 'note',
          action: 'create',
          data: { title: 'Offline Note', content: 'Content' },
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(syncQueue));
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'Offline Note', content: 'Content' })
      });
      
      await apiService.syncOfflineData();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Offline Note', content: 'Content' })
        })
      );
    });

    it('should sync update operations when coming online', async () => {
      const syncQueue = [
        {
          type: 'folder',
          action: 'update',
          data: { id: 1, name: 'Updated Folder', icon: '📁' },
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(syncQueue));
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Updated Folder', icon: '📁' })
      });
      
      await apiService.syncOfflineData();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/folders/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ id: 1, name: 'Updated Folder', icon: '📁' })
        })
      );
    });

    it('should sync delete operations when coming online', async () => {
      const syncQueue = [
        {
          type: 'note',
          action: 'delete',
          data: { id: 1 },
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(syncQueue));
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Note deleted successfully' })
      });
      
      await apiService.syncOfflineData();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should clear sync queue after successful sync', async () => {
      const syncQueue = [
        {
          type: 'note',
          action: 'create',
          data: { title: 'Test Note', content: 'Content' },
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(syncQueue));
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'Test Note', content: 'Content' })
      });
      
      await apiService.syncOfflineData();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_sync_queue',
        '[]'
      );
    });

    it('should handle sync failures gracefully', async () => {
      const syncQueue = [
        {
          type: 'note',
          action: 'create',
          data: { title: 'Failed Note', content: 'Content' },
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(syncQueue));
      
      fetch.mockRejectedValueOnce(new Error('Sync failed'));
      
      // Should not throw error
      await expect(apiService.syncOfflineData()).resolves.not.toThrow();
      
      // Failed item should remain in queue
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_sync_queue',
        JSON.stringify(syncQueue)
      );
    });
  });

  describe('Fallback to Offline Data', () => {
    it('should fallback to offline data when API fails', async () => {
      navigator.onLine = true;
      const offlineFolders = [
        { id: 1, name: 'Cached Folder', icon: '📁', subfolders: [] }
      ];
      
      fetch.mockRejectedValueOnce(new Error('API Error'));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(offlineFolders));
      
      const result = await apiService.getFolders();
      
      expect(result).toEqual(offlineFolders);
    });

    it('should cache successful API responses', async () => {
      navigator.onLine = true;
      const apiFolders = [
        { id: 1, name: 'API Folder', icon: '📁', subfolders: [] }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiFolders
      });
      
      await apiService.getFolders();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_folders',
        JSON.stringify(apiFolders)
      );
    });
  });

  describe('Default Data', () => {
    it('should return default folders when no offline data exists', async () => {
      navigator.onLine = false;
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = await apiService.getFolders();
      
      expect(result).toEqual([
        {
          id: 1,
          name: 'Persönlich',
          icon: '👤',
          subfolders: [
            { id: 11, name: 'Tagebuch', icon: '📖', subfolders: [] },
            { id: 12, name: 'Ideen', icon: '💡', subfolders: [] }
          ]
        },
        {
          id: 2,
          name: 'Arbeit',
          icon: '💼',
          subfolders: [
            { id: 21, name: 'Meetings', icon: '🤝', subfolders: [] },
            { id: 22, name: 'Projekte', icon: '📊', subfolders: [] }
          ]
        }
      ]);
    });

    it('should return empty array for notes when no offline data exists', async () => {
      navigator.onLine = false;
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = await apiService.getNotes();
      
      expect(result).toEqual([]);
    });
  });
});
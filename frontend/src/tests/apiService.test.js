import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiService } from '../services/api';

// Mock fetch for testing
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('ApiService', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    
    // Reset online status
    navigator.onLine = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Online API requests', () => {
    it('should make successful GET request to folders endpoint', async () => {
      const mockFolders = [
        { id: 1, name: 'Test Folder', icon: '📁', subfolders: [] }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFolders
      });

      const folders = await apiService.getFolders();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/folders',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(folders).toEqual(mockFolders);
    });

    it('should make successful POST request to create folder', async () => {
      const newFolder = { name: 'New Folder', icon: '📁', parent_id: null };
      const mockResponse = { id: 1, ...newFolder, created_at: '2023-01-01' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const folder = await apiService.createFolder(newFolder);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/folders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newFolder)
        })
      );
      expect(folder).toEqual(mockResponse);
    });

    it('should make successful PUT request to update folder', async () => {
      const updateData = { name: 'Updated Folder' };
      const mockResponse = { id: 1, ...updateData, icon: '📁' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const folder = await apiService.updateFolder(1, updateData);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/folders/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
      expect(folder).toEqual(mockResponse);
    });

    it('should make successful DELETE request to delete folder', async () => {
      const mockResponse = { message: 'Folder deleted successfully' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiService.deleteFolder(1);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/folders/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Mock offline data
      localStorageMock.getItem.mockReturnValue(JSON.stringify([
        { id: 1, name: 'Offline Folder', icon: '📁', subfolders: [] }
      ]));

      const folders = await apiService.getFolders();
      
      expect(folders).toEqual([
        { id: 1, name: 'Offline Folder', icon: '📁', subfolders: [] }
      ]);
    });
  });

  describe('Offline functionality', () => {
    beforeEach(() => {
      navigator.onLine = false;
    });

    it('should return offline folders when offline', async () => {
      const offlineFolders = [
        { id: 1, name: 'Offline Folder', icon: '📁', subfolders: [] }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(offlineFolders));

      const folders = await apiService.getFolders();
      
      expect(fetch).not.toHaveBeenCalled();
      expect(folders).toEqual(offlineFolders);
    });

    it('should create folder offline and mark for sync', async () => {
      const newFolder = { name: 'Offline Folder', icon: '📁' };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      const folder = await apiService.createFolder(newFolder);
      
      expect(fetch).not.toHaveBeenCalled();
      expect(folder).toMatchObject(newFolder);
      expect(folder.id).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_folders',
        expect.stringContaining(newFolder.name)
      );
    });

    it('should return default folders when no offline data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const folders = await apiService.getFolders();
      
      expect(folders).toEqual([
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
  });

  describe('Notes API', () => {
    it('should get notes successfully', async () => {
      const mockNotes = [
        { id: 1, title: 'Test Note', content: 'Content', folder_id: null }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotes
      });

      const notes = await apiService.getNotes();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes',
        expect.any(Object)
      );
      expect(notes).toEqual(mockNotes);
    });

    it('should get notes by folder', async () => {
      const mockNotes = [
        { id: 1, title: 'Folder Note', content: 'Content', folder_id: 1 }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotes
      });

      const notes = await apiService.getNotes(1);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes?folder_id=1',
        expect.any(Object)
      );
      expect(notes).toEqual(mockNotes);
    });

    it('should create note successfully', async () => {
      const newNote = { title: 'New Note', content: 'Content' };
      const mockResponse = { id: 1, ...newNote, created_at: '2023-01-01' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const note = await apiService.createNote(newNote);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newNote)
        })
      );
      expect(note).toEqual(mockResponse);
    });

    it('should update note successfully', async () => {
      const updateData = { title: 'Updated Note' };
      const mockResponse = { id: 1, ...updateData, content: 'Content' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const note = await apiService.updateNote(1, updateData);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
      expect(note).toEqual(mockResponse);
    });

    it('should delete note successfully', async () => {
      const mockResponse = { message: 'Note deleted successfully' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiService.deleteNote(1);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Sync functionality', () => {
    it('should mark items for sync when offline', async () => {
      navigator.onLine = false;
      const newNote = { title: 'Offline Note', content: 'Content' };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      await apiService.createNote(newNote);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mynotes_sync_queue',
        expect.stringContaining('create')
      );
    });

    it('should sync offline data when coming online', async () => {
      const syncQueue = [
        {
          type: 'note',
          action: 'create',
          data: { title: 'Offline Note', content: 'Content' },
          timestamp: '2023-01-01'
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
          method: 'POST'
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(apiService.request('/nonexistent')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.request('/test')).rejects.toThrow('Network error');
    });
  });
});
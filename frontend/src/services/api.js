const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupOnlineListeners();
  }

  setupOnlineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Folders API
  async getFolders() {
    if (!this.isOnline) {
      return this.getOfflineFolders();
    }
    
    try {
      const folders = await this.request('/folders');
      this.saveOfflineFolders(folders);
      return folders;
    } catch (error) {
      return this.getOfflineFolders();
    }
  }

  async createFolder(folderData) {
    if (!this.isOnline) {
      return this.createOfflineFolder(folderData);
    }

    try {
      const folder = await this.request('/folders', {
        method: 'POST',
        body: JSON.stringify(folderData)
      });
      this.updateOfflineFolder(folder);
      return folder;
    } catch (error) {
      return this.createOfflineFolder(folderData);
    }
  }

  async updateFolder(folderId, folderData) {
    if (!this.isOnline) {
      return this.updateOfflineFolder({ id: folderId, ...folderData });
    }

    try {
      const folder = await this.request(`/folders/${folderId}`, {
        method: 'PUT',
        body: JSON.stringify(folderData)
      });
      this.updateOfflineFolder(folder);
      return folder;
    } catch (error) {
      return this.updateOfflineFolder({ id: folderId, ...folderData });
    }
  }

  async deleteFolder(folderId) {
    if (!this.isOnline) {
      return this.deleteOfflineFolder(folderId);
    }

    try {
      const result = await this.request(`/folders/${folderId}`, {
        method: 'DELETE'
      });
      this.deleteOfflineFolder(folderId);
      return result;
    } catch (error) {
      return this.deleteOfflineFolder(folderId);
    }
  }

  // Notes API
  async getNotes(folderId = null) {
    if (!this.isOnline) {
      return this.getOfflineNotes(folderId);
    }

    try {
      const endpoint = folderId ? `/notes?folder_id=${folderId}` : '/notes';
      const notes = await this.request(endpoint);
      this.saveOfflineNotes(notes);
      return notes;
    } catch (error) {
      return this.getOfflineNotes(folderId);
    }
  }

  async createNote(noteData) {
    if (!this.isOnline) {
      return this.createOfflineNote(noteData);
    }

    try {
      const note = await this.request('/notes', {
        method: 'POST',
        body: JSON.stringify(noteData)
      });
      this.updateOfflineNote(note);
      return note;
    } catch (error) {
      return this.createOfflineNote(noteData);
    }
  }

  async updateNote(noteId, noteData) {
    if (!this.isOnline) {
      return this.updateOfflineNote({ id: noteId, ...noteData });
    }

    try {
      const note = await this.request(`/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify(noteData)
      });
      this.updateOfflineNote(note);
      return note;
    } catch (error) {
      return this.updateOfflineNote({ id: noteId, ...noteData });
    }
  }

  async deleteNote(noteId) {
    if (!this.isOnline) {
      return this.deleteOfflineNote(noteId);
    }

    try {
      const result = await this.request(`/notes/${noteId}`, {
        method: 'DELETE'
      });
      this.deleteOfflineNote(noteId);
      return result;
    } catch (error) {
      return this.deleteOfflineNote(noteId);
    }
  }

  // Offline storage methods
  getOfflineFolders() {
    const folders = localStorage.getItem('mynotes_folders');
    return folders ? JSON.parse(folders) : [
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
    ];
  }

  saveOfflineFolders(folders) {
    localStorage.setItem('mynotes_folders', JSON.stringify(folders));
  }

  createOfflineFolder(folderData) {
    const folders = this.getOfflineFolders();
    const newFolder = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subfolders: [],
      ...folderData
    };
    
    folders.push(newFolder);
    this.saveOfflineFolders(folders);
    this.markForSync('folder', 'create', newFolder);
    return newFolder;
  }

  updateOfflineFolder(folderData) {
    const folders = this.getOfflineFolders();
    const index = folders.findIndex(f => f.id === folderData.id);
    if (index !== -1) {
      folders[index] = { ...folders[index], ...folderData, updated_at: new Date().toISOString() };
      this.saveOfflineFolders(folders);
      this.markForSync('folder', 'update', folders[index]);
    }
    return folderData;
  }

  deleteOfflineFolder(folderId) {
    const folders = this.getOfflineFolders();
    const filteredFolders = folders.filter(f => f.id !== folderId);
    this.saveOfflineFolders(filteredFolders);
    this.markForSync('folder', 'delete', { id: folderId });
    return { message: 'Folder deleted successfully' };
  }

  getOfflineNotes(folderId = null) {
    const notes = localStorage.getItem('mynotes_notes');
    const allNotes = notes ? JSON.parse(notes) : [];
    return folderId ? allNotes.filter(note => note.folder_id === folderId) : allNotes;
  }

  saveOfflineNotes(notes) {
    localStorage.setItem('mynotes_notes', JSON.stringify(notes));
  }

  createOfflineNote(noteData) {
    const notes = this.getOfflineNotes();
    const newNote = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      title: 'Unbenannt',
      content: '',
      ...noteData
    };
    
    notes.push(newNote);
    this.saveOfflineNotes(notes);
    this.markForSync('note', 'create', newNote);
    return newNote;
  }

  updateOfflineNote(noteData) {
    const notes = this.getOfflineNotes();
    const index = notes.findIndex(n => n.id === noteData.id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...noteData, updated_at: new Date().toISOString() };
      this.saveOfflineNotes(notes);
      this.markForSync('note', 'update', notes[index]);
    }
    return noteData;
  }

  deleteOfflineNote(noteId) {
    const notes = this.getOfflineNotes();
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      notes[index].is_deleted = true;
      notes[index].updated_at = new Date().toISOString();
      this.saveOfflineNotes(notes);
      this.markForSync('note', 'delete', notes[index]);
    }
    return { message: 'Note deleted successfully' };
  }

  // Sync functionality
  markForSync(type, action, data) {
    const syncQueue = JSON.parse(localStorage.getItem('mynotes_sync_queue') || '[]');
    syncQueue.push({
      type,
      action,
      data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('mynotes_sync_queue', JSON.stringify(syncQueue));
  }

  async syncOfflineData() {
    if (!this.isOnline) return;

    const syncQueue = JSON.parse(localStorage.getItem('mynotes_sync_queue') || '[]');
    const syncedItems = [];

    for (const item of syncQueue) {
      try {
        if (item.type === 'note') {
          switch (item.action) {
            case 'create':
              await this.request('/notes', {
                method: 'POST',
                body: JSON.stringify(item.data)
              });
              break;
            case 'update':
              await this.request(`/notes/${item.data.id}`, {
                method: 'PUT',
                body: JSON.stringify(item.data)
              });
              break;
            case 'delete':
              await this.request(`/notes/${item.data.id}`, {
                method: 'DELETE'
              });
              break;
          }
        } else if (item.type === 'folder') {
          switch (item.action) {
            case 'create':
              await this.request('/folders', {
                method: 'POST',
                body: JSON.stringify(item.data)
              });
              break;
            case 'update':
              await this.request(`/folders/${item.data.id}`, {
                method: 'PUT',
                body: JSON.stringify(item.data)
              });
              break;
            case 'delete':
              await this.request(`/folders/${item.data.id}`, {
                method: 'DELETE'
              });
              break;
          }
        }
        syncedItems.push(item);
      } catch (error) {
        console.error('Sync failed for item:', item, error);
      }
    }

    // Remove synced items from queue
    const remainingQueue = syncQueue.filter(item => !syncedItems.includes(item));
    localStorage.setItem('mynotes_sync_queue', JSON.stringify(remainingQueue));
  }
}

export const apiService = new ApiService();
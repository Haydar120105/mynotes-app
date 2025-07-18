import { useState, useEffect } from 'react';
import FolderItem from './FolderItem';
import { apiService } from '../services/api';

const Sidebar = ({ isOpen, onSelectFolder, selectedFolderId, toggleSidebar }) => {
  const [isCreatingMainFolder, setIsCreatingMainFolder] = useState(false);
  const [newMainFolderName, setNewMainFolderName] = useState('');
  const [folders, setFolders] = useState([]);

  const handleCreateMainFolder = async () => {
    if (newMainFolderName.trim()) {
      try {
        const newFolder = await apiService.createFolder({
          name: newMainFolderName,
          icon: '📁',
          parent_id: null
        });
        setFolders([...folders, newFolder]);
        setNewMainFolderName('');
        setIsCreatingMainFolder(false);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };

  const handleMainFolderKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateMainFolder();
    } else if (e.key === 'Escape') {
      setIsCreatingMainFolder(false);
      setNewMainFolderName('');
    }
  };

  const handleDeleteMainFolder = async (folderId) => {
    try {
      await apiService.deleteFolder(folderId);
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  // Load folders on component mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const loadedFolders = await apiService.getFolders();
        setFolders(loadedFolders);
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    loadFolders();
  }, []);

  return (
    // Sidebar Container - Links positioniert, 256px breit
    <div className={`bg-gray-800 text-white w-64 p-4 space-y-6 ${isOpen ? 'block' : 'hidden'} fixed md:relative z-10 h-full md:h-auto overflow-y-auto`}>
      
      {/* Sidebar Header: App-Titel + Zuklappen-Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📝 Notizen</h2>
        {/* Sidebar zuklappen Button (kleiner Pfeil) */}
        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* Ordner-Verwaltung Sektion */}
      <div>
        {/* Ordner-Sektion Header mit Titel + Neuer Ordner Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-lg">📁 Ordner</div>
          {/* Neuen Hauptordner erstellen Button */}
          <button
            onClick={() => setIsCreatingMainFolder(true)}
            className="p-1 rounded hover:bg-gray-700 transition"
            title="Neuen Ordner erstellen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        
        {/* Ordner-Liste */}
        <div className="space-y-1">
          {/* Iteration über alle Hauptordner */}
          {folders.map(folder => (
            <div key={folder.id} className="group">
              {/* Einzelner Ordner mit FolderItem Komponente */}
              <FolderItem 
                folder={folder} 
                onUpdateFolder={(updatedFolder) => {
                  setFolders(folders.map(f => 
                    f.id === updatedFolder.id ? updatedFolder : f
                  ));
                }}
                onDeleteFolder={() => handleDeleteMainFolder(folder.id)}
                onSelectFolder={onSelectFolder}
                selectedFolderId={selectedFolderId}
              />
            </div>
          ))}
          
          {/* Eingabefeld für neuen Hauptordner */}
          {isCreatingMainFolder && (
            <div className="flex items-center space-x-1 py-1 px-2">
              <span className="w-3 h-3 block"></span> {/* Platzhalter für Einrückung */}
              <input
                type="text"
                value={newMainFolderName}
                onChange={(e) => setNewMainFolderName(e.target.value)}
                onKeyDown={handleMainFolderKeyPress}
                onBlur={handleCreateMainFolder}
                placeholder="Ordnername..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
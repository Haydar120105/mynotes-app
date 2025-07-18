import { useState } from 'react';

const FolderItem = ({ folder, level = 0, onUpdateFolder, onDeleteFolder, onSelectFolder, selectedFolderId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCreateSubfolder = () => {
    if (newSubfolderName.trim()) {
      const newSubfolder = {
        id: Date.now(),
        name: newSubfolderName,
        icon: '📁',
        subfolders: []
      };
      const updatedFolder = {
        ...folder,
        subfolders: [...folder.subfolders, newSubfolder]
      };
      onUpdateFolder(updatedFolder);
      setNewSubfolderName('');
      setIsCreating(false);
    }
  };

  const handleDeleteFolder = () => {
    if (showDeleteConfirm) {
      onDeleteFolder(folder.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleDeleteSubfolder = (subfolderIdToDelete) => {
    const updatedFolder = {
      ...folder,
      subfolders: folder.subfolders.filter(sf => sf.id !== subfolderIdToDelete)
    };
    onUpdateFolder(updatedFolder);
  };

  const handleFolderClick = () => {
    onSelectFolder(folder);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateSubfolder();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewSubfolderName('');
    }
  };

  const isSelected = selectedFolderId === folder.id;
  
  return (
    // Haupt-Container für einen einzelnen Ordner
    <div className="mb-1">
      {/* Ordner-Zeile: Enthält Expand-Button, Ordnername und Aktions-Buttons */}
      <div className={`flex items-center justify-between py-1 px-2 rounded transition ${level > 0 ? 'ml-3' : ''} ${
        showDeleteConfirm ? 'bg-red-900 hover:bg-red-800' : 
        isSelected ? 'bg-blue-700 hover:bg-blue-600' : 'hover:bg-gray-700'
      }`}>
        {/* Linke Seite: Expand-Button + Ordnername */}
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          {/* Expand/Collapse Button (Pfeil) */}
          <button
            onClick={toggleExpanded}
            className="p-0.5 rounded hover:bg-gray-600 transition flex-shrink-0"
          >
            {folder.subfolders.length > 0 ? (
              <svg 
                className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <span className="w-3 h-3 block"></span>
            )}
          </button>
          
          {/* Ordnername mit Icon */}
          <span 
            onClick={handleFolderClick}
            className={`cursor-pointer flex-1 transition truncate text-sm ${
              showDeleteConfirm ? 'text-red-300' : 
              isSelected ? 'text-white font-medium' : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="inline-flex items-center">
              <span className="text-base mr-1">{folder.icon}</span>
              <span className="truncate">{folder.name}</span>
            </span>
            {showDeleteConfirm && <span className="ml-2 text-xs text-red-400 whitespace-nowrap">Klicken zum Bestätigen</span>}
          </span>
        </div>
        
        {/* Rechte Seite: Aktions-Buttons (Erstellen + Löschen) */}
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {/* Neuen Unterordner erstellen Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="p-0.5 rounded hover:bg-gray-600 transition"
            title="Neuen Unterordner erstellen"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          {/* Ordner löschen Button */}
          {onDeleteFolder && (
            <button
              onClick={handleDeleteFolder}
              className={`p-0.5 rounded transition ${showDeleteConfirm ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-600'}`}
              title={showDeleteConfirm ? "Bestätigen zum Löschen" : "Ordner löschen"}
            >
              {showDeleteConfirm ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Unterordner-Bereich: Wird nur angezeigt wenn Ordner erweitert ist */}
      {isExpanded && (
        <div className="ml-4">
          {/* Rekursive Darstellung aller Unterordner */}
          {folder.subfolders.map(subfolder => (
            <FolderItem 
              key={subfolder.id} 
              folder={subfolder} 
              level={level + 1} 
              onUpdateFolder={(updatedSubfolder) => {
                const updatedFolder = {
                  ...folder,
                  subfolders: folder.subfolders.map(sf => 
                    sf.id === updatedSubfolder.id ? updatedSubfolder : sf
                  )
                };
                onUpdateFolder(updatedFolder);
              }}
              onDeleteFolder={() => handleDeleteSubfolder(subfolder.id)}
              onSelectFolder={onSelectFolder}
              selectedFolderId={selectedFolderId}
            />
          ))}
          
          {/* Eingabefeld für neuen Unterordner */}
          {isCreating && (
            <div className="flex items-center space-x-1 py-1 px-2">
              <span className="w-3 h-3 block"></span> {/* Platzhalter für Einrückung */}
              <input
                type="text"
                value={newSubfolderName}
                onChange={(e) => setNewSubfolderName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleCreateSubfolder}
                placeholder="Ordnername..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderItem;
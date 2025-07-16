import { useState, useRef, useEffect } from 'react';

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
      setTimeout(() => setShowDeleteConfirm(false), 3000); // Auto-hide after 3 seconds
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
    <div className="mb-1">
      <div className={`flex items-center justify-between py-1 px-2 rounded transition ${level > 0 ? 'ml-3' : ''} ${
        showDeleteConfirm ? 'bg-red-900 hover:bg-red-800' : 
        isSelected ? 'bg-blue-700 hover:bg-blue-600' : 'hover:bg-gray-700'
      }`}>
        <div className="flex items-center space-x-1 flex-1 min-w-0">
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
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => setIsCreating(true)}
            className="p-0.5 rounded hover:bg-gray-600 transition"
            title="Neuen Unterordner erstellen"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
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
      
      {isExpanded && (
        <div className="ml-4">
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
          
          {isCreating && (
            <div className="flex items-center space-x-1 py-1 px-2">
              <span className="w-3 h-3 block"></span>
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

const Sidebar = ({ isOpen, toggleSidebar, onSelectFolder, selectedFolderId }) => {
  const [isCreatingMainFolder, setIsCreatingMainFolder] = useState(false);
  const [newMainFolderName, setNewMainFolderName] = useState('');
  const [folders, setFolders] = useState([
    {
      id: 1,
      name: 'Persönlich',
      icon: '👤',
      subfolders: [
        {
          id: 11,
          name: 'Tagebuch',
          icon: '📖',
          subfolders: []
        },
        {
          id: 12,
          name: 'Ideen',
          icon: '💡',
          subfolders: []
        }
      ]
    },
    {
      id: 2,
      name: 'Arbeit',
      icon: '💼',
      subfolders: [
        {
          id: 21,
          name: 'Meetings',
          icon: '🤝',
          subfolders: []
        },
        {
          id: 22,
          name: 'Projekte',
          icon: '📊',
          subfolders: [
            {
              id: 221,
              name: 'Website',
              icon: '🌐',
              subfolders: []
            }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Projekte',
      icon: '🚀',
      subfolders: []
    }
  ]);

  const handleCreateMainFolder = () => {
    if (newMainFolderName.trim()) {
      const newFolder = {
        id: Date.now(),
        name: newMainFolderName,
        icon: '📁',
        subfolders: []
      };
      setFolders([...folders, newFolder]);
      setNewMainFolderName('');
      setIsCreatingMainFolder(false);
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

  const handleDeleteMainFolder = (folderId) => {
    setFolders(folders.filter(f => f.id !== folderId));
  };

  return (
    <div className={`bg-gray-800 text-white w-64 p-4 space-y-6 ${isOpen ? 'block' : 'hidden'} md:block fixed md:relative z-10 h-full md:h-auto overflow-y-auto`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📝 Notizen</h2>
        <button onClick={toggleSidebar} className="md:hidden p-1 rounded hover:bg-gray-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-lg">📁 Ordner</div>
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
        <div className="space-y-1">
          {folders.map(folder => (
            <div key={folder.id} className="group">
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
          
          {isCreatingMainFolder && (
            <div className="flex items-center space-x-1 py-1 px-2">
              <span className="w-3 h-3 block"></span>
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

const TextFormatToolbar = ({ onFormat, onClose, hasSelection, activeFormats }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  
  const colors = [
    { name: 'Default', value: 'text-gray-100', bg: 'bg-gray-100' },
    { name: 'Gray', value: 'text-gray-400', bg: 'bg-gray-400' },
    { name: 'Brown', value: 'text-amber-700', bg: 'bg-amber-700' },
    { name: 'Red', value: 'text-red-400', bg: 'bg-red-400' },
    { name: 'Orange', value: 'text-orange-400', bg: 'bg-orange-400' },
    { name: 'Yellow', value: 'text-yellow-400', bg: 'bg-yellow-400' },
    { name: 'Green', value: 'text-green-400', bg: 'bg-green-400' },
    { name: 'Blue', value: 'text-blue-400', bg: 'bg-blue-400' },
    { name: 'Purple', value: 'text-purple-400', bg: 'bg-purple-400' },
    { name: 'Pink', value: 'text-pink-400', bg: 'bg-pink-400' },
  ];

  const backgrounds = [
    { name: 'Default', value: 'bg-transparent', bg: 'bg-transparent border-2 border-gray-600' },
    { name: 'Gray', value: 'bg-gray-700', bg: 'bg-gray-700' },
    { name: 'Brown', value: 'bg-amber-900', bg: 'bg-amber-900' },
    { name: 'Red', value: 'bg-red-900', bg: 'bg-red-900' },
    { name: 'Orange', value: 'bg-orange-900', bg: 'bg-orange-900' },
    { name: 'Yellow', value: 'bg-yellow-900', bg: 'bg-yellow-900' },
    { name: 'Green', value: 'bg-green-900', bg: 'bg-green-900' },
    { name: 'Blue', value: 'bg-blue-900', bg: 'bg-blue-900' },
    { name: 'Purple', value: 'bg-purple-900', bg: 'bg-purple-900' },
    { name: 'Pink', value: 'bg-pink-900', bg: 'bg-pink-900' },
  ];

  return (
    <div 
      className="text-format-toolbar fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-1 flex flex-col space-y-1 text-gray-800"
      style={{ 
        right: '20px', 
        top: '50%',
        transform: 'translateY(-50%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        minWidth: '50px'
      }}
    >
      {/* Bold */}
      <button
        onClick={() => hasSelection && onFormat('bold')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          !hasSelection 
            ? 'text-gray-400 cursor-not-allowed' 
            : activeFormats.has('bold')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Fett (Cmd+B)"
        disabled={!hasSelection}
      >
        <span className="font-bold text-sm">B</span>
      </button>
      
      {/* Italic */}
      <button
        onClick={() => hasSelection && onFormat('italic')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          !hasSelection 
            ? 'text-gray-400 cursor-not-allowed' 
            : activeFormats.has('italic')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Kursiv (Cmd+I)"
        disabled={!hasSelection}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.5 2a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1L6.5 13h1a.5.5 0 010 1h-3a.5.5 0 010-1h1L6 4h-1a.5.5 0 01-.5-.5v-1A.5.5 0 015 2h3.5z"/>
        </svg>
      </button>
      
      {/* Underline */}
      <button
        onClick={() => hasSelection && onFormat('underline')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          !hasSelection 
            ? 'text-gray-400 cursor-not-allowed' 
            : activeFormats.has('underline')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Unterstrichen (Cmd+U)"
        disabled={!hasSelection}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 18h14v1H3v-1zm2-16h2v8.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V2h2v8.5c0 2.48-2.02 4.5-4.5 4.5S5 12.98 5 10.5V2z"/>
        </svg>
      </button>
      
      {/* Strikethrough */}
      <button
        onClick={() => hasSelection && onFormat('strikethrough')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          !hasSelection 
            ? 'text-gray-400 cursor-not-allowed' 
            : activeFormats.has('strikethrough')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Durchgestrichen (Cmd+Shift+S)"
        disabled={!hasSelection}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10h16v1H2v-1zm6-4h4v2h-4V6zm0 6h4v2h-4v-2z"/>
        </svg>
      </button>
      
      {/* Code */}
      <button
        onClick={() => hasSelection && onFormat('code')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          !hasSelection 
            ? 'text-gray-400 cursor-not-allowed' 
            : activeFormats.has('code')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Code (Cmd+E)"
        disabled={!hasSelection}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
        </svg>
      </button>
      
      <div className="h-px w-6 bg-gray-300 my-1"></div>
      
      {/* Text Color */}
      <div className="relative">
        <button 
          onClick={() => hasSelection && setShowColorPicker(!showColorPicker)}
          className={`p-2 rounded transition-colors flex items-center justify-center ${
            hasSelection 
              ? 'hover:bg-gray-100 text-gray-700 cursor-pointer' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
          title="Textfarbe"
          disabled={!hasSelection}
        >
          <span className="text-xs mr-1">A</span>
          <div className="w-3 h-0.5 bg-red-500"></div>
          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </button>
        {showColorPicker && hasSelection && (
          <div className="absolute top-0 right-full mr-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-60 min-w-40">
            <div className="text-xs text-gray-500 px-3 py-1 font-medium">Textfarbe</div>
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  onFormat('color', color.value);
                  setShowColorPicker(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                title={color.name}
              >
                <div className={`w-4 h-4 rounded ${color.bg}`}></div>
                <span className="text-sm text-gray-700">{color.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Background Color */}
      <div className="relative">
        <button 
          onClick={() => hasSelection && setShowBackgroundPicker(!showBackgroundPicker)}
          className={`p-2 rounded transition-colors flex items-center justify-center ${
            hasSelection 
              ? 'hover:bg-gray-100 text-gray-700 cursor-pointer' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
          title="Hintergrundfarbe"
          disabled={!hasSelection}
        >
          <div className="w-4 h-4 bg-yellow-300 rounded-sm"></div>
          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </button>
        {showBackgroundPicker && hasSelection && (
          <div className="absolute top-0 right-full mr-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-60 min-w-40">
            <div className="text-xs text-gray-500 px-3 py-1 font-medium">Hintergrundfarbe</div>
            {backgrounds.map((bg) => (
              <button
                key={bg.name}
                onClick={() => {
                  onFormat('background', bg.value);
                  setShowBackgroundPicker(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                title={bg.name}
              >
                <div className={`w-4 h-4 rounded ${bg.bg === 'bg-transparent border-2 border-gray-600' ? 'border-2 border-gray-300' : bg.bg}`}></div>
                <span className="text-sm text-gray-700">{bg.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="h-px w-6 bg-gray-300 my-1"></div>
      
      {/* Link */}
      <button
        onClick={() => hasSelection && onFormat('link')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          hasSelection 
            ? 'hover:bg-gray-100 text-gray-700 cursor-pointer' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title="Link (Cmd+K)"
        disabled={!hasSelection}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
        </svg>
      </button>
      
      <div className="h-px w-6 bg-gray-300 my-1"></div>
      
      {/* More options */}
      <button
        onClick={() => hasSelection && onFormat('more')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          hasSelection 
            ? 'hover:bg-gray-100 text-gray-700 cursor-pointer' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title="Mehr Optionen"
        disabled={!hasSelection}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
    </div>
  );
};

const MainContent = ({ toggleSidebar, selectedFolder }) => {
  const [currentNote, setCurrentNote] = useState({
    id: null,
    title: '',
    content: '',
    folderId: selectedFolder?.id || null,
    updatedAt: new Date().toISOString()
  });
  
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [activeFormats, setActiveFormats] = useState(new Set());
  const contentRef = useRef(null);

  const handleTitleChange = (e) => {
    setCurrentNote(prev => ({
      ...prev,
      title: e.target.value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleContentChange = (e) => {
    setCurrentNote(prev => ({
      ...prev,
      content: e.target.value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    setSelectedText(text);
    setHasSelection(text.length > 0);
    
    // Check current formatting state
    if (text.length > 0 && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
      
      const formats = new Set();
      
      // Check for formatting in parent elements
      let current = element;
      while (current && current !== contentRef.current) {
        const style = window.getComputedStyle(current);
        
        if (style.fontWeight === 'bold' || style.fontWeight === '700') formats.add('bold');
        if (style.fontStyle === 'italic') formats.add('italic');
        if (style.textDecoration.includes('underline')) formats.add('underline');
        if (style.textDecoration.includes('line-through')) formats.add('strikethrough');
        if (current.classList.contains('bg-gray-800')) formats.add('code');
        
        current = current.parentElement;
      }
      
      setActiveFormats(formats);
    } else {
      setActiveFormats(new Set());
    }
  };

  const handleFormat = (format, value) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Check if format is already active and should be toggled off
      const isActive = activeFormats.has(format);
      
      if (isActive && format !== 'color' && format !== 'background') {
        // Remove formatting by using execCommand
        switch (format) {
          case 'bold':
            document.execCommand('bold', false, null);
            break;
          case 'italic':
            document.execCommand('italic', false, null);
            break;
          case 'underline':
            document.execCommand('underline', false, null);
            break;
          case 'strikethrough':
            document.execCommand('strikeThrough', false, null);
            break;
          case 'code':
            // For code, we need to remove the wrapper span
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
            if (element && element.classList.contains('bg-gray-800')) {
              const parent = element.parentElement;
              while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
              }
              parent.removeChild(element);
            }
            break;
        }
      } else {
        // Apply formatting
        const span = document.createElement('span');
        
        switch (format) {
          case 'bold':
            span.style.fontWeight = 'bold';
            break;
          case 'italic':
            span.style.fontStyle = 'italic';
            break;
          case 'underline':
            span.style.textDecoration = 'underline';
            break;
          case 'strikethrough':
            span.style.textDecoration = 'line-through';
            break;
          case 'code':
            span.className = 'bg-gray-800 text-red-400 px-1 py-0.5 rounded text-sm font-mono';
            break;
          case 'color':
            span.className = value;
            break;
          case 'background':
            span.className = `${value} px-1 py-0.5 rounded`;
            break;
          case 'link':
            const url = prompt('URL eingeben:');
            if (url) {
              const link = document.createElement('a');
              link.href = url;
              link.className = 'text-blue-400 underline hover:text-blue-300';
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              try {
                range.surroundContents(link);
              } catch (e) {
                const contents = range.extractContents();
                link.appendChild(contents);
                range.insertNode(link);
              }
              return;
            }
            break;
        }
        
        if (format !== 'link') {
          try {
            range.surroundContents(span);
          } catch (e) {
            // If range contains multiple elements, extract and wrap
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
          }
        }
      }
    }
    
    // Update selection state after formatting
    setTimeout(() => {
      handleTextSelection();
    }, 100);
  };

  useEffect(() => {
    const handleClick = (e) => {
      // If clicking outside the toolbar and not on the content editable area
      if (!e.target.closest('.text-format-toolbar') && !e.target.closest('[contenteditable]')) {
        setShowToolbar(false);
      }
    };
    
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      setHasSelection(text.length > 0);
    };
    
    document.addEventListener('click', handleClick);
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  return (
    <div className="flex-1 bg-gray-900 text-white md:ml-0 min-h-screen">
      {/* Text formatting toolbar - always visible */}
      <TextFormatToolbar
        onFormat={handleFormat}
        onClose={() => setHasSelection(false)}
        hasSelection={hasSelection}
        activeFormats={activeFormats}
      />
      
      <button onClick={toggleSidebar} className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-16">
        {/* Notion-style page header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-400 mb-2">
            {selectedFolder && (
              <span className="flex items-center">
                <span className="mr-1">{selectedFolder.icon}</span>
                <span>{selectedFolder.name}</span>
              </span>
            )}
          </div>
          
          {/* Title input - looks like Notion */}
          <input
            type="text"
            value={currentNote.title}
            onChange={handleTitleChange}
            placeholder="Unbenannt"
            className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-bold text-white placeholder-gray-600 py-2 resize-none"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          />
        </div>

        {/* Content area - infinite like Notion */}
        <div className="min-h-screen">
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={(e) => {
              setCurrentNote(prev => ({
                ...prev,
                content: e.target.innerHTML,
                updatedAt: new Date().toISOString()
              }));
            }}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            className="w-full bg-transparent border-none outline-none text-base md:text-lg text-gray-100 resize-none leading-relaxed content-editable-placeholder"
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              minHeight: '60vh',
              lineHeight: '1.6'
            }}
            data-placeholder="Schreibe etwas..."
          />
          
        </div>

        {/* Footer with last updated info */}
        {(currentNote.title || currentNote.content) && (
          <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-gray-800 px-3 py-2 rounded-lg">
            Zuletzt bearbeitet: {new Date(currentNote.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder);
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-5" 
          onClick={toggleSidebar}
        />
      )}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        onSelectFolder={handleSelectFolder}
        selectedFolderId={selectedFolder?.id}
      />
      <MainContent 
        toggleSidebar={toggleSidebar} 
        selectedFolder={selectedFolder}
      />
    </div>
  );
}

export default App;

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

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
        onSelectFolder={handleSelectFolder}
        selectedFolderId={selectedFolder?.id}
        toggleSidebar={toggleSidebar}
      />
      <MainContent 
        toggleSidebar={toggleSidebar} 
        selectedFolder={selectedFolder}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
}

export default App;
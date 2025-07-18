import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';

import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import TextFormatToolbar from '../components/TextFormatToolbar';
import FolderItem from '../components/FolderItem';

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    getFolders: vi.fn(),
    createFolder: vi.fn(),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
    getNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
  }
}));

describe('Sidebar Component', () => {
  const mockProps = {
    isOpen: true,
    onSelectFolder: vi.fn(),
    selectedFolderId: null,
    toggleSidebar: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with header', () => {
    render(<Sidebar {...mockProps} />);
    
    expect(screen.getByText('📝 Notizen')).toBeInTheDocument();
    expect(screen.getByText('📁 Ordner')).toBeInTheDocument();
  });

  it('renders toggle button', () => {
    render(<Sidebar {...mockProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('calls toggleSidebar when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...mockProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle/i });
    await user.click(toggleButton);
    
    expect(mockProps.toggleSidebar).toHaveBeenCalledOnce();
  });

  it('shows create folder input when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...mockProps} />);
    
    const addButton = screen.getByTitle('Neuen Ordner erstellen');
    await user.click(addButton);
    
    expect(screen.getByPlaceholderText('Ordnername...')).toBeInTheDocument();
  });

  it('hides sidebar when isOpen is false', () => {
    render(<Sidebar {...mockProps} isOpen={false} />);
    
    const sidebar = screen.getByText('📝 Notizen').closest('div');
    expect(sidebar).toHaveClass('hidden');
  });
});

describe('FolderItem Component', () => {
  const mockFolder = {
    id: 1,
    name: 'Test Folder',
    icon: '📁',
    subfolders: [
      { id: 11, name: 'Subfolder', icon: '📄', subfolders: [] }
    ]
  };

  const mockProps = {
    folder: mockFolder,
    onUpdateFolder: vi.fn(),
    onDeleteFolder: vi.fn(),
    onSelectFolder: vi.fn(),
    selectedFolderId: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders folder name and icon', () => {
    render(<FolderItem {...mockProps} />);
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('calls onSelectFolder when folder is clicked', async () => {
    const user = userEvent.setup();
    render(<FolderItem {...mockProps} />);
    
    const folderName = screen.getByText('Test Folder');
    await user.click(folderName);
    
    expect(mockProps.onSelectFolder).toHaveBeenCalledWith(mockFolder);
  });

  it('shows expand button when folder has subfolders', () => {
    render(<FolderItem {...mockProps} />);
    
    const expandButton = screen.getByRole('button', { name: /expand/i });
    expect(expandButton).toBeInTheDocument();
  });

  it('expands and shows subfolders when expand button is clicked', async () => {
    const user = userEvent.setup();
    render(<FolderItem {...mockProps} />);
    
    const expandButton = screen.getByRole('button', { name: /expand/i });
    await user.click(expandButton);
    
    expect(screen.getByText('Subfolder')).toBeInTheDocument();
  });

  it('highlights selected folder', () => {
    render(<FolderItem {...mockProps} selectedFolderId={1} />);
    
    const folderElement = screen.getByText('Test Folder').closest('div');
    expect(folderElement).toHaveClass('bg-blue-700');
  });

  it('shows action buttons on hover', () => {
    render(<FolderItem {...mockProps} />);
    
    const createButton = screen.getByTitle('Neuen Unterordner erstellen');
    expect(createButton).toBeInTheDocument();
    
    const deleteButton = screen.getByTitle('Ordner löschen');
    expect(deleteButton).toBeInTheDocument();
  });
});

describe('TextFormatToolbar Component', () => {
  const mockProps = {
    onFormat: vi.fn(),
    hasSelection: false,
    activeFormats: new Set(),
    pendingFormats: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all formatting buttons', () => {
    render(<TextFormatToolbar {...mockProps} />);
    
    expect(screen.getByTitle('Fett (Cmd+B)')).toBeInTheDocument();
    expect(screen.getByTitle('Kursiv (Cmd+I)')).toBeInTheDocument();
    expect(screen.getByTitle('Unterstrichen (Cmd+U)')).toBeInTheDocument();
    expect(screen.getByTitle('Code (Cmd+E)')).toBeInTheDocument();
    expect(screen.getByTitle('Textfarbe')).toBeInTheDocument();
    expect(screen.getByTitle('Hintergrundfarbe')).toBeInTheDocument();
  });

  it('calls onFormat when bold button is clicked', async () => {
    const user = userEvent.setup();
    render(<TextFormatToolbar {...mockProps} />);
    
    const boldButton = screen.getByTitle('Fett (Cmd+B)');
    await user.click(boldButton);
    
    expect(mockProps.onFormat).toHaveBeenCalledWith('bold');
  });

  it('highlights active formats', () => {
    const activeFormats = new Set(['bold', 'italic']);
    render(<TextFormatToolbar {...mockProps} activeFormats={activeFormats} />);
    
    const boldButton = screen.getByTitle('Fett (Cmd+B)');
    const italicButton = screen.getByTitle('Kursiv (Cmd+I)');
    
    expect(boldButton).toHaveClass('bg-blue-100');
    expect(italicButton).toHaveClass('bg-blue-100');
  });

  it('highlights pending formats', () => {
    const pendingFormats = ['underline'];
    render(<TextFormatToolbar {...mockProps} pendingFormats={pendingFormats} />);
    
    const underlineButton = screen.getByTitle('Unterstrichen (Cmd+U)');
    expect(underlineButton).toHaveClass('bg-blue-100');
  });

  it('shows color picker when color button is clicked', async () => {
    const user = userEvent.setup();
    render(<TextFormatToolbar {...mockProps} />);
    
    const colorButton = screen.getByTitle('Textfarbe');
    await user.click(colorButton);
    
    expect(screen.getByText('Textfarbe')).toBeInTheDocument();
  });

  it('shows background color picker when background button is clicked', async () => {
    const user = userEvent.setup();
    render(<TextFormatToolbar {...mockProps} />);
    
    const backgroundButton = screen.getByTitle('Hintergrundfarbe');
    await user.click(backgroundButton);
    
    expect(screen.getByText('Hintergrundfarbe')).toBeInTheDocument();
  });
});

describe('MainContent Component', () => {
  const mockProps = {
    toggleSidebar: vi.fn(),
    selectedFolder: null,
    isSidebarOpen: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main content area', () => {
    render(<MainContent {...mockProps} />);
    
    expect(screen.getByPlaceholderText('Unbenannt')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Schreibe etwas...')).toBeInTheDocument();
  });

  it('shows toggle button when sidebar is closed', () => {
    render(<MainContent {...mockProps} isSidebarOpen={false} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('hides toggle button when sidebar is open', () => {
    render(<MainContent {...mockProps} isSidebarOpen={true} />);
    
    const toggleButton = screen.queryByRole('button', { name: /toggle/i });
    expect(toggleButton).not.toBeInTheDocument();
  });

  it('renders TextFormatToolbar', () => {
    render(<MainContent {...mockProps} />);
    
    expect(screen.getByTitle('Fett (Cmd+B)')).toBeInTheDocument();
  });

  it('shows folder breadcrumb when folder is selected', () => {
    const selectedFolder = { id: 1, name: 'Test Folder', icon: '📁' };
    render(<MainContent {...mockProps} selectedFolder={selectedFolder} />);
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('updates note title when typing in title input', async () => {
    const user = userEvent.setup();
    render(<MainContent {...mockProps} />);
    
    const titleInput = screen.getByPlaceholderText('Unbenannt');
    await user.type(titleInput, 'New Note Title');
    
    expect(titleInput).toHaveValue('New Note Title');
  });

  it('shows last edited timestamp when note has content', () => {
    render(<MainContent {...mockProps} />);
    
    const titleInput = screen.getByPlaceholderText('Unbenannt');
    fireEvent.change(titleInput, { target: { value: 'Test Note' } });
    
    waitFor(() => {
      expect(screen.getByText(/Zuletzt bearbeitet:/)).toBeInTheDocument();
    });
  });
});

describe('Component Integration', () => {
  it('updates folder selection between Sidebar and MainContent', async () => {
    const user = userEvent.setup();
    const mockFolder = { id: 1, name: 'Test Folder', icon: '📁', subfolders: [] };
    
    let selectedFolder = null;
    const handleSelectFolder = (folder) => {
      selectedFolder = folder;
    };
    
    const { rerender } = render(
      <div>
        <Sidebar
          isOpen={true}
          onSelectFolder={handleSelectFolder}
          selectedFolderId={selectedFolder?.id}
          toggleSidebar={vi.fn()}
        />
        <MainContent
          toggleSidebar={vi.fn()}
          selectedFolder={selectedFolder}
          isSidebarOpen={true}
        />
      </div>
    );
    
    // Mock the folder selection by directly calling the handler
    handleSelectFolder(mockFolder);
    
    // Rerender with updated selectedFolder
    rerender(
      <div>
        <Sidebar
          isOpen={true}
          onSelectFolder={handleSelectFolder}
          selectedFolderId={mockFolder.id}
          toggleSidebar={vi.fn()}
        />
        <MainContent
          toggleSidebar={vi.fn()}
          selectedFolder={mockFolder}
          isSidebarOpen={true}
        />
      </div>
    );
    
    // Check that the folder appears in MainContent breadcrumb
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });
});
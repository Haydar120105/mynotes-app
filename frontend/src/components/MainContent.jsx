/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect, useCallback } from 'react';
import TextFormatToolbar from './TextFormatToolbar';
import { apiService } from '../services/api';

const getActiveFormatsFromSelection = (selection, contentRoot) => {
  const formats = new Set();
  const text = selection.toString().trim();
  if (!text || selection.rangeCount === 0) return formats;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;

  let current = element;
  while (current && current !== contentRoot) {
    const style = window.getComputedStyle(current);
    const classList = Array.from(current.classList);

    if (style.fontWeight === 'bold' || style.fontWeight === '700') formats.add('bold');
    if (style.fontStyle === 'italic') formats.add('italic');
    if (style.textDecoration.includes('underline')) formats.add('underline');
    if (style.textDecoration.includes('line-through')) formats.add('strikethrough');
    if (current.classList.contains('bg-gray-800')) formats.add('code');
    if (classList.some(cls => cls.startsWith('bg-') && !['bg-transparent', 'bg-gray-900'].includes(cls))) formats.add('background');
    if (classList.some(cls => cls.startsWith('text-') && !['text-white', 'text-gray-100'].includes(cls))) formats.add('color');

    current = current.parentElement;
  }

  return formats;
};

const MainContent = ({ toggleSidebar, selectedFolder, isSidebarOpen }) => {
  const [currentNote, setCurrentNote] = useState({
    id: null,
    title: '',
    content: '',
    folderId: selectedFolder?.id || null,
    updatedAt: new Date().toISOString()
  });
  
  const [hasSelection, setHasSelection] = useState(false);
  const [activeFormats, setActiveFormats] = useState(new Set());
  const [pendingFormats, setPendingFormats] = useState([]); // Formatierungen für nächsten Text
  const contentRef = useRef(null);
  const saveTimeout = useRef(null);

  const handleTitleChange = async (e) => {
    const newTitle = e.target.value;
    const updatedNote = {
      ...currentNote,
      title: newTitle,
      updatedAt: new Date().toISOString()
    };
    
    setCurrentNote(updatedNote);
    
    // Auto-save note after a delay
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    
    saveTimeout.current = setTimeout(async () => {
      try {
        if (currentNote.id) {
          await apiService.updateNote(currentNote.id, updatedNote);
        } else {
          const newNote = await apiService.createNote({
            title: newTitle,
            content: updatedNote.content,
            folder_id: updatedNote.folderId
          });
          setCurrentNote(newNote);
        }
      } catch (error) {
        console.error('Error saving note:', error);
      }
    }, 1000);
  };

 const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    setHasSelection(text.length > 0);
    setActiveFormats(getActiveFormatsFromSelection(selection, contentRef.current));
  };

  const handleInsertLink = (range) => {
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
      handleTextSelection();
    }
  };

  const handleFormat = (format, value) => {
    const selection = window.getSelection();
    
    // If no text is selected, toggle pending format for future typing
    if (!hasSelection || selection.rangeCount === 0) {
      setPendingFormats(prevPendingFormats => {
        let newPendingFormats = [...prevPendingFormats];
        
        // Handle color/background with values
        if (format === 'color' || format === 'background') {
          // Remove any existing color/background format
          newPendingFormats = newPendingFormats.filter(f => !f.startsWith(`${format}:`));
          // Add new format with value
          newPendingFormats.push(`${format}:${value}`);
        } else {
          // Handle simple formats (bold, italic, etc.)
          const formatIndex = newPendingFormats.indexOf(format);
          if (formatIndex > -1) {
            newPendingFormats.splice(formatIndex, 1);
          } else {
            newPendingFormats.push(format);
          }
        }
        return newPendingFormats;
      });
      
      return;
    }
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Check if format is already active and should be toggled off
      const isActive = activeFormats.has(format);
      
      if (isActive) {
        // Remove formatting by using execCommand
        switch (format) {
          case 'bold': {
            document.execCommand('bold', false, null);
            break;
          }
          case 'italic': {
            document.execCommand('italic', false, null);
            break;
          }
          case 'underline': {
            document.execCommand('underline', false, null);
            break;
          }
          case 'strikethrough': {
            document.execCommand('strikeThrough', false, null);
            break;
          }
          case 'code': {
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
          case 'color': {
            // Remove text color formatting
            const colorContainer = range.commonAncestorContainer;
            const colorElement = colorContainer.nodeType === Node.TEXT_NODE ? colorContainer.parentElement : colorContainer;
            let colorTargetElement = colorElement;
            
            // Find the element with text color class
            while (colorTargetElement && colorTargetElement !== contentRef.current) {
              const classList = Array.from(colorTargetElement.classList);
              if (classList.some(cls => cls.startsWith('text-') && cls !== 'text-white' && cls !== 'text-gray-100')) {
                const parent = colorTargetElement.parentElement;
                while (colorTargetElement.firstChild) {
                  parent.insertBefore(colorTargetElement.firstChild, colorTargetElement);
                }
                parent.removeChild(colorTargetElement);
                break;
              }
              colorTargetElement = colorTargetElement.parentElement;
            }
            break;
          }
          case 'background': {
            // Remove background color formatting
            const bgContainer = range.commonAncestorContainer;
            const bgElement = bgContainer.nodeType === Node.TEXT_NODE ? bgContainer.parentElement : bgContainer;
            let bgTargetElement = bgElement;
            
            // Find the element with background class
            while (bgTargetElement && bgTargetElement !== contentRef.current) {
              const classList = Array.from(bgTargetElement.classList);
              if (classList.some(cls => cls.startsWith('bg-') && cls !== 'bg-transparent' && cls !== 'bg-gray-900')) {
                const parent = bgTargetElement.parentElement;
                while (bgTargetElement.firstChild) {
                  parent.insertBefore(bgTargetElement.firstChild, bgTargetElement);
                }
                parent.removeChild(bgTargetElement);
                break;
              }
              bgTargetElement = bgTargetElement.parentElement;
            }
            break;
          }
        }
      } else {
        // Apply formatting
        const span = document.createElement('span');
        
        switch (format) {
          case 'bold': {
            span.style.fontWeight = 'bold';
            break;
          }
          case 'italic': {
            span.style.fontStyle = 'italic';
            break;
          }
          case 'underline': {
            span.style.textDecoration = 'underline';
            break;
          }
          case 'strikethrough': {
            span.style.textDecoration = 'line-through';
            break;
          }
          case 'code': {
            span.className = 'bg-gray-800 text-red-400 px-1 py-0.5 rounded text-sm font-mono';
            break;
          }
          case 'color': {
            // Remove all existing color formatting first
            const selectedContent = range.extractContents();
            
            // Function to remove all color spans from content
            const removeColorSpans = (node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node;
                const classList = Array.from(element.classList || []);
                
                // If this element has text color classes, unwrap it
                if (classList.some(cls => cls.startsWith('text-') && cls !== 'text-white' && cls !== 'text-gray-100')) {
                  const parent = element.parentNode;
                  if (parent) {
                    while (element.firstChild) {
                      parent.insertBefore(element.firstChild, element);
                    }
                    parent.removeChild(element);
                    return;
                  }
                }
                
                // Process children
                const children = Array.from(element.childNodes);
                children.forEach(child => removeColorSpans(child));
              }
            };
            
            // Create a temporary container to process the content
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(selectedContent);
            removeColorSpans(tempDiv);
            
            // Put the cleaned content back
            const cleanedContent = document.createDocumentFragment();
            while (tempDiv.firstChild) {
              cleanedContent.appendChild(tempDiv.firstChild);
            }
            
            // Apply new color if not default
            if (value !== 'text-gray-100') {
              span.className = value;
              span.appendChild(cleanedContent);
              range.insertNode(span);
            } else {
              range.insertNode(cleanedContent);
            }
            
            // Update selection state after formatting immediately
            handleTextSelection();
            return; // Don't use the normal span insertion logic
          }
          case 'background': {
            // Remove all existing background formatting first
            const bgSelectedContent = range.extractContents();
            
            // Function to remove all background spans from content
            const removeBackgroundSpans = (node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node;
                const classList = Array.from(element.classList || []);
                
                // If this element has background color classes, unwrap it
                if (classList.some(cls => cls.startsWith('bg-') && cls !== 'bg-transparent' && cls !== 'bg-gray-900')) {
                  const parent = element.parentNode;
                  if (parent) {
                    while (element.firstChild) {
                      parent.insertBefore(element.firstChild, element);
                    }
                    parent.removeChild(element);
                    return;
                  }
                }
                
                // Process children
                const children = Array.from(element.childNodes);
                children.forEach(child => removeBackgroundSpans(child));
              }
            };
            
            // Create a temporary container to process the content
            const bgTempDiv = document.createElement('div');
            bgTempDiv.appendChild(bgSelectedContent);
            removeBackgroundSpans(bgTempDiv);
            
            // Put the cleaned content back
            const bgCleanedContent = document.createDocumentFragment();
            while (bgTempDiv.firstChild) {
              bgCleanedContent.appendChild(bgTempDiv.firstChild);
            }
            
            // Apply new background if not transparent
            if (value !== 'bg-transparent') {
              span.className = `${value} px-1 py-0.5 rounded`;
              span.appendChild(bgCleanedContent);
              range.insertNode(span);
            } else {
              range.insertNode(bgCleanedContent);
            }
            
            // Update selection state after formatting immediately
            handleTextSelection();
            return; // Don't use the normal span insertion logic
          }
          case 'link': {
            handleInsertLink(range);
            return;
          }
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
    
    // Update selection state after formatting immediately
    handleTextSelection();
  };

  // Apply pending formats to typed text
  const applyPendingFormats = (text) => {
    if (pendingFormats.length === 0) return text;

    let formattedText = text;
    const formats = pendingFormats;
    
    formats.forEach(format => {
      if (format.includes(':')) {
        // Handle color/background with values
        const [formatType, value] = format.split(':');
        if (formatType === 'color') {
          formattedText = `<span class="${value}">${formattedText}</span>`;
        } else if (formatType === 'background') {
          formattedText = `<span class="${value} px-1 py-0.5 rounded">${formattedText}</span>`;
        }
      } else {
        // Handle simple formats
        switch (format) {
          case 'bold':
            formattedText = `<span style="font-weight: bold">${formattedText}</span>`;
            break;
          case 'italic':
            formattedText = `<span style="font-style: italic">${formattedText}</span>`;
            break;
          case 'underline':
            formattedText = `<span style="text-decoration: underline">${formattedText}</span>`;
            break;
          case 'strikethrough':
            formattedText = `<span style="text-decoration: line-through">${formattedText}</span>`;
            break;
          case 'code':
            formattedText = `<span class="bg-gray-800 text-red-400 px-1 py-0.5 rounded text-sm font-mono">${formattedText}</span>`;
            break;
        }
      }
    });

    return formattedText;
  };

  // Handle typing with pending formats
  const handleInput = (e) => {
    const selection = window.getSelection();
    
    // If we have pending formats and user is typing
    if (pendingFormats.length > 0 && e.inputType === 'insertText') {
      e.preventDefault();
      
      const text = e.data;
      const formattedText = applyPendingFormats(text);
      
      // Insert formatted text at cursor position
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedText;
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Update note content
      setCurrentNote(prev => ({
        ...prev,
        content: contentRef.current.innerHTML,
        updatedAt: new Date().toISOString()
      }));
      
      return;
    }
    
    // Normal input handling
    const updatedNote = {
      ...currentNote,
      content: e.target.innerHTML,
      updatedAt: new Date().toISOString()
    };
    
    setCurrentNote(updatedNote);
    
    // Auto-save note after a delay
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    
    saveTimeout.current = setTimeout(async () => {
      try {
        if (currentNote.id) {
          await apiService.updateNote(currentNote.id, updatedNote);
        } else {
          const newNote = await apiService.createNote({
            title: updatedNote.title,
            content: updatedNote.content,
            folder_id: updatedNote.folderId
          });
          setCurrentNote(newNote);
        }
      } catch (error) {
        console.error('Error saving note:', error);
      }
    }, 1000);
  };

  // Load note when folder changes
  useEffect(() => {
    const loadNoteForFolder = async () => {
      if (selectedFolder) {
        try {
          const notes = await apiService.getNotes(selectedFolder.id);
          if (notes.length > 0) {
            // Load the first note in the folder
            setCurrentNote(notes[0]);
            if (contentRef.current) {
              contentRef.current.innerHTML = notes[0].content;
            }
          } else {
            // Create a new note for this folder
            setCurrentNote({
              id: null,
              title: '',
              content: '',
              folderId: selectedFolder.id,
              updatedAt: new Date().toISOString()
            });
            if (contentRef.current) {
              contentRef.current.innerHTML = '';
            }
          }
        } catch (error) {
          console.error('Error loading notes:', error);
        }
      }
    };
    
    loadNoteForFolder();
  }, [selectedFolder]);

  useEffect(() => {
    const handleClick = (e) => {
      // If clicking outside the toolbar and not on the content editable area
      if (!e.target.closest('.text-format-toolbar') && !e.target.closest('[contenteditable]')) {
        setHasSelection(false);
        // Don't clear pending formats when clicking outside
      }
    };
    
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text.length > 0) {
        setHasSelection(true);
        handleTextSelection();
      } else {
        setHasSelection(false);
        setActiveFormats(new Set());
      }
    };
    
    document.addEventListener('click', handleClick);
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  return (
    // Haupt-Content-Bereich (rechts von der Sidebar)
    <div className="flex-1 bg-gray-900 text-white md:ml-0 min-h-screen">
      
      {/* Text-Formatierungs-Toolbar - immer rechts sichtbar */}
      <TextFormatToolbar
        onFormat={handleFormat}
        hasSelection={hasSelection}
        activeFormats={activeFormats}
        pendingFormats={pendingFormats}
      />
      
      {/* Sidebar öffnen Button - nur sichtbar wenn Sidebar geschlossen */}
      {!isSidebarOpen && (
        <button onClick={toggleSidebar} className="fixed top-4 left-4 z-20 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      
      {/* Hauptinhalt Container - zentriert mit max-width */}
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-16">
        
        {/* Notion-style Seiten-Header */}
        <div className="mb-8">
          {/* Breadcrumb - zeigt aktuellen Ordner */}
          <div className="flex items-center text-sm text-gray-400 mb-2">
            {selectedFolder && (
              <span className="flex items-center">
                <span className="mr-1">{selectedFolder.icon}</span>
                <span>{selectedFolder.name}</span>
              </span>
            )}
          </div>
          
          {/* Titel-Eingabe - große Schrift wie in Notion */}
          <input
            type="text"
            value={currentNote.title}
            onChange={handleTitleChange}
            placeholder="Unbenannt"
            className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-bold text-white placeholder-gray-600 py-2 resize-none"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          />
        </div>

        {/* Content-Bereich - unendlich scrollbar wie in Notion */}
        <div className="min-h-screen">
          {/* Editierbarer Textbereich */}
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleInput}
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

        {/* Footer mit "Zuletzt bearbeitet" Info */}
        {(currentNote.title || currentNote.content) && (
          <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-gray-800 px-3 py-2 rounded-lg">
            Zuletzt bearbeitet: {new Date(currentNote.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;
import { useState } from 'react';

const TextFormatToolbar = ({ onFormat, hasSelection, activeFormats, pendingFormats }) => {
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

  // Check if a format is active (either in current selection or pending for typing)
  const isFormatActive = (format) => {
    // Check for pending formats with values (like color:text-red-400)
    const hasPendingWithValue = pendingFormats.some(f => f.startsWith(`${format}:`));
    const hasPendingFormat = pendingFormats.includes(format);
    const isActive = activeFormats.has(format) || hasPendingFormat || hasPendingWithValue;
    
    
    return isActive;
  };

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
        onClick={() => onFormat('bold')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          isFormatActive('bold')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Fett (Cmd+B)"
      >
        <span className="font-bold text-sm">B</span>
      </button>
      
      {/* Italic */}
      <button
        onClick={() => onFormat('italic')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          isFormatActive('italic')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Kursiv (Cmd+I)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.5 2a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1L6.5 13h1a.5.5 0 010 1h-3a.5.5 0 010-1h1L6 4h-1a.5.5 0 01-.5-.5v-1A.5.5 0 015 2h3.5z"/>
        </svg>
      </button>
      
      {/* Underline */}
      <button
        onClick={() => onFormat('underline')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          isFormatActive('underline')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Unterstrichen (Cmd+U)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 18h14v1H3v-1zm2-16h2v8.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V2h2v8.5c0 2.48-2.02 4.5-4.5 4.5S5 12.98 5 10.5V2z"/>
        </svg>
      </button>
      
      
      {/* Code */}
      <button
        onClick={() => onFormat('code')}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
          isFormatActive('code')
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
            : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
        }`}
        title="Code (Cmd+E)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
        </svg>
      </button>
      
      <div className="h-px w-6 bg-gray-300 my-1"></div>
      
      {/* Text Color */}
      <div className="relative">
        <button 
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`p-2 rounded transition-colors flex items-center justify-center ${
            isFormatActive('color')
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
              : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
          }`}
          title="Textfarbe"
        >
          <span className="text-xs mr-1">A</span>
          <div className="w-3 h-0.5 bg-red-500"></div>
          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </button>
        {showColorPicker && (
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
          onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
          className={`p-2 rounded transition-colors flex items-center justify-center ${
            isFormatActive('background')
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
              : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
          }`}
          title="Hintergrundfarbe"
        >
          <div className="w-4 h-4 bg-yellow-300 rounded-sm"></div>
          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </button>
        {showBackgroundPicker && (
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

export default TextFormatToolbar;
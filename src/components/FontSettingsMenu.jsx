import React, { useState, useRef, useEffect } from 'react';
function FontSettingsMenu({ label, onUpdate, availableFonts, onDelete}) {
  if (!label) {
    return null;
  }

  const handleStyleChange = (prop, value) => {
    const updateValue = prop === 'fontSize' ? Math.max(1, parseInt(value, 10) || 12) : value;
    onUpdate(label.id, { [prop]: updateValue });
  };

  const toggleStyle = (prop, activeValue, inactiveValue) => {
    onUpdate(label.id, { [prop]: label[prop] === activeValue ? inactiveValue : activeValue });
  };

  // --- Delete Handler ---
  const handleDeleteClick = () => {
      if (window.confirm(`Are you sure you want to delete the label "${label.text}"?`)) {
          onDelete(label.id); // Call the handler passed from App
      }
  }

  return (
    <div onMouseDown={(e) => e.stopPropagation()} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 space-y-4">
      <h3 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 text-gray-800 dark:text-gray-100">Edit Label: "{label.text}"</h3>

      {/* Font Family Dropdown */}
      <div>
        <label htmlFor={`fontFamily-${label.id}`} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Font Family</label>
        <select
          id={`fontFamily-${label.id}`}
          value={label.fontFamily}
          onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
        >
          {availableFonts.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      {/* Font Size Input with Buttons */}
      <div>
        <label htmlFor={`fontSize-${label.id}`} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Font Size (px)</label>
        <div className="flex items-center mt-1">
          <button
            onClick={() => handleStyleChange('fontSize', label.fontSize - 1)}
            disabled={label.fontSize <= 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            aria-label="Decrease font size"
          >
            -
          </button>
          <input
            id={`fontSize-${label.id}`}
            type="number"
            min="1"
            max="144"
            value={label.fontSize}
            onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            className="w-16 text-center border-t border-b border-gray-300 dark:border-gray-600 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleStyleChange('fontSize', label.fontSize + 1)}
            disabled={label.fontSize >= 144}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            aria-label="Increase font size"
          >
            +
          </button>
        </div>
      </div>

      {/* Bold & Italic Toggle Buttons */}
      <div className="flex space-x-2 pt-1">
         <button
           onClick={() => toggleStyle('fontWeight', 'bold', 'normal')}
           aria-pressed={label.fontWeight === 'bold'}
           className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 ${
            label.fontWeight === 'bold'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
          }`}
         >
           Bold
         </button>
         <button
           onClick={() => toggleStyle('fontStyle', 'italic', 'normal')}
           aria-pressed={label.fontStyle === 'italic'}
           className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 ${
            label.fontStyle === 'italic'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
          }`}
         >
           Italic
         </button>
       </div>

       {/* Delete Button */}
       <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <button
                onClick={handleDeleteClick}
                className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
            >
                Delete Label
            </button>
       </div>
    </div>
  );
}

export default FontSettingsMenu;
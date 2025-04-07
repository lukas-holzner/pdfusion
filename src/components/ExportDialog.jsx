import React, { useState } from 'react';

function ExportDialog({ isOpen, onClose, onExport, data, headers }) {
  const [selectedExportType, setSelectedExportType] = useState('download'); // 'download' or 'email'

  if (!isOpen) return null;

  // Create row identifiers by taking first 3 non-empty values
  const rowOptions = data.map((row, index) => {
    const identifier = headers
      .map(header => row[header])
      .filter(value => value)
      .slice(0, 3)
      .join(', ');
    return {
      index,
      identifier: identifier || `Row ${index + 1}`
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedIndex = parseInt(e.target.rowSelect.value);
    // Pass the selected index AND the export type to the handler
    onExport(selectedIndex, selectedExportType);
    // Keep dialog open? Or close? Let's close it.
    // onClose(); // App.jsx now closes it
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Export Single PDF
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rowSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Row to Export:
            </label>
            <select
              id="rowSelect"
              name="rowSelect"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
              defaultValue={0} // Default to the first row
            >
              {rowOptions.map(option => (
                <option key={option.index} value={option.index}>
                  {option.identifier}
                </option>
              ))}
            </select>
          </div>

          {/* --- Export Type Selection --- */}
          <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action:
            </label>
            <div className="flex items-center space-x-4">
                 <label className="flex items-center">
                    <input
                    type="radio"
                    name="exportType"
                    value="download"
                    checked={selectedExportType === 'download'}
                    onChange={(e) => setSelectedExportType(e.target.value)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Download PDF</span>
                </label>
                 <label className="flex items-center">
                    <input
                    type="radio"
                    name="exportType"
                    value="email"
                    checked={selectedExportType === 'email'}
                    onChange={(e) => setSelectedExportType(e.target.value)}
                     className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Send Email</span>
                </label>
            </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Selecting "Send Email" will download the PDF and open your default email client with pre-filled fields. You will need to manually attach the downloaded PDF.
            </p>
          </div>


          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {selectedExportType === 'email' ? 'Prepare Email' : 'Download PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExportDialog;

import React from 'react';
import FileUpload from './FileUpload';

function TopControls({ 
  onPdfSelect, 
  onDataSelect, 
  isLoading, 
  isExporting,
  onAddLabelClick,
  onExportClick,
  onExportAllClick,
  isAddLabelDisabled,
  isExportDisabled
}) {
  return (
    <>
      {(isLoading || isExporting) && (
        <div className={`p-3 border rounded text-sm ${
          isLoading 
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200' 
            : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
        }`}>
          {isLoading ? 'Loading saved state...' : 'Exporting PDF...'}
        </div>
      )}

      <div className="flex space-x-4">
        <FileUpload
          label="Upload PDF Template"
          accept=".pdf"
          onFileSelect={onPdfSelect}
        />

        <FileUpload
          label="Upload Data (CSV/JSON)"
          accept=".csv,.json"
          onFileSelect={onDataSelect}
        />
      </div>

      <div className="flex space-x-4 mt-4">
        <button
          onClick={onAddLabelClick}
          disabled={isAddLabelDisabled}
          className="flex-grow px-4 py-2 bg-green-600 dark:bg-green-700 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add New Label
        </button>

        <button
          onClick={onExportClick}
          disabled={isExportDisabled}
          className="flex-grow px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export Single PDF'}
        </button>

        <button
          onClick={onExportAllClick}
          disabled={isExportDisabled}
          className="flex-grow px-4 py-2 bg-green-600 dark:bg-green-700 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export All PDFs'}
        </button>
      </div>
    </>
  );
}

export default TopControls;

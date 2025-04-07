import React from 'react';

function ExportDialog({ isOpen, onClose, onExport, data, headers }) {
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
    onExport(selectedIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Export PDF
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rowSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Select Row to Export
            </label>
            <select
              id="rowSelect"
              name="rowSelect"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              defaultValue={0}
            >
              {rowOptions.map(({ index, identifier }) => (
                <option key={index} value={index}>
                  {identifier}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              Export
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExportDialog;

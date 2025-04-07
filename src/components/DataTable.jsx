import React from 'react';

function DataTable({ data, headers }) {
  // Setup drag handlers for table headers
  const handleDragStart = (e, header) => {
    e.dataTransfer.setData('text/plain', header);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="overflow-auto w-full">
      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border border-gray-300 dark:border-gray-700 p-2 cursor-grab text-gray-900 dark:text-gray-100"
                draggable
                onDragStart={(e) => handleDragStart(e, header)}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {headers.map((header) => (
                <td key={header} className="border border-gray-300 dark:border-gray-700 p-2 text-gray-900 dark:text-gray-100">
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

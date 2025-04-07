import React from 'react';

function FileNameTemplateEditor({ template, onChange, availableVariables = [] }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Output File Name Template
      </label>
      <input
        type="text"
        value={template}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        placeholder="generated_{{index}}_{{filename}}"
      />
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>Available variables:</p>
        <ul className="list-disc list-inside">
          {availableVariables.map(v => (
            <li key={v.name} className="ml-2">
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{`{{${v.name}}}`}</code>
              {v.description && ` - ${v.description}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FileNameTemplateEditor;

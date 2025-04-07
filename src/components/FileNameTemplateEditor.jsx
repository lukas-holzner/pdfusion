import React, { useRef } from 'react';

function FileNameTemplateEditor({ template, onChange, availableVariables = [] }) {
  const inputRef = useRef(null);

  const handleVariableClick = (variableName) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const textToInsert = `{{${variableName}}}`;
    const newValue = template.substring(0, start) + textToInsert + template.substring(end);

    onChange(newValue);

    requestAnimationFrame(() => {
      input.focus();
      input.selectionStart = input.selectionEnd = start + textToInsert.length;
    });
  };

  const handleKeyDown = (event, variableName) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleVariableClick(variableName);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="text"
        value={template}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        placeholder="generated_{{index}}_{{filename}}"
      />
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>Available variables (click to insert):</p>
        <ul className="list-disc list-inside">
          {availableVariables.map(v => (
            <li key={v.name} className="ml-2">
              <code
                onClick={() => handleVariableClick(v.name)}
                onKeyDown={(e) => handleKeyDown(e, v.name)}
                className="bg-gray-100 dark:bg-gray-700 px-1 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                title={`Insert {{${v.name}}}`}
                role="button"
                tabIndex="0"
              >
                {`{{${v.name}}}`}
              </code>
              {v.description && ` - ${v.description}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FileNameTemplateEditor;

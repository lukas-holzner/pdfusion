import React from 'react';
import FileNameTemplateEditor from './FileNameTemplateEditor'; // Reuse the editor logic

function EmailTemplateEditors({
  toTemplate,
  onToChange,
  subjectTemplate,
  onSubjectChange,
  bodyTemplate,
  onBodyChange,
  availableVariables,
  onClose
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Edit Email Templates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            &times; {/* Simple close icon */}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient (To):
            </label>
            <FileNameTemplateEditor
              template={toTemplate}
              onChange={onToChange}
              availableVariables={availableVariables}
            />
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use variables like &#123;&#123;Email&#125;&#125; or enter a static address. Separate multiple static addresses with commas.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject:
            </label>
            <FileNameTemplateEditor
              template={subjectTemplate}
              onChange={onSubjectChange}
              availableVariables={availableVariables}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Body:
            </label>
            {/* Use a textarea for the body */}
             <textarea
                value={bodyTemplate}
                onChange={(e) => onBodyChange(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter email body template. Use {{variable}} for placeholders."
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <p>Available variables (can be used in To, Subject, and Body):</p>
                <ul className="list-disc list-inside">
                {availableVariables.map(v => (
                    <li key={v.name} className="ml-2">
                    <code>{`{{${v.name}}}`}</code>
                    {v.description && ` - ${v.description}`}
                    </li>
                ))}
                </ul>
                 <p className="mt-1">Note: Line breaks in the editor will be preserved in the email body.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
           <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailTemplateEditors;

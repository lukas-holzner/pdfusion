import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import FileNameTemplateEditor from './FileNameTemplateEditor';

function FileNameDialog({ isOpen, onClose, template, onChange, availableVariables }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Edit File Name Template
          </DialogTitle>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Output File Name Template
          </label>
          <FileNameTemplateEditor
            template={template}
            onChange={onChange}
            availableVariables={availableVariables}
          />
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default FileNameDialog;

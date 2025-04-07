import React from 'react';

function PageNavigator({ currentPage, numPages, onPrevious, onNext, disabled, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button 
        onClick={onPrevious} 
        disabled={currentPage <= 1 || disabled}
        className="px-3 py-1 bg-gray-700/50 rounded disabled:opacity-50 hover:bg-gray-600/50 transition-colors text-white"
      >
        ←
      </button>
      <span className="text-sm font-medium min-w-[100px] text-center">
        Page {currentPage} of {numPages}
      </span>
      <button 
        onClick={onNext} 
        disabled={currentPage >= numPages || disabled}
        className="px-3 py-1 bg-gray-700/50 rounded disabled:opacity-50 hover:bg-gray-600/50 transition-colors text-white"
      >
        →
      </button>
    </div>
  );
}

export default PageNavigator;

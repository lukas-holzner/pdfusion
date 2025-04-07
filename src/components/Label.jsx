import React, { useState, useRef, useEffect, useCallback } from 'react';

// Accept renderedPageInfo prop
function Label({ data, onSelect, onUpdate, isSelected, renderedPageInfo }) {
  // Destructure relativeX, relativeY instead of x, y
  const { id, text, relativeX, relativeY, fontFamily, fontSize, fontWeight, fontStyle } = data;
  const labelRef = useRef(null);
  const isDragging = useRef(false);
  const clickOffset = useRef({ x: 0, y: 0 });

  // Add state to track if we're handling a click vs. drag
  const isClick = useRef(true);
  const startPos = useRef({ x: 0, y: 0 });

  // Calculate absolute pixel position for styling
  const pixelX = renderedPageInfo ? relativeX * renderedPageInfo.width : 0;
  const pixelY = renderedPageInfo ? relativeY * renderedPageInfo.height : 0;
  
  // Scale font size based on the current render scale
  const scaledFontSize = renderedPageInfo ? fontSize * renderedPageInfo.scale : fontSize;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (!labelRef.current) return;

    // Record initial position for click vs. drag detection
    startPos.current = { x: e.clientX, y: e.clientY };
    isClick.current = true;

    const rect = labelRef.current.getBoundingClientRect();
    clickOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    isDragging.current = true;
    e.preventDefault();
    
    // Select the label on mousedown
    onSelect(id);
    
    labelRef.current.classList.add('dragging'); // Optional: Add style for dragging state
    labelRef.current.style.cursor = 'grabbing'; // Change cursor
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !labelRef.current || !labelRef.current.offsetParent) return;

    // Check if the mouse has moved enough to be considered a drag
    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);
    if (dx > 3 || dy > 3) {
      isClick.current = false;
    }

    const parentRect = labelRef.current.offsetParent.getBoundingClientRect();
    // Account for parent's scroll position
    const parentScrollTop = labelRef.current.offsetParent.scrollTop || 0;
    const parentScrollLeft = labelRef.current.offsetParent.scrollLeft || 0;

    let newX = e.clientX - parentRect.left + parentScrollLeft - clickOffset.current.x;
    let newY = e.clientY - parentRect.top + parentScrollTop - clickOffset.current.y;

    // Optional Clamping (within scroll dimensions)
    const labelWidth = labelRef.current.offsetWidth;
    const labelHeight = labelRef.current.offsetHeight;
    const parentScrollWidth = labelRef.current.offsetParent.scrollWidth;
    const parentScrollHeight = labelRef.current.offsetParent.scrollHeight;
    newX = Math.max(0, Math.min(newX, parentScrollWidth - labelWidth));
    newY = Math.max(0, Math.min(newY, parentScrollHeight - labelHeight));
    // End Clamping

    onUpdate(id, { x: newX, y: newY });
  }, [id, onUpdate]);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      labelRef.current?.classList.remove('dragging');
      if(labelRef.current) labelRef.current.style.cursor = 'move';
      
      // Don't deselect on mouseup - the label should stay selected
      // We don't need to call onSelect here since we already did in mousedown
    }
  }, []);

  // Add a click handler to handle clicks on the label
  const handleClick = (e) => {
    e.stopPropagation();
    // This ensures the label stays selected when clicked
    onSelect(id);
  };

  useEffect(() => {
    if (isDragging.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging.current, handleMouseMove, handleMouseUp]);

  // Add drop handling
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const columnHeader = e.dataTransfer.getData('text/plain');
    if (columnHeader) {
      onUpdate(id, { text: columnHeader });
      onSelect(id);
    }
  };

  const styles = {
    position: 'absolute',
    // Use calculated pixelX, pixelY
    left: `${pixelX}px`,
    top: `${pixelY}px`,
    fontFamily: fontFamily,
    fontSize: `${scaledFontSize}px`, // Use scaled font size
    fontWeight: fontWeight,
    fontStyle: fontStyle,
    cursor: 'move', // Default cursor
    padding: '2px 4px',
    border: isSelected ? '2px solid #0052cc' : '1px dashed #333',
    backgroundColor: 'rgba(230, 240, 255, 0.7)', // Slightly more opaque
    color: '#172B4D',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    zIndex: 10,
    boxShadow: isSelected ? '0 0 5px rgba(0, 82, 204, 0.5)' : 'none', // Add shadow when selected
    // Hide label if render info isn't available yet
    visibility: renderedPageInfo ? 'visible' : 'hidden',
    '@media (prefers-color-scheme: dark)': {
      border: isSelected ? '2px solid #66b2ff' : '1px dashed #ccc',
      backgroundColor: 'rgba(30, 41, 59, 0.7)',
      color: '#e2e8f0',
    }
  };

  return (
    <div
      ref={labelRef}
      style={styles}
      className="label-component"
      data-label-id={id} // Add data attribute for easier selection/debugging
      onMouseDown={handleMouseDown}
      onClick={handleClick} // Add click handler
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {`{${text}}`} {/* Show field name in curly braces */}
    </div>
  );
}

export default Label;
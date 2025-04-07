import React, { useState, useRef, useEffect, useCallback } from 'react';

function Label({ data, onSelect, onUpdate, isSelected, renderedPageInfo }) {
  const { id, text, relativeX, relativeY, fontFamily, fontSize, fontWeight, fontStyle } = data;
  const labelRef = useRef(null);
  const isDragging = useRef(false);
  const clickOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  // Track if mouse moved significantly during mousedown
  const didMove = useRef(false);

  const pixelX = renderedPageInfo ? relativeX * renderedPageInfo.width : 0;
  const pixelY = renderedPageInfo ? relativeY * renderedPageInfo.height : 0;
  const scaledFontSize = renderedPageInfo ? fontSize * renderedPageInfo.scale : fontSize;

  // Define mouse move handler using useCallback for stable reference
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !labelRef.current || !labelRef.current.offsetParent) return;

    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);

    if (!didMove.current && (dx > 3 || dy > 3)) {
      didMove.current = true;
      labelRef.current?.classList.add('dragging');
      // Prevent text selection only when dragging starts
      e.preventDefault();
    }

    if (didMove.current) { // Only update position if actual movement occurred
      const parentRect = labelRef.current.offsetParent.getBoundingClientRect();
      const parentScrollTop = labelRef.current.offsetParent.scrollTop || 0;
      const parentScrollLeft = labelRef.current.offsetParent.scrollLeft || 0;

      let newX = e.clientX - parentRect.left + parentScrollLeft - clickOffset.current.x;
      let newY = e.clientY - parentRect.top + parentScrollTop - clickOffset.current.y;

      const labelWidth = labelRef.current.offsetWidth;
      const labelHeight = labelRef.current.offsetHeight;
      const parentScrollWidth = labelRef.current.offsetParent.scrollWidth;
      const parentScrollHeight = labelRef.current.offsetParent.scrollHeight;
      newX = Math.max(0, Math.min(newX, parentScrollWidth - labelWidth));
      newY = Math.max(0, Math.min(newY, parentScrollHeight - labelHeight));

      onUpdate(id, { x: newX, y: newY });
    }
  }, [id, onUpdate]); // Dependencies for position update logic

  // Define mouse up handler using useCallback for stable reference
  const handleMouseUp = useCallback((e) => {
    // Always remove listeners added in handleMouseDown
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (isDragging.current) {
      if (didMove.current) {
        // Stop propagation only if a drag occurred, preventing the click handler
        e.stopPropagation();
      }

      // Reset dragging state and styles
      isDragging.current = false;
      if (labelRef.current) {
        labelRef.current.classList.remove('dragging');
        labelRef.current.style.cursor = 'move';
      }
    }
    // Reset didMove flag slightly later to allow click handler to check it
    // This ensures that a quick click without movement is not misinterpreted
    setTimeout(() => {
        didMove.current = false;
    }, 0);
  }, [handleMouseMove]); // Dependency on the stable mouse move handler

  const handleMouseDown = (e) => {
    e.stopPropagation(); // Prevent viewer click handler immediately
    if (!labelRef.current) return;

    startPos.current = { x: e.clientX, y: e.clientY };
    didMove.current = false; // Reset movement flag

    const rect = labelRef.current.getBoundingClientRect();
    clickOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    isDragging.current = true;
    // Don't select on mousedown, wait for click handler

    // Add visual cue and attach global listeners
    labelRef.current.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent viewer click handler
    // Only trigger select/toggle if mouse didn't move significantly
    if (!didMove.current) {
      onSelect(id); // Call App's toggle handler
    }
    // didMove is reset in handleMouseUp's timeout
  };

  // Removed the useEffect for adding/removing listeners based on isDragging.current

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
      // Select the label after dropping data onto it
      // Use setTimeout to ensure it happens after potential click/mouseup logic
      setTimeout(() => onSelect(id), 0);
    }
  };

  const styles = {
    position: 'absolute',
    left: `${pixelX}px`,
    top: `${pixelY}px`,
    fontFamily: fontFamily,
    fontSize: `${scaledFontSize}px`,
    fontWeight: fontWeight,
    fontStyle: fontStyle,
    cursor: 'move',
    padding: '2px 4px',
    border: isSelected ? '2px solid #0052cc' : '1px dashed #333',
    backgroundColor: 'rgba(230, 240, 255, 0.7)',
    color: '#172B4D',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    zIndex: 10,
    boxShadow: isSelected ? '0 0 5px rgba(0, 82, 204, 0.5)' : 'none',
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
      data-label-id={id}
      onMouseDown={handleMouseDown}
      onClick={handleClick} // Handles selection toggle for non-drags
      // onMouseUp is handled by the document listener added in onMouseDown
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {`{${text}}`}
    </div>
  );
}

export default Label;
import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PageNavigator from './PageNavigator';
import FileNameDialog from './FileNameDialog';

function PdfViewer({ 
  pdfFile, 
  pageNumber, 
  onPageRendered, 
  children, 
  className, 
  onPdfLoadSuccess,
  onPageChange,
  nameTemplate,
  onNameTemplateChange,
  templateVariables 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Ref for the main scrolling container
  const [loading, setLoading] = useState(false);
  const [pdfDocProxy, setPdfDocProxy] = useState(null); // Store the pdfjs proxy object
  const [renderContext, setRenderContext] = useState(null); // Stores canvas size, scale etc.
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

  // --- Load PDF document effect ---
  useEffect(() => {
    // Clear previous state when pdfFile changes or becomes null
    setPdfDocProxy(null);
    setRenderContext(null);
    // Reset page count in parent immediately when file changes
    if (onPdfLoadSuccess) {
       onPdfLoadSuccess({ numPages: 0 });
    }

    if (!pdfFile) {
      return; // Exit if no file
    }

    let isMounted = true; // Prevent state updates if component unmounts during async load
    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (!isMounted) return; // Exit if unmounted

      const typedArray = new Uint8Array(e.target.result);
      try {
        console.log("Attempting to load PDF document...");
        // Load the PDF using PDF.js
        const doc = await pdfjsLib.getDocument(typedArray).promise;
        console.log("PDF document loaded successfully.");
         if (!isMounted) return; // Check again after await

        setPdfDocProxy(doc);
        // Report page count on successful load
        if (onPdfLoadSuccess) {
           onPdfLoadSuccess({ numPages: doc.numPages });
        }
      } catch (error) {
        console.error("Error loading PDF document:", error);
        alert(`Failed to load PDF for rendering: ${error.message}`);
         if (!isMounted) return;
        setPdfDocProxy(null);
        // Reset page count on error
        if (onPdfLoadSuccess) {
            onPdfLoadSuccess({ numPages: 0 });
        }
      } finally {
         if (isMounted) {
            setLoading(false);
         }
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      alert("Error reading PDF file.");
       if (isMounted) {
          setLoading(false);
          setPdfDocProxy(null);
          if (onPdfLoadSuccess) onPdfLoadSuccess({ numPages: 0 }); // Reset on error
       }
    };

    reader.readAsArrayBuffer(pdfFile);

    // Cleanup function
    return () => {
        isMounted = false;
        console.log("PdfViewer: Unmounting or pdfFile changed, cleaning up load effect.");
        // pdfDocProxy?.destroy(); // Optional: Destroy the PDF.js document proxy if needed
    };

  }, [pdfFile, onPdfLoadSuccess]); // Rerun effect if pdfFile or the callback changes


  // --- Render Page effect ---
  useEffect(() => {
    // Ensure renderContext is cleared if pdfDocProxy becomes null
    if (!pdfDocProxy) {
      setRenderContext(null);
       // Clear canvas manually if needed
       const canvas = canvasRef.current;
       if(canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
       }
      return;
    }

    // Ensure refs are current
    if (!canvasRef.current || !containerRef.current) {
      console.log("Canvas or Container ref not ready for rendering");
      return;
    }

    let isMounted = true; // Flag to prevent state update on unmounted component
    let renderTask = null; // To hold the render task for potential cancellation

    const renderPage = async () => {
        // Check refs again inside async function
        if (!pdfDocProxy || !canvasRef.current || !containerRef.current) {
            console.log("PDF Doc Proxy or refs became invalid during async render operation");
            return;
        }

        setLoading(true); // Indicate loading for render
        console.log(`Attempting to render page ${pageNumber}`);
        try {
          const page = await pdfDocProxy.getPage(pageNumber);
            console.log(`Got page ${pageNumber}`);

            if (!pdfDocProxy || !canvasRef.current ) return; // Check again
            setLoading(true);
            
            // Calculate container width accounting for padding
            const containerStyles = window.getComputedStyle(containerRef.current);
            const paddingLeft = parseInt(containerStyles.paddingLeft, 10) || 0;
            const paddingRight = parseInt(containerStyles.paddingRight, 10) || 0;
            const availableWidth = containerRef.current.clientWidth - paddingLeft - paddingRight;
            
            // Get the base viewport at scale 1 to determine original PDF dimensions
            const baseViewport = page.getViewport({ scale: 1 });
            
            // Calculate scale to fit width while accounting for padding
            const scale = availableWidth / baseViewport.width;
            const viewport = page.getViewport({ scale });
            
            console.log(`Container padding: ${paddingLeft + paddingRight}px, Available width: ${availableWidth}px`);
            console.log(`Using dynamic scale: ${scale.toFixed(2)}, Viewport: w=${viewport.width.toFixed(0)} h=${viewport.height.toFixed(0)}`);

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;
            console.log(`Canvas dimensions set: w=${canvas.width} h=${canvas.height}`);

            // Start the render task
            renderTask = page.render({
                canvasContext: context,
                viewport,
            });

            console.log("Starting page render...");
            await renderTask.promise;
            renderTask = null; // Clear task reference after completion
            console.log(`Page ${pageNumber} render completed.`);

            // Check if component is still mounted before setting state
            if (isMounted) {
                const newRenderContext = {
                    width: viewport.width, // Rendered canvas width
                    height: viewport.height, // Rendered canvas height
                    scale: scale,
                    pdfPageWidth: baseViewport.width, // Original PDF page width in points
                    pdfPageHeight: baseViewport.height // Original PDF page height in points
                };
                setRenderContext(newRenderContext);
                // Call the callback provided by the parent
                if (onPageRendered) {
                    onPageRendered(newRenderContext);
                }
            } else {
                console.log("Component unmounted before render finished.");
            }

        } catch (error) {
             // Check for specific cancellation error if pdf.js supports it
            if (error?.name === 'RenderingCancelledException' || error?.message?.includes('cancelled')) {
                console.log(`Rendering of page ${pageNumber} cancelled.`);
            } else {
                console.error(`Error rendering page ${pageNumber}:`, error);
                alert(`Failed to render page ${pageNumber}: ${error.message}`);
            }
             if (isMounted) {
                 setRenderContext(null); // Clear context on error
                 // Optionally clear canvas
                 const canvas = canvasRef.current;
                  if(canvas) {
                      const context = canvas.getContext('2d');
                      context.clearRect(0, 0, canvas.width, canvas.height);
                  }
             }
        } finally {
             if (isMounted) {
                  setLoading(false);
             }
        }
    };

    renderPage();

    // Cleanup function for the render effect
     return () => {
         isMounted = false;
         console.log(`PdfViewer: Cleaning up render effect for page ${pageNumber}.`);
         // Attempt to cancel the ongoing render task if it exists and pdf.js supports it
         if (renderTask && typeof renderTask.cancel === 'function') {
             console.log(`Cancelling ongoing render for page ${pageNumber}.`);
             renderTask.cancel();
         }
         renderTask = null;
     };
    // Rerun render effect if the document proxy or page number changes
  }, [pdfDocProxy, pageNumber, onPageRendered]);

  // --- Component Rendering ---
  return (
    // Main scrollable container, accepts className from parent
    <div ref={containerRef} className={`pdf-viewer-container w-full h-full flex items-start overflow-auto bg-gray-200 dark:bg-gray-900 p-4 ${className || ''}`}>
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex justify-center items-center z-20">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Loading PDF...</p>
        </div>
      )}

      {/* Container for Canvas and Labels - position relative is crucial for label positioning */}
      <div className="relative shadow-lg bg-white dark:bg-gray-800 flex-shrink-0 mx-auto">
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />
        {pdfDocProxy && renderContext && children}
      </div>

      {/* Floating Navigation Bar */}
      {pdfDocProxy && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gray-800/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg flex items-center gap-4 text-white z-30">
          <PageNavigator
            currentPage={pageNumber}
            numPages={pdfDocProxy.numPages}
            onPrevious={() => onPageChange && onPageChange(pageNumber - 1)}
            onNext={() => onPageChange && onPageChange(pageNumber + 1)}
            className="text-white"
          />
          <div className="border-l border-gray-600 pl-4 ml-2">
            <button 
              onClick={() => setIsNameDialogOpen(true)}
              className="text-sm font-medium hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1"
            >
              {nameTemplate || 'Set filename template...'}
            </button>
          </div>
        </div>
      )}

      {/* Add FileNameDialog */}
      <FileNameDialog
        isOpen={isNameDialogOpen}
        onClose={() => setIsNameDialogOpen(false)}
        template={nameTemplate}
        onChange={onNameTemplateChange}
        availableVariables={templateVariables}
      />

      {/* Placeholder if PDF loading failed */}
      {pdfFile && !pdfDocProxy && !loading && (
        <div className="text-center text-red-500 mt-10">
            Failed to load PDF. Please check the console for errors and ensure the file is valid.
        </div>
      )}
    </div>
  );
}

export default PdfViewer;
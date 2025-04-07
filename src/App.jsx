import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';
import { usePdfExport } from './hooks/usePdfExport';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import PdfViewer from './components/PDFViewer';
import TopControls from './components/TopControls';
import FontSettingsMenu from './components/FontSettingsMenu';
import Label from './components/Label';
import DataTable from './components/DataTable';
import ThemeToggle from './components/ThemeToggle';
import ExportDialog from './components/ExportDialog';
import { calculateHash } from './utils/pdfHash';
import FileNameTemplateEditor from './components/FileNameTemplateEditor';

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

function App() {
  const [pdfFile, setPdfFile] = useState(null); // The File object for display name etc.
  const [pdfFileBuffer, setPdfFileBuffer] = useState(null); // ArrayBuffer for pdf-lib & hashing
  const [pdfHash, setPdfHash] = useState(null); // State for PDF hash
  const [numPages, setNumPages] = useState(0); // State for total pages reported by PdfViewer
  const [currentPage, setCurrentPage] = useState(1); // Current page being viewed/edited
  const [renderedPageInfo, setRenderedPageInfo] = useState(null); // Info from PdfViewer about the *currently* rendered page { width, height, scale, pdfPageWidth, pdfPageHeight }
  const [labels, setLabels] = useState([]); // Holds labels for ALL pages
  const [selectedLabelId, setSelectedLabelId] = useState(null); // ID of the currently selected label
  const viewerAreaRef = useRef(null); // Ref for the main viewer panel (right side)
  const [isExporting, setIsExporting] = useState(false); // Loading state for export process
  const [isLoadingState, setIsLoadingState] = useState(false); // Loading state indicator for localStorage operations
  const [data, setData] = useState([]); // Array of data rows
  const [headers, setHeaders] = useState([]); // Array of column headers
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [fileNameTemplate, setFileNameTemplate] = useState('generated_{{index}}_{{filename}}');

  // Update theme state initialization to check localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Initial theme setup
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark'); // Ensure the 'dark' class is removed for light mode
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Theme toggle handler
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // List of available fonts for the settings menu
  const availableFonts = [
    'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS',
    'Times New Roman', 'Georgia', 'Garamond',
    'Courier New', 'Lucida Console', 'Monaco',
    'Brush Script MT', 'Comic Sans MS', // Example decorative/script fonts
    'Impact', 'Arial Black', // Example display fonts
    'sans-serif', 'serif', 'monospace', 'cursive' // Generic CSS fallbacks
  ];

  // --- Save Labels to LocalStorage ---
  const saveLabelsToLocalStorage = useCallback((allLabels, hash) => {
      if (!hash) return; // Don't save without a hash
      console.log(`Saving ${allLabels.length} labels to localStorage for hash: ${hash}`);

      // Save the file name template with the hash
      localStorage.setItem(`pdfTemplate_fileName_${hash}`, fileNameTemplate);

      // Group labels by pageIndex
      const labelsByPage = allLabels.reduce((acc, label) => {
          const pageIndex = label.pageIndex;
          if (!acc[pageIndex]) {
              acc[pageIndex] = [];
          }
          acc[pageIndex].push(label);
          return acc;
      }, {});

      // Save each page's labels
      let maxPageIndexProcessed = -1;
      Object.keys(labelsByPage).forEach(pageIndexStr => {
          const pageIndex = parseInt(pageIndexStr, 10);
          maxPageIndexProcessed = Math.max(maxPageIndexProcessed, pageIndex);
          const key = `pdfTemplateLabels_${hash}_${pageIndex}`;
          const data = JSON.stringify(labelsByPage[pageIndex]);
          try {
              localStorage.setItem(key, data);
              // console.log(`Saved page ${pageIndex} data. Key: ${key}`);
          } catch (error) {
              console.error(`Error saving labels for page ${pageIndex} to localStorage:`, error);
              // Consider notifying the user if storage quota is exceeded
              alert(`Could not save state for page ${pageIndex + 1}. Local storage might be full.`);
          }
      });

       // OPTIONAL: Clear localStorage for pages beyond the current max index if needed,
       // requires knowing the previous max index or iterating through keys.
       // For now, we don't explicitly clear old page data.

  }, [fileNameTemplate]);

  // --- Load Labels from LocalStorage ---
  const loadLabelsFromLocalStorage = useCallback(async (hash) => {
    if (!hash) return []; // Can't load without a hash
    console.log(`Loading labels from localStorage for hash: ${hash}`);
    setIsLoadingState(true);

    // Load file name template for this PDF
    const savedTemplate = localStorage.getItem(`pdfTemplate_fileName_${hash}`);
    if (savedTemplate) {
      setFileNameTemplate(savedTemplate);
    }

    let loadedLabels = [];
    // Check a reasonable number of pages or use numPages if available,
    // but numPages might not be known when this is first called.
    const maxPagesToCheck = 50; // Adjust as needed

    for (let pageIndex = 0; pageIndex < maxPagesToCheck; pageIndex++) {
      const key = `pdfTemplateLabels_${hash}_${pageIndex}`;
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const pageLabels = JSON.parse(data);
          // Basic validation
          if (Array.isArray(pageLabels) && pageLabels.every(l => typeof l === 'object' && l.id)) {
             // Ensure pageIndex is correctly set (might be missing in older saved data)
             pageLabels.forEach(l => l.pageIndex = pageIndex);
             loadedLabels = loadedLabels.concat(pageLabels);
          } else {
              console.warn(`Invalid data format found in localStorage for key: ${key}`);
              localStorage.removeItem(key); // Remove invalid data
          }
        } else {
            // Optimization: If we haven't found data for a few consecutive pages, maybe stop?
            // if (pageIndex > (lastFoundPageIndex + 5)) break;
        }
      } catch (error) {
        console.error(`Error loading/parsing labels for page ${pageIndex} from localStorage:`, error);
        // Optionally remove potentially corrupted data
        // localStorage.removeItem(key);
      }
    }
    console.log(`Loaded ${loadedLabels.length} labels from localStorage.`);
    setIsLoadingState(false);
    return loadedLabels;
  }, []); // No dependencies, it's a self-contained utility based on hash

  // Save file name template when it changes
  useEffect(() => {
    if (pdfHash) {
      localStorage.setItem(`pdfTemplate_fileName_${pdfHash}`, fileNameTemplate);
    }
  }, [fileNameTemplate, pdfHash]);

  // --- PDF Selection Handler (Hashing & Loading State) ---
  const handlePdfSelect = useCallback(async (file) => {
      console.log("PDF selected:", file.name);
      // Reset all relevant state for the new file
      setPdfFile(file);
      setLabels([]);
      setSelectedLabelId(null);
      setCurrentPage(1);
      setRenderedPageInfo(null);
      setPdfFileBuffer(null);
      setPdfHash(null);
      setNumPages(0);
      setIsLoadingState(true); // Indicate loading operation
      setFileNameTemplate('generated_{{index}}_{{filename}}'); // Reset filename template

      // Read the file into an ArrayBuffer
      const reader = new FileReader();
      reader.onload = async (e) => {
          const buffer = e.target.result;
          setPdfFileBuffer(buffer); // Store buffer for hashing and export
          console.log("PDF file read into ArrayBuffer.");

          // Calculate hash from the buffer
          const hash = await calculateHash(buffer);
          setPdfHash(hash); // Store the calculated hash

          if (hash) {
              // Load labels from localStorage using the new hash
              const loadedLabels = await loadLabelsFromLocalStorage(hash);
              setLabels(loadedLabels); // Update labels state with loaded data
          } else {
              console.error("Failed to calculate PDF hash. Cannot load/save state.");
              setIsLoadingState(false); // Stop loading indicator if hash failed
          }
          // isLoadingState is turned off within loadLabelsFromLocalStorage or if hash fails
      };
      reader.onerror = (error) => {
          console.error("Error reading PDF file into ArrayBuffer:", error);
          alert("Could not read PDF file.");
          setIsLoadingState(false); // Stop loading on file read error
      };
      reader.readAsArrayBuffer(file);
  }, [loadLabelsFromLocalStorage]); // Dependency on load function


  // --- Handler called by PdfViewer when PDF.js successfully loads the doc ---
   const handlePdfLoadSuccess = useCallback(({ numPages }) => {
        console.log("App received PDF Load Success. Page count:", numPages);
        setNumPages(numPages); // Update total page count
   }, []); // No dependencies needed


  // --- useEffect to save labels whenever they change ---
  useEffect(() => {
      // Save labels to localStorage whenever the labels array or the PDF hash changes,
      // but only if we actually have a valid hash and buffer (meaning a file is properly loaded).
      if (pdfHash && pdfFileBuffer) {
          saveLabelsToLocalStorage(labels, pdfHash);
      }
  }, [labels, pdfHash, pdfFileBuffer, saveLabelsToLocalStorage, fileNameTemplate]); // Trigger save on these changes

  // --- Handler called by PdfViewer when a page is rendered ---
  const handlePageRendered = useCallback((info) => {
      setRenderedPageInfo(info); // Store info about the rendered page
      // console.log("Page rendered info updated in App:", info);
  }, []);

  // Load filename template from local storage on mount
  useEffect(() => {
    const savedTemplate = localStorage.getItem('fileNameTemplate');
    if (savedTemplate) {
      setFileNameTemplate(savedTemplate);
    }
  }, []);

  // --- Select a label when clicked ---
  const handleLabelSelect = useCallback((id) => {
    console.log("Selecting Label ID:", id);
    setSelectedLabelId(id);
  }, []);

  // --- Deselect label if clicking on the viewer background ---
  const handleViewerClick = useCallback((e) => {
      // Check if the click target is outside any label component
       if (!e.target.closest('.label-component')) {
            // More specific check could verify target is canvas or specific background divs if needed
            console.log("Background clicked, deselecting label.");
            setSelectedLabelId(null);
       } else {
            // Check if the click was inside the currently selected label
            if (selectedLabelId && e.target.closest(`.label-component[data-label-id="${selectedLabelId}"]`)) {
                console.log("Click was inside the selected label, deselecting.");
                setSelectedLabelId(null);
            }
       }
  }, [selectedLabelId]); // Dependency on selectedLabelId

  // --- Update label properties (position, style) ---
  const handleLabelUpdate = useCallback((id, updates) => {
    setLabels(prevLabels =>
      prevLabels.map(label => {
        if (label.id === id) {
          let newUpdates = { ...updates };
          // If position is updated (absolute pixels), convert to relative
          if (updates.x !== undefined && updates.y !== undefined && renderedPageInfo) {
            const relativeX = Math.max(0, Math.min(1, updates.x / renderedPageInfo.width));
            const relativeY = Math.max(0, Math.min(1, updates.y / renderedPageInfo.height));
            // Remove absolute x, y and add relative ones
            delete newUpdates.x;
            delete newUpdates.y;
            newUpdates = { ...newUpdates, relativeX, relativeY };
          }
          return { ...label, ...newUpdates };
        }
        return label;
      })
    );
  }, [renderedPageInfo]); // Add renderedPageInfo dependency

  // --- Add a new label to the current page ---
  const handleAddLabelClick = useCallback(() => {
    // Need renderedPageInfo to calculate initial position relative to the current view
    if (!pdfFile || !renderedPageInfo) {
        alert("Please upload a PDF and wait for it to render first.");
        return;
    }
    // Default position (top-left corner of the view) in pixels
    const defaultX = 20;
    const defaultY = 20;

    // Convert default pixel position to relative coordinates
    const relativeX = defaultX / renderedPageInfo.width;
    const relativeY = defaultY / renderedPageInfo.height;

    // Default font size (in points, will be scaled for display)
    const defaultFontSize = 12;

    const newLabel = {
      id: `label-${Date.now()}-${Math.random().toString(16).slice(2)}`, // More unique ID
      text: 'Drop Column Here', // Default text prompting user to drop a column
      relativeX: Math.max(0, Math.min(1, relativeX)), // Store relative coordinates
      relativeY: Math.max(0, Math.min(1, relativeY)), // Store relative coordinates
      pageIndex: currentPage - 1, // Assign to the currently viewed page (0-based)
      fontFamily: 'Helvetica', // Default font
      fontSize: defaultFontSize, // This is the base size in PDF points
      fontWeight: 'normal',    // Default weight
      fontStyle: 'normal',     // Default style
    };

    // Use functional update to add the new label
    setLabels(prevLabels => [...prevLabels, newLabel]);
    setSelectedLabelId(newLabel.id); // Select the newly added label
    console.log(`Added new label to page ${currentPage}`);

  }, [currentPage, pdfFile, renderedPageInfo]); // Dependencies needed for checks and pageIndex

  // --- Delete the currently selected label ---
  const handleDeleteLabel = useCallback((idToDelete) => {
      // Use functional update to remove the label
      setLabels(prevLabels => prevLabels.filter(label => label.id !== idToDelete));
      setSelectedLabelId(null); // Deselect after deleting
      // Save to localStorage will happen via the useEffect watching 'labels'
      console.log(`Deleted label ${idToDelete}`);
  }, []); // No dependencies needed

  // --- Page Navigation Handlers ---
  const goToPreviousPage = useCallback(() => {
      setCurrentPage(prev => {
          const newPage = Math.max(1, prev - 1);
          if (newPage !== prev) {
              setSelectedLabelId(null); // Deselect label only if page actually changes
              setRenderedPageInfo(null); // Clear render info for the old page
          }
          return newPage;
      });
  }, []); // No dependencies needed

  const goToNextPage = useCallback(() => {
      // numPages might be 0 initially, Math.min handles this correctly
      setCurrentPage(prev => {
          const newPage = Math.min(numPages || 1, prev + 1);
           if (newPage !== prev) {
               setSelectedLabelId(null); // Deselect label only if page actually changes
               setRenderedPageInfo(null); // Clear render info for the old page
           }
           return newPage;
      });
  }, [numPages]); // Dependency on numPages to know the upper limit

 

  const handleDataFileSelect = useCallback((file) => {
    if (!file) return;

    if (file.type === 'text/csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setHeaders(results.meta.fields || []);
          setData(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Failed to parse CSV file');
        }
      });
    } else if (file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            setHeaders(Object.keys(jsonData[0]));
            setData(jsonData);
          } else {
            throw new Error('Invalid JSON data format');
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
    }
  }, []);

  // Modified export handler to show dialog instead of exporting directly
  const handleExportClick = useCallback(() => {
    if (!pdfFileBuffer || !pdfHash || !data.length) {
      alert("Please ensure you have uploaded both a PDF template and data file.");
      return;
    }
    setIsExportDialogOpen(true);
  }, [pdfFileBuffer, pdfHash, data]);

  const { isExporting: isExportingSingleRow, exportSingleRow } = usePdfExport();

  // New handler for exporting single row
  const handleExportRow = useCallback(async (rowIndex) => {
    try {
      await exportSingleRow({
        pdfFileBuffer,
        pdfFile,
        row: data[rowIndex],
        rowIndex,
        labels,
        fileNameTemplate, // Pass the template
        variables: {
          index: rowIndex + 1,
          filename: pdfFile.name,
          date: new Date().toISOString().split('T')[0],
          ...data[rowIndex] // Spread the row data for column variables
        }
      });
    } catch (error) {
      alert(`Failed to export PDF: ${error.message}`);
    }
  }, [pdfFileBuffer, pdfFile, labels, data, exportSingleRow, fileNameTemplate]);

  const handleExportAllClick = useCallback(async () => {
    if (!pdfFileBuffer || !pdfHash || !data.length) {
      alert("Please ensure you have uploaded both a PDF template and data file.");
      return;
    }

    setIsExporting(true);
    try {
      const zip = new JSZip();
      
      // Export each row
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const variables = {
          index: rowIndex + 1,
          filename: pdfFile.name,
          date: new Date().toISOString().split('T')[0],
          ...data[rowIndex]
        };

        // Generate filename from template
        const fileName = fileNameTemplate.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          const trimmedKey = key.trim();
          const value = variables[trimmedKey];
          return value !== undefined ? value : match;
        });

        // Export the PDF but get the bytes instead of saving
        const pdfBytes = await exportSingleRow({
          pdfFileBuffer,
          pdfFile,
          row: data[rowIndex],
          rowIndex,
          labels,
          fileNameTemplate,
          variables,
          returnBytes: true // New option to return bytes instead of saving
        });

        // Add to zip
        zip.file(`${fileName}.pdf`, pdfBytes);
      }

      // Generate and download zip
      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, 'exported_pdfs.zip');

    } catch (error) {
      console.error('Error exporting PDFs:', error);
      alert('Failed to export PDFs: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [pdfFileBuffer, pdfHash, data, pdfFile, labels, fileNameTemplate, exportSingleRow]);

  const templateVariables = [
    { name: 'index', description: 'Row number (1-based)' },
    { name: 'filename', description: 'Original PDF filename' },
    { name: 'date', description: 'Current date (YYYY-MM-DD)' },
    // Add any column names from your data as available variables
    ...(headers.map(h => ({ name: h, description: 'Data column' })))
  ];

  // Find the currently selected label object
  const selectedLabel = labels.find(label => label.id === selectedLabelId);

  // --- JSX Rendering ---
  return (
    <div className="w-screen flex h-screen bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden">
      <ThemeToggle isDark={isDarkMode} onToggle={toggleDarkMode} />

      <div className="w-1/3 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 pb-2 border-b dark:border-gray-700">Controls</h2>

        <TopControls
          onPdfSelect={handlePdfSelect}
          onDataSelect={handleDataFileSelect}
          isLoading={isLoadingState}
          isExporting={isExporting}
          onAddLabelClick={handleAddLabelClick}
          onExportClick={handleExportClick}
          onExportAllClick={handleExportAllClick}
          isAddLabelDisabled={!pdfFile || !renderedPageInfo || isExporting || isLoadingState}
          isExportDisabled={!pdfFileBuffer || !pdfHash || labels.length === 0 || isExporting || isLoadingState}
        />

        {/* Font Settings Menu (shown when a label is selected) */}
        {selectedLabel && (
          <FontSettingsMenu
            key={selectedLabelId}
            label={selectedLabel}
            onUpdate={handleLabelUpdate}
            availableFonts={availableFonts}
            onDelete={handleDeleteLabel}
          />
        )}
         {/* Show Data Table if data is loaded */}
         {data.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Data Preview</h3>
            <DataTable data={data} headers={headers} />
          </div>
        )}
      </div>

      {/* Right Panel: PDF Viewer Area */}
      <div
        ref={viewerAreaRef}
        onClick={handleViewerClick}
        className="w-2/3 bg-gray-300 dark:bg-gray-700 flex justify-center items-center relative overflow-hidden"
      >
        <PdfViewer
          pdfFile={pdfFile}
          pageNumber={currentPage}
          onPageChange={setCurrentPage}
          onPageRendered={handlePageRendered}
          onPdfLoadSuccess={handlePdfLoadSuccess}
          nameTemplate={fileNameTemplate}
          onNameTemplateChange={setFileNameTemplate}
          templateVariables={templateVariables}
          className="w-full h-full"
        >
          {/* Render Labels ONLY for the CURRENT page */}
          {renderedPageInfo && labels.filter(l => l.pageIndex === currentPage - 1).map(label => (
            <Label
              key={label.id}
              data={label}
              onSelect={handleLabelSelect}
              onUpdate={handleLabelUpdate}
              isSelected={label.id === selectedLabelId}
              renderedPageInfo={renderedPageInfo} // Pass down render info
            />
          ))}
        </PdfViewer>
      </div>

      {/* Add Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExportRow}
        data={data}
        headers={headers}
      />
    </div>
  );
}

export default App;

import { useState, useCallback } from 'react';
import { exportPdf } from '../services/pdfExport';
import { saveAs } from 'file-saver'; // Import saveAs here

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportSingleRow = useCallback(async ({
    pdfFileBuffer,
    pdfFile, // Keep pdfFile for filename variable if needed
    row,
    rowIndex,
    labels,
    fileNameTemplate,
    emailToTemplate, // Add email templates
    emailSubjectTemplate,
    emailBodyTemplate,
    variables,
    exportType = 'download', // Default to download
    // returnBytes is implicitly true for email, false for download unless overridden
  }) => {
    setIsExporting(true);

    try {
      console.log(`Exporting PDF for row ${rowIndex} with type: ${exportType}...`);

      // --- 1. Generate Filename ---
      const fileName = fileNameTemplate.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        // Handle potential 'filename' key specifically to remove extension
        if (trimmedKey === 'filename' && pdfFile?.name) {
            return pdfFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
        }
        const value = variables[trimmedKey];
        return value !== undefined ? value : match;
      });
      const fullFileName = `${fileName}.pdf`; // Add extension for saving/attaching

      // --- 2. Generate PDF Bytes ---
      // Always generate bytes first for both download and email
      const pdfBytes = await exportPdf({
        pdfFileBuffer,
        row,
        labels,
        fileName: fileName, // Pass filename without extension to underlying function if it uses it
        returnBytes: true // Force returnBytes true
      });

      // --- 3. Handle Export Type ---
      if (exportType === 'email') {
        // --- Email Flow ---
        console.log("Preparing email...");

        // a) Download the generated PDF so the user can attach it
        saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), fullFileName);
        console.log(`PDF downloaded as ${fullFileName} for email attachment.`);

        // b) Process email templates
        const processTemplate = (template) => template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
             // Handle potential 'filename' key specifically to remove extension
            if (trimmedKey === 'filename' && pdfFile?.name) {
                return pdfFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
            }
            const value = variables[trimmedKey];
            return value !== undefined ? value : match;
        });

        const mailTo = processTemplate(emailToTemplate);
        const subject = processTemplate(emailSubjectTemplate);
        const body = processTemplate(emailBodyTemplate);

        // c) Construct mailto link (encode components)
        const mailtoLink = `mailto:${encodeURIComponent(mailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // d) Open mail client
        // Use window.open for potentially better behavior than location.href
        window.open(mailtoLink, '_self'); // '_self' attempts to open in the same window/tab context

        // e) Inform user (important step!)
        // Use setTimeout to allow the mailto link to potentially open first
        setTimeout(() => {
            alert(`PDF downloaded as "${fullFileName}".\n\nPlease attach this file to the email draft that just opened.`);
        }, 500); // Delay slightly

      } else {
        // --- Download Flow (Default) ---
        console.log(`Downloading PDF as ${fullFileName}...`);
        saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), fullFileName);
      }

      // Return value might not be needed anymore unless specifically handled upstream
      // return exportType === 'email' ? null : pdfBytes; // Or adjust as needed

    } catch (error) {
      console.error("Error during PDF export/email preparation:", error);
      throw error; // Re-throw to be caught by the calling component
    } finally {
      setIsExporting(false);
    }
  }, []); // Add dependencies if needed, though most are passed in

  return {
    isExporting,
    exportSingleRow
  };
}

import { useState, useCallback } from 'react';
import { exportPdf } from '../services/pdfExport';

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportSingleRow = useCallback(async ({ 
    pdfFileBuffer, 
    pdfFile, 
    row, 
    rowIndex, 
    labels, 
    fileNameTemplate,
    variables,
    returnBytes = false 
  }) => {
    setIsExporting(true);

    try {
      console.log(`Exporting PDF for row ${rowIndex}...`);

      const fileName = fileNameTemplate.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        const value = variables[trimmedKey];
        return value !== undefined ? value : match;
      });

      const result = await exportPdf({
        pdfFileBuffer,
        row,
        labels,
        fileName,
        returnBytes
      });

      return result;
    } catch (error) {
      console.error("Error during PDF export:", error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportSingleRow
  };
}

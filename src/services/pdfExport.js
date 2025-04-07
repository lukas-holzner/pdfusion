import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';

export async function exportPdf({ pdfFileBuffer, row, labels, fileName, returnBytes = false }) {
  const pdfDoc = await PDFDocument.load(pdfFileBuffer);
  const pages = pdfDoc.getPages();

  // Embed fonts
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
  };

  // Process each page
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize(); // Get page dimensions
    const pageLabels = labels.filter(label => label.pageIndex === pageIndex);

    for (const label of pageLabels) {
      const value = row[label.text] || `{${label.text}}`;
      const selectedFont = selectFont(fonts, label);

      // Convert relative coordinates to absolute PDF points
      const pointX = label.relativeX * pageWidth;
      // PDF Y-coordinate originates at the bottom, so subtract from height
      const pointY = pageHeight - (label.relativeY * pageHeight); 
      
      // Use the original font size - no need to scale as PDF coordinates are absolute
      const fontSize = label.fontSize;

      page.drawText(value.toString(), {
        x: pointX,
        y: pointY - fontSize, // Adjust for baseline
        font: selectedFont,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  
  if (returnBytes) {
    return pdfBytes;
  }
  
  saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${fileName}.pdf`);
}

function selectFont(fonts, label) {
  if (label.fontWeight === 'bold' && label.fontStyle === 'italic') {
    return fonts.boldItalic;
  } else if (label.fontWeight === 'bold') {
    return fonts.bold;
  } else if (label.fontStyle === 'italic') {
    return fonts.italic;
  }
  return fonts.regular;
}

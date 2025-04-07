Goal: Create a web application that allows users to upload a PDF template and a data file (Excel/CSV/JSON), visually place data fields onto the PDF, style them, and then batch-generate filled PDFs for each row of data, all running within the user's browser.

Core Features:

File Upload: Separate upload inputs for the PDF template and the data file (CSV, Excel, JSON support). Clipboard paste for data is a potential enhancement.

PDF Preview: Display the uploaded PDF visually.

Data Table View: Display the parsed data in a table format.

Label Creation: Use data table headers as available labels/placeholders.

Visual Templating: Drag and drop labels from the table header onto the PDF preview to define data placement.

Label Positioning: Allow precise positioning of placed labels on the PDF.

Label Styling:Clicking a placed label reveals a formatting toolbar/menu.

Options: Font family (including custom uploaded fonts), font size, bold, italic.

Live preview of style changes on the label in the PDF preview.

Custom Font Support: Allow users to upload custom font files (e.g., TTF, OTF, WOFF) to be used in the templates.

Batch Export: Generate and download a separate, filled PDF document for each row in the data table, applying the defined template (label positions and styles).

Client-Side Operation: All parsing, rendering, manipulation, and generation happen in the browser.

Proposed Technology Stack:

Frontend Framework: React (or Vue/Svelte). Provides component structure, state management, and efficient UI updates needed for interactivity.

PDF Manipulation (Client-Side): pdf-lib. A powerful JavaScript library for creating and modifying PDF documents directly in the browser. It supports adding text, embedding standard and custom fonts (TTF/OTF), and drawing.

Data Parsing (Client-Side):CSV: PapaParse. Reliable and easy-to-use CSV parser.

Excel: SheetJS (js-xlsx). The standard for reading and writing Excel files in JavaScript.

JSON: Native JSON.parse().

Drag and Drop: HTML5 Drag and Drop API. Can be used directly or via a framework-specific library (e.g., react-dnd for React) for better integration.

File Download/Saving: FileSaver.js (or native Blob/URL methods) to trigger downloads for the generated PDFs. Consider JSZip if offering a single zip download for multiple PDFs.

Styling: CSS / CSS Modules / Styled-Components / Tailwind CSS. Choose based on preference.

Component Breakdown (Conceptual - React Example):

App.js:

Main application container.

Manages global state (uploaded PDF, parsed data, placed labels configuration, selected fonts).

Orchestrates interactions between components.

Header.js:

Contains file upload components.

FileUpload.js (reusable): Handles file input logic for PDF and Data files, passing file objects up to App.js. Could include logic for paste detection.

CustomFontUpload.js: Handles uploading custom font files.

MainLayout.js:

Two-column layout (Data Panel on left, PDF Panel on right).

DataPanel.js:

Displays the data table.

DataTable.js: Renders the parsed data. Uses table headers for labels.Makes table headers (<th> elements) draggable, passing the header name (label key) in the drag data.

PdfPanel.js:

Manages the PDF preview area.

PdfPreview.js:Uses pdf-lib to render the uploaded PDF onto a <canvas> element.

Handles drop events from DataTable.js headers to create new labels.

Renders PlacedLabel.js components onto the preview area based on state.

PlacedLabel.js:Represents a label dropped onto the PDF preview.

Visually displays the label text (e.g., {Column Name}).

Is draggable itself for repositioning.

Applies font styles (size, bold, italic, family) based on its configuration.

On click, triggers the display of FontSettingsMenu.js.

FontSettingsMenu.js:A small popup/toolbar appearing near the clicked label.

Contains inputs/buttons for font family (dropdown including custom fonts), size, bold toggle, italic toggle.

Updates the state for the corresponding label on change.

ExportControls.js:

Contains the "Export All PDFs" button.

Triggers the batch generation process.

Workflow Logic:

Initialization: User loads the web app. UI shows upload areas.

Upload PDF: User selects PDF. FileUpload reads it as an ArrayBuffer. App.js stores it. PdfPreview uses pdf-lib.PDFDocument.load() and renders the first page to canvas.

Upload Data: User selects CSV/XLSX/JSON. FileUpload reads it. App.js uses PapaParse/SheetJS/JSON.parse to get headers and row data, storing it. DataPanel displays the table.

Place Label: User drags a header from DataTable onto PdfPreview.onDrop event in PdfPreview captures coordinates and the dragged header name.

App.js adds a new label configuration to the state: { id: uuid(), key: 'HeaderName', x: pdfX, y: pdfY, font: 'Helvetica', size: 12, bold: false, italic: false }. (pdfX, pdfY are coordinates relative to the PDF page).

PdfPreview re-renders, showing the new PlacedLabel.

Style Label: User clicks a PlacedLabel. FontSettingsMenu appears. User changes settings. Menu updates the corresponding label's configuration in the App.js state. PlacedLabel visually updates.

(Optional) Upload Font: User uploads a font file. CustomFontUpload reads it as ArrayBuffer. App.js stores the font name and buffer. Font name added to dropdown in FontSettingsMenu.

Export: User clicks "Export All PDFs".ExportControls initiates the process in App.js.

Loop through each dataRow in the stored data.

Inside the loop:Load the original PDF template ArrayBuffer using pdf-lib.PDFDocument.load().

Get the first page (or relevant page).

Load any custom fonts needed for this template using pdfDoc.embedFont() with the stored ArrayBuffer. pdf-lib also handles standard fonts like Helvetica, Times Roman.

Iterate through each labelConfig in the state.

Get the text value for labelConfig.key from the current dataRow.

Determine the font object (standard or embedded custom) based on labelConfig.font.

Use page.drawText(textValue, { x: labelConfig.x, y: labelConfig.y, font: fontObject, size: labelConfig.size, /* handle bold/italic potentially via different font weights if available or approximation */ }). Note: pdf-lib doesn't directly support bold/italic styles on arbitrary fonts easily; often requires embedding the bold/italic variants of the font if available. Standard fonts have variants built-in (StandardFonts.HelveticaBold).

After adding all text for the row, serialize the PDF: const pdfBytes = await pdfDoc.save().

Trigger download using FileSaver.saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), \output_row_${rowIndex}.pdf`)`.

Provide user feedback (progress indicator). Consider zipping if > ~10 files.

Key Considerations:

Coordinate Systems: Carefully manage coordinates between browser pixels (canvas) and PDF points (pt). pdf-lib uses PDF coordinates (origin typically bottom-left).

Performance: Client-side PDF generation can be CPU-intensive, especially for many rows or complex PDFs. Use web workers for the export process to avoid freezing the UI. Provide progress feedback.

Font Embedding: Ensure pdf-lib correctly embeds custom fonts for them to render properly on different viewers. Standard fonts don't need embedding but must be available on the viewing system (usually fine). Bold/Italic might require specific font files (e.g., MyFont-Bold.ttf).

Large Data/PDFs: Very large Excel files or complex PDFs might hit browser memory limits during parsing or rendering.

Error Handling: Robustly handle file parsing errors, PDF loading issues, etc.

UI/UX: Make the drag-and-drop intuitive. Provide clear visual feedback for placed labels and styling.

This detailed plan provides a solid foundation for building your client-side PDF templating application



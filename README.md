# PDFusion

[![React](https://img.shields.io/badge/react-19.0.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-4.1.3-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-development-orange.svg)]()

A powerful web application that fuses PDFs with your data. Upload a PDF template and CSV/JSON data, visually place fields on the PDF, and generate customized PDFs for each data row.

## Features

- **PDF Template Upload**: Upload any PDF to use as a template
- **Data Import**: Support for CSV and JSON data files
- **Visual Editor**: 
  - Drag and drop fields from your data onto the PDF
  - Live preview of label placement
  - Dark mode support
- **Label Customization**:
  - Font family selection
  - Font size control
  - Bold/Italic styling
  - Precise positioning
- **Export Options**:
  - Generate single PDFs
  - Batch export all records
  - Customizable file naming
  - Email integration
- **Persistence**: Layout and settings are saved to localStorage

## Technology Stack

- **Frontend**: React with Vite
- **Styling**: Tailwind CSS
- **PDF Processing**:
  - pdf-lib: PDF generation
  - pdf.js: PDF rendering
- **Data Processing**: 
  - PapaParse: CSV parsing
  - Native JSON support
- **File Handling**: 
  - FileSaver.js: File downloads
  - JSZip: Batch exports

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## Usage

1. Upload a PDF template using the "Upload PDF Template" button
2. Import your data using the "Upload Data" button (CSV or JSON)
3. Drag column headers from the data preview onto the PDF where you want them to appear
4. Click placed labels to adjust their font, size, and style
5. Export individual PDFs or generate all records at once

## Project Structure

```
src/
├── components/           # React components
│   ├── DataTable.jsx    # Data preview table
│   ├── FileUpload.jsx   # File upload handlers
│   ├── Label.jsx        # Draggable PDF labels
│   ├── PDFViewer.jsx    # PDF display and interaction
│   └── ...
├── services/            # Business logic
│   └── pdfExport.js     # PDF generation
├── hooks/               # Custom React hooks
├── App.jsx             # Main application
└── main.jsx           # Entry point
```

## Key Features Explained

### PDF Templating
- Labels store their position relative to PDF dimensions
- Supports standard fonts with bold/italic variants
- Real-time preview of changes

### Data Management
- Automatic header detection from CSV/JSON
- Drag-and-drop interface for mapping fields
- Data preview table with draggable headers

### Export System
- Single PDF generation for testing
- Batch processing for all records
- Progress feedback during generation
- ZIP compression for large batches

### Email Integration
- Customizable email templates
- Variable substitution
- Local email client integration

## Local Storage

The application persists:
- PDF template configurations
- Label positions and styles
- Email templates
- Theme preference

## Limitations

- Client-side processing may be limited by browser memory
- Complex PDFs may impact performance
- Custom font support requires the specific font files

## Future Improvements

- Excel file support
- Custom font uploading
- Web worker for PDF processing
- Template saving/loading

## Deployment

This project is automatically deployed to GitHub Pages using GitHub Actions. Every push to the main branch triggers a new build and deployment.

To set up GitHub Pages deployment:

1. Enable GitHub Pages in your repository settings
2. Select "GitHub Actions" as the source
3. The site will be available at: https://[username].github.io/[repository-name]/



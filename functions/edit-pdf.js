// This is a Netlify serverless function.
// It receives a list of pages and source files to assemble a new PDF.

const { PDFDocument } = require('pdf-lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { pages, sources } = JSON.parse(event.body);

    if (!pages || !sources) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing page instructions or source files.' }) };
    }

    const finalPdf = await PDFDocument.create();

    // Create a map of loaded PDF documents to avoid reloading the same file
    const loadedPdfDocs = new Map();

    for (const pageInstruction of pages) {
        const sourceName = pageInstruction.sourceName;
        const sourceDataUrl = sources[sourceName];
        if (!sourceDataUrl) continue;

        const base64Data = sourceDataUrl.split(',')[1];
        const bytes = Buffer.from(base64Data, 'base64');

        if (pageInstruction.type === 'pdf-page') {
            let sourceDoc;
            if (loadedPdfDocs.has(sourceName)) {
                sourceDoc = loadedPdfDocs.get(sourceName);
            } else {
                sourceDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
                loadedPdfDocs.set(sourceName, sourceDoc);
            }
            const [copiedPage] = await finalPdf.copyPages(sourceDoc, [pageInstruction.pageIndex]);
            finalPdf.addPage(copiedPage);

        } else if (pageInstruction.type === 'image') {
            let image;
            if (sourceDataUrl.startsWith('data:image/jpeg')) {
                image = await finalPdf.embedJpg(bytes);
            } else { // Assumes PNG
                image = await finalPdf.embedPng(bytes);
            }
            const page = finalPdf.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
    }

    const finalPdfBytes = await finalPdf.save();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdf: Buffer.from(finalPdfBytes).toString('base64')
      }),
    };
  } catch (error) {
    console.error('PDF Editor function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not process the PDF editing request.' }),
    };
  }
};


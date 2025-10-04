// This is a Netlify serverless function.
// It uses the 'pdf-lib' library to re-save a PDF, which can help reduce file size.

const { PDFDocument } = require('pdf-lib');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { pdf } = JSON.parse(event.body);

    if (!pdf) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing PDF data.' }) };
    }
    
    const base64Data = pdf.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    // Load and re-save the PDF. This simple process can often reduce size.
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pdfBytes = await pdfDoc.save();
    const compressedPdfBuffer = Buffer.from(pdfBytes);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdf: compressedPdfBuffer.toString('base64'),
        newSize: compressedPdfBuffer.length
      }),
    };
  } catch (error) {
    console.error('PDF compression error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not process the PDF file.' }),
    };
  }
};


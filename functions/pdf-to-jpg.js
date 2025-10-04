// This is a Netlify serverless function.
// It uses the 'sharp' library to robustly convert PDF pages to JPG images.
// Updated to handle more complex PDFs and increase memory.

const sharp = require('sharp');

// Increase the memory limit for this function
// Vercel and Netlify will respect this configuration.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow larger file uploads
    },
  },
  memory: 1024, // Allocate 1GB of memory
  maxDuration: 30, // Extend timeout to 30 seconds
};

exports.handler = async (event) => {
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
    
    // Use sharp with density to improve rendering quality for complex PDFs
    const metadata = await sharp(pdfBuffer).metadata();
    const pageCount = metadata.pages || 0;
    
    if (pageCount === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Could not find any pages in the PDF.' }) };
    }

    const images = [];
    // Process pages sequentially to conserve memory on large files
    for (let i = 0; i < pageCount; i++) {
        const imageBuffer = await sharp(pdfBuffer, { page: i, density: 300 }) // Increase density for better quality
            .jpeg({ quality: 90 })
            .toBuffer();
        
        images.push(imageBuffer.toString('base64'));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    };
  } catch (error) {
    console.error('PDF to JPG conversion error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to convert PDF to JPG. The file may be corrupt or unsupported.' }),
    };
  }
};


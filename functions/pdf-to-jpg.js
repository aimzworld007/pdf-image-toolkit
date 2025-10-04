// This is a Netlify serverless function.
// It uses the 'sharp' library to robustly convert PDF pages to JPG images.

const sharp = require('sharp');

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
    
    // Use sharp to get metadata, specifically the number of pages
    const metadata = await sharp(pdfBuffer).metadata();
    const pageCount = metadata.pages || 0;

    if (pageCount === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Could not find any pages in the PDF.' }) };
    }

    const imagePromises = [];

    // Iterate through pages and create a conversion promise for each
    for (let i = 0; i < pageCount; i++) {
        imagePromises.push(
            sharp(pdfBuffer, { page: i })
                .jpeg({ quality: 90 })
                .toBuffer()
                .then(buffer => buffer.toString('base64'))
        );
    }

    const images = await Promise.all(imagePromises);

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


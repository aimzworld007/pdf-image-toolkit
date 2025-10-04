// This is a Netlify serverless function.
// It uses the 'sharp' library for high-quality image compression.

const sharp = require('sharp');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { image, quality } = JSON.parse(event.body);
    
    // Basic validation
    if (!image || !quality) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing image data or quality setting.' }) };
    }

    // Strip the data URL prefix to get raw base64 data
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Use sharp to compress the image
    const compressedImageBuffer = await sharp(imageBuffer)
      .jpeg({
        quality: quality,
        progressive: true,
        optimizeScans: true,
      })
      .toBuffer();

    // Return the compressed image as a base64 string
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: compressedImageBuffer.toString('base64'),
        newSize: compressedImageBuffer.length
      }),
    };
  } catch (error) {
    console.error('Sharp compression error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not process the image.' }),
    };
  }
};


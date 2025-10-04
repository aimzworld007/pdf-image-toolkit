// This is a Netlify serverless function.
// It uses the '@imgly/background-removal-node' library to remove image backgrounds.

const { removeBackground } = require('@imgly/background-removal-node');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { image } = JSON.parse(event.body);
    if (!image) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing image data.' }) };
    }

    // The library expects a Blob, Buffer, or URL. We'll give it the data URL.
    const imageBlob = await fetch(image).then(res => res.blob());

    const resultBlob = await removeBackground(imageBlob);

    // Convert the result Blob back to a base64 string to send to the client
    const arrayBuffer = await resultBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64String
      }),
    };
  } catch (error) {
    console.error('Background removal error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not remove background from the image.' }),
    };
  }
};


PDF & Image Toolkit Pro
A versatile, all-in-one web application for all your PDF and image manipulation needs. This toolkit combines a suite of powerful client-side and server-side tools into a single, intuitive, tab-based interface with a sleek dark/light mode.

Live Demo
You can access the live version of this application here:
[Your Netlify URL will go here]

✨ Key Features
This application is packed with a wide range of tools, categorized for ease of use.

🖼️ Image Tools
Compress JPG (Pro): Utilizes a powerful server-side function with the sharp library to provide superior, high-quality JPG compression.

Resize Image: Easily change the dimensions of any image, with an option to maintain the aspect ratio.

Crop Image: An interactive, easy-to-use interface for cropping images with a live preview.

Merge Images: Combine two images together, either vertically or horizontally.

JPG to PNG Converter: Instantly convert JPG files to PNG format.

PNG to JPG Converter: Instantly convert PNG files to JPG format, with an option to handle transparency.

📄 PDF Tools
PDF to JPG (Pro): A robust, server-side tool that can quickly extract every page from large or complex PDFs into high-quality JPG images without crashing the browser.

Merge to PDF: A powerful utility to combine multiple files (PDFs, JPGs, and PNGs) into a single, unified PDF document. Includes drag-and-drop reordering.

Compress PDF (Pro): Reduce the file size of your PDFs using a server-side function, ideal for documents with many images.

JPG to PDF: Quickly convert a single JPG image into a PDF file.

Images to PDF: Select and reorder multiple images to combine them into one PDF document.

🚀 General Features
Tab-Based Interface: A modern, fast-switching tab navigation inspired by leading web applications.

Universal Drag & Drop: An intuitive drag-and-drop file upload zone for every tool.

Dark/Light Mode: A beautiful and responsive theme toggle that respects and saves user preference.

Client & Server-Side Power: Combines the privacy of client-side processing for simple tasks with the power of serverless functions for intensive operations.

Live Previews: See previews of your files before combining them, including for PDFs and images.

Tool Suggestions: Each tool provides contextually relevant suggestions to help users discover other useful features.

Fully Responsive: A clean and modern UI that works flawlessly on desktop, tablet, and mobile devices.

🛠️ Technologies Used
Frontend
HTML5

Tailwind CSS: For a modern, utility-first design.

JavaScript (ES6+): For all client-side logic and interactivity.

Libraries:

pdf-lib.js: For client-side PDF creation and manipulation.

pdf.js: For rendering PDF previews in the browser.

cropper.js: For the interactive image cropping tool.

Backend (Serverless Functions on Netlify)
Node.js

Sharp: A high-performance Node.js image processing library used for top-tier JPG compression and PDF-to-JPG conversion.

pdf-lib: Used on the server for robust PDF compression.

🚀 Deployment
This project is optimized for easy deployment on Netlify.

Required File Structure
For Netlify to correctly deploy the serverless functions, your project repository must follow this exact structure:

|   |-- functions/
|       |-- compress-jpg.js
|       |-- compress-pdf.js
|       |-- pdf-to-jpg.js
|-- index.html
|-- package.json

Steps to Deploy:
Upload to GitHub: Create a new GitHub repository and upload all the project files, making sure to maintain the folder structure shown above.

Connect to Netlify:

Log in to your Netlify account.

Click "Add new site" -> "Import an existing project".

Connect to GitHub and select the repository you just created.

Deploy: Netlify will automatically detect your package.json and the netlify/functions directory. The default settings should work perfectly. Simply click "Deploy site".

Netlify will install the server-side dependencies (sharp, pdf-lib) and deploy your functions, making the "Pro" features fully operational.

💻 Local Development
You can open the index.html file in any modern web browser to test the client-side features.

Important Note: The "Pro" features (Compress JPG, Compress PDF, PDF to JPG) will not work when you open the file locally. They require the Netlify server environment to run. The browser console will show a "Failed to parse URL" error, which is expected in a local environment. To test these features, you must deploy the site to Netlify.

© Credits
This application was developed by Ainul islam with the assistance of Gemini.
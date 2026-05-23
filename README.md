# PDF & Image Toolkit (Next.js)

A modern Next.js app for PDF and image utilities with no login/registration.

## Included Tools

- Merge Images
- Compress JPG
- Resize Image
- Resize By File Size (target KB)
- Crop Image
- Image Converter (PNG/JPG)
- Image Enhance (brightness/contrast/saturation/sharpness)
- JPG to PDF
- PDF to JPG
- Combine PDFs & Images
- Images to PDF
- PDF Page Studio (remove/reorder/add blank/add image pages)
- PDF Compress / Optimize
- Print Photo PDF (auto-grid passport photos on A4/Letter)
- EID Lamination Tool (front/back high-DPI workflow + A4 export)

## Tech Stack

- Next.js 15 (App Router)
- React 19
- pdf-lib
- PDF.js (loaded from CDN at runtime for page rendering)

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## App Structure

- `/` Home (3 main categories)
- `/image-tools` Image tools workspace
- `/pdf-tools` PDF tools workspace
- `/lamination-tools` Lamination tools workspace

Tools open with URL query routing, e.g. `/pdf-tools?tool=pdf-workbench`.

## Production Build

```bash
npm run build
npm run start
```

## Notes

- All editing/conversion is done client-side in the browser.
- Legacy static files (`index.html`, `index- eid.html`) are kept in repo as reference, but the Next.js app is now the primary UI.

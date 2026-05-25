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
- Background Remover
- QR Code Generator (PNG/PDF export)
- JPG to PDF
- PDF to JPG
- Extract Images From PDF (ZIP download)
- Combine PDFs & Images
- Images to PDF
- PDF Page Studio (remove/reorder/add blank/add image pages)
- Certificate / Form Filler
- PDF Compress / Optimize
- Print Photo PDF (auto-grid passport photos on A4/Letter)
- Passport Photo Maker (country presets, background color, size presets)
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

- `/` Home (4 main categories)
- `/image-tools` Image tools workspace
- `/pdf-tools` PDF tools workspace
- `/lamination-tools` Lamination tools workspace
- `/photo-print-tools` Photo print tools workspace
- `/image-tools/[tool]`, `/pdf-tools/[tool]`, `/lamination-tools/[tool]`, `/photo-print-tools/[tool]` direct tool routes

Tools open with direct routes, e.g. `/pdf-tools/pdf-workbench`. Legacy query routing still works, e.g. `/pdf-tools?tool=pdf-workbench`.

Tool code is split by component:

- `components/ToolkitApp.jsx` lightweight category/router shell
- `components/toolkit/toolRegistry.js` tool metadata and category paths
- `components/toolkit/shared.jsx` shared UI and browser-side helper utilities
- `components/toolkit/tools/*.jsx` one component per tool

## Production Build

```bash
npm run build
npm run start
```

## Notes

- All editing/conversion is done client-side in the browser.
- Legacy static files (`index.html`, `index- eid.html`) are kept in repo as reference, but the Next.js app is now the primary UI.

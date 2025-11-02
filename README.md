# SVG to Favicon Bundle Generator

A modern, lightweight web app that converts SVG files into complete high-resolution favicon bundles for all platforms.

## Features

- **High-Resolution Output**: Generates favicons up to 512×512 pixels
- **Multi-Format Support**: Creates ICO file with 6 embedded sizes (16×16 to 256×256)
- **Complete Bundle**: Includes all necessary files:
  - `favicon.ico` (multi-size)
  - Multiple PNG files (16×16, 32×32, 96×96, 192×192, 512×512)
  - `apple-touch-icon.png` (180×180)
  - Android Chrome icons (192×192, 512×512)
  - `manifest.json` for Progressive Web Apps
  - `README.md` with installation instructions
- **One-Click Download**: Everything packaged as a ZIP file
- **Dark Mode Support**: Beautiful UI with theme toggle
- **No Dependencies**: Runs entirely in the browser, no server required

## Tech Stack

- React 19 + TypeScript
- Vite for blazing fast builds
- Tailwind CSS 4 + shadcn/ui components
- JSZip for bundle creation

## Getting Started

### Development

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

### Deployment

The `dist` folder contains static files ready to deploy to any hosting service (Vercel, Netlify, GitHub Pages, etc.).

## Usage

1. Upload an SVG file
2. Preview your icon
3. Click "Download Bundle (.zip)"
4. Extract and copy files to your website's root directory
5. Add the HTML snippet from the included README to your `<head>` tag

## Before Deploying

- [ ] Add a favicon to `/public/favicon.ico` (use your own tool!)
- [ ] Update Open Graph image URL in `index.html` if needed
- [ ] Test with various SVG files
- [ ] Run `npm run build` to ensure no errors

## License

MIT

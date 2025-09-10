# Waylight Icon Generation

This directory contains the icon assets for the Waylight PWA app.

## Files Created

### SVG Icons (Vector)
- `icon.svg` - Base scalable icon
- `icon-192.svg` - 192x192 sized version
- `icon-512.svg` - 512x512 sized version  
- `favicon.svg` - Simplified favicon version

### HTML Generator
- `generate-icons.html` - Browser-based PNG generator

### PWA Configuration
- `manifest.json` - Web app manifest for PWA installation

## Design Concept

The Waylight icon features:
- **Minimal sailboat**: Geometric representation with hull, mast, and sails
- **Light beam effect**: Subtle golden rays suggesting navigation/guidance
- **Color palette**:
  - Primary: `#0F172A` (Ink - dark navy for text/icons)
  - Accent: `#0EA5A8` (Sea - teal for interactive elements)  
  - Background: `#F8FAFC` (Surface - light gray background)
  - Highlight: `#FBBF24` (Glow - golden yellow for light beams)

## Generating PNG Files

### Method 1: Browser Generator (Recommended)
1. Open `generate-icons.html` in any modern web browser
2. Click the download buttons for each required size:
   - `icon-192.png` (192x192) - PWA icon
   - `icon-512.png` (512x512) - PWA icon  
   - `apple-touch-icon.png` (180x180) - iOS touch icon
   - `favicon-32.png` (32x32) - Browser favicon

### Method 2: Online SVG Converters
Upload the SVG files to online converters like:
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [SVG2PNG](https://svg2png.com)
- [Convertio](https://convertio.co/svg-png/)

### Method 3: Command Line Tools
If you have ImageMagick installed:
```bash
magick icon-192.svg icon-192.png
magick icon-512.svg icon-512.png
magick favicon.svg -resize 32x32 favicon-32.png
magick icon.svg -resize 180x180 apple-touch-icon.png
```

## Required Files for PWA

After generating PNGs, ensure these files exist in `/public`:
- ✅ `manifest.json`
- ⏳ `icon-192.png`  
- ⏳ `icon-512.png`
- ⏳ `apple-touch-icon.png` 
- ⏳ `favicon.ico` (convert from favicon-32.png)

## HTML Integration

Add to your `index.html` `<head>`:
```html
<link rel="manifest" href="/manifest.json">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0EA5A8">
```

## Icon Sizes Reference

- **Favicon**: 16x16, 32x32, 48x48
- **PWA**: 192x192, 512x512
- **Apple Touch**: 180x180, 167x167, 152x152, 120x120
- **Android**: 36x36, 48x48, 72x72, 96x96, 144x144, 192x192

The SVG files are scalable and can be converted to any of these sizes as needed.
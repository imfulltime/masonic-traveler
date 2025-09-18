#!/usr/bin/env node

/**
 * Create PWA Icons Script
 * Generates simple placeholder icons for the PWA
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0ea5e9"/>
  <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" fill="white" stroke="#0ea5e9" stroke-width="2"/>
  <text x="${size / 2}" y="${size / 2 + size * 0.05}" text-anchor="middle" fill="#0ea5e9" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold">MT</text>
</svg>`;
};

// Convert SVG to data URL (for simple placeholder)
const svgToDataURL = (svgString) => {
  return `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
};

// Create simple PNG-like content using Canvas API simulation
const createSimplePNG = (size) => {
  // For now, we'll create a simple data structure that browsers can use
  // In a real app, you'd use a proper image generation library
  return createSVGIcon(size);
};

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create required icon sizes
const iconSizes = [144, 152, 192, 512];

console.log('🎨 Creating PWA icons...\n');

iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Created: ${filename}`);
});

// Also create PNG versions using SVG content
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // For quick fix, we'll copy SVG content as PNG
  // Browsers can often handle SVG in place of PNG for simple icons
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Created: ${filename} (SVG format)`);
});

console.log('\n🎉 PWA icons created successfully!');
console.log('\nNote: These are placeholder SVG icons. For production, consider using:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://www.pwabuilder.com/imageGenerator');
console.log('- Professional design tools like Figma or Adobe Illustrator');

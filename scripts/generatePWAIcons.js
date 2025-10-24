#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * This script creates placeholder icons for PWA development
 * In production, replace these with properly designed icons
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder SVG icon
const createPlaceholderSVG = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white" opacity="0.9"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold" fill="#2563eb" text-anchor="middle" dominant-baseline="middle">eC</text>
</svg>`;
};

// Generate icons
console.log('🎨 Generating PWA icons...\n');

iconSizes.forEach(size => {
  const fileName = `icon-${size}x${size}.svg`;
  const filePath = path.join(iconsDir, fileName);
  const svgContent = createPlaceholderSVG(size);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created ${fileName}`);
});

// Create special icons for shortcuts
const shortcutIcons = ['book-appointment', 'appointments', 'dashboard'];
shortcutIcons.forEach(name => {
  const fileName = `${name}.svg`;
  const filePath = path.join(iconsDir, fileName);
  const svgContent = createPlaceholderSVG(192);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created ${fileName}`);
});

// Create apple-touch-icon
const appleTouchIcon = `icon-192x192.svg`;
fs.copyFileSync(
  path.join(iconsDir, appleTouchIcon),
  path.join(__dirname, '../public/apple-touch-icon.svg')
);
console.log('✅ Created apple-touch-icon.svg');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, '../public/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log('✅ Created screenshots directory');
}

// Create placeholder screenshots
const screenshots = ['dashboard', 'booking', 'appointments'];
screenshots.forEach(name => {
  const fileName = `${name}.svg`;
  const filePath = path.join(screenshotsDir, fileName);
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="#f3f4f6"/>
  <rect x="40" y="40" width="1200" height="640" fill="white" rx="8"/>
  <text x="640" y="360" font-family="Arial, sans-serif" font-size="48" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">${name.charAt(0).toUpperCase() + name.slice(1)} Screenshot</text>
</svg>`;
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created ${fileName} screenshot`);
});

console.log('\n🎉 PWA icons generated successfully!');
console.log('📝 Note: Replace these placeholder icons with actual designed icons for production.');

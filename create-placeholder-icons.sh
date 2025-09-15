#!/bin/bash

# Create placeholder icons for Byzand MSSQL Client
# This script creates simple placeholder files that can be replaced with actual icons

echo "Creating placeholder icon files..."

# Create a simple SVG icon (can be converted to PNG/ICO)
cat > assets/icon.svg << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" fill="#667eea" rx="64"/>
  
  <!-- Database icon -->
  <ellipse cx="256" cy="180" rx="120" ry="40" fill="#ffffff" opacity="0.9"/>
  <ellipse cx="256" cy="256" rx="120" ry="40" fill="#ffffff" opacity="0.7"/>
  <ellipse cx="256" cy="332" rx="120" ry="40" fill="#ffffff" opacity="0.5"/>
  
  <!-- Connection lines -->
  <line x1="256" y1="180" x2="256" y2="332" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
  
  <!-- Text -->
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
        text-anchor="middle" fill="#ffffff">Byzand</text>
</svg>
EOF

echo "✅ Created assets/icon.svg"

# Create instructions for converting to other formats
cat > assets/convert-icons.md << 'EOF'
# Converting SVG to Required Formats

## Convert SVG to PNG (512x512)
```bash
# Using Inkscape
inkscape --export-type=png --export-filename=icon.png --export-width=512 --export-height=512 icon.svg

# Using ImageMagick
convert icon.svg -resize 512x512 icon.png
```

## Convert PNG to ICO (Windows)
```bash
# Using ImageMagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Online converters:
# - https://icoconvert.com/
# - https://converticon.com/
```

## Convert PNG to ICNS (macOS)
```bash
# Using ImageMagick
convert icon.png -define icon:auto-resize=1024,512,256,128,64,32,16 icon.icns

# Online converters:
# - https://cloudconvert.com/png-to-icns
```

## Quick Setup
1. Install ImageMagick: `sudo apt install imagemagick`
2. Run: `convert assets/icon.svg -resize 512x512 assets/icon.png`
3. Run: `convert assets/icon.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico`
EOF

echo "✅ Created assets/convert-icons.md"

# Create a simple text-based icon for immediate use
cat > assets/icon-info.txt << 'EOF'
Byzand MSSQL Client Icon

This is a placeholder. To create proper icons:

1. Design a 512x512 icon with:
   - Database/SQL theme
   - Byzand branding
   - Modern, clean design
   - Professional colors

2. Convert to required formats:
   - icon.png (512x512) for Linux
   - icon.ico (multiple sizes) for Windows
   - icon.icns (optional) for macOS

3. Replace this file with actual icon files

Suggested design elements:
- Database cylinder or server icon
- SQL/query symbols
- Modern gradient colors
- Clean typography
- Professional appearance
EOF

echo "✅ Created assets/icon-info.txt"

echo ""
echo "🎨 Placeholder icons created!"
echo ""
echo "Next steps:"
echo "1. Design a proper icon (512x512 PNG)"
echo "2. Convert to ICO format for Windows"
echo "3. Replace the placeholder files"
echo "4. Run the build script: ./build-installers.sh"
echo ""
echo "See assets/convert-icons.md for conversion instructions."


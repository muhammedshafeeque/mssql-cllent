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

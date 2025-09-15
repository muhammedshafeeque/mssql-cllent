# Assets for Byzand MSSQL Client

This directory contains the assets needed for creating installers.

## Required Files

### Icons
- `icon.png` - 512x512 PNG icon for Linux
- `icon.ico` - Windows icon file (multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
- `icon.icns` - macOS icon file (for future macOS support)

### Installer Assets
- `loading.gif` - Loading animation for Windows installer (optional)
- `desktop.ejs` - Desktop file template for Linux

## Creating Icons

### For Linux (icon.png)
Create a 512x512 PNG icon with the Byzand logo. You can use:
- GIMP
- Inkscape
- Online icon generators
- AI image generators

### For Windows (icon.ico)
Create an ICO file with multiple sizes. You can:
1. Create a 512x512 PNG first
2. Use online ICO converters
3. Use tools like IcoFX or GIMP with ICO plugin

### For macOS (icon.icns)
Create an ICNS file. You can:
1. Create a 1024x1024 PNG first
2. Use online ICNS converters
3. Use tools like Icon Composer or online converters

## Desktop Template

The `desktop.ejs` file is used to create the Linux desktop entry. It should contain:

```ini
[Desktop Entry]
Name=<%= productName %>
Comment=<%= description %>
Exec=<%= exec %>
Icon=<%= icon %>
Terminal=false
Type=Application
Categories=<%= categories.join(';') %>;
StartupWMClass=<%= productName %>
```

## Notes

- All icon files should represent the Byzand MSSQL Client brand
- Use consistent colors and design across all icon formats
- Ensure icons are clear and recognizable at small sizes
- Consider using a database or SQL-related icon design


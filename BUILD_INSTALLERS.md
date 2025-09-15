# Building Byzand MSSQL Client Installers

This guide explains how to create .deb (Linux) and .exe (Windows) installers for the Byzand MSSQL Client application.

## Prerequisites

1. **Node.js and npm** - Already installed
2. **Electron Forge** - Already configured
3. **Icon Files** - Need to be created (see Assets section below)

## Quick Start

### Build All Installers
```bash
npm run build:installers
```

### Build Specific Installers
```bash
# Linux .deb installer
npm run make:deb

# Windows .exe installer
npm run make:exe
```

## Assets Required

Before building installers, you need to create the following icon files in the `assets/` directory:

### 1. Linux Icon (icon.png)
- **Size**: 512x512 pixels
- **Format**: PNG
- **Purpose**: Used in Linux desktop environments and package managers

### 2. Windows Icon (icon.ico)
- **Sizes**: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 pixels
- **Format**: ICO
- **Purpose**: Used in Windows installer and application

### 3. Optional: Loading Animation (loading.gif)
- **Size**: 400x300 pixels (recommended)
- **Format**: GIF
- **Purpose**: Shown during Windows installer setup

## Creating Icons

### Method 1: Online Icon Generators
1. Create a 512x512 PNG design
2. Use online converters:
   - [ICO Convert](https://icoconvert.com/)
   - [ConvertICO](https://converticon.com/)
   - [Favicon Generator](https://www.favicon-generator.org/)

### Method 2: Design Tools
1. **GIMP** (Free)
   - Create 512x512 PNG
   - Export as ICO using ICO plugin
   
2. **Inkscape** (Free)
   - Create vector design
   - Export as PNG at different sizes
   - Convert to ICO

3. **Adobe Illustrator/Photoshop**
   - Create high-resolution design
   - Export at multiple sizes
   - Use built-in ICO export

### Method 3: AI Image Generators
- Use DALL-E, Midjourney, or Stable Diffusion
- Prompt: "Database icon, SQL server icon, modern, clean, professional, 512x512"
- Convert generated image to required formats

## Building Process

### 1. Prepare Assets
```bash
# Ensure you have the required icon files
ls assets/
# Should show: icon.png, icon.ico, desktop.ejs
```

### 2. Build Installers
```bash
# Build all platforms
npm run build:installers

# Or build specific platform
npm run make:deb    # Linux .deb
npm run make:exe    # Windows .exe
```

### 3. Output Location
Installers will be created in:
```
out/make/
├── deb/x64/
│   └── byzand_1.0.0_amd64.deb
├── squirrel.windows/
│   └── Byzand-Setup.exe
└── rpm/x64/
    └── byzand-1.0.0-1.x86_64.rpm
```

## Installer Features

### Linux .deb Installer
- **File**: `byzand_1.0.0_amd64.deb`
- **Features**:
  - Desktop integration
  - Application menu entry
  - Dependency management
  - Uninstall support
- **Install**: `sudo dpkg -i byzand_1.0.0_amd64.deb`
- **Uninstall**: `sudo apt remove byzand`

### Windows .exe Installer
- **File**: `Byzand-Setup.exe`
- **Features**:
  - One-click installation
  - Start menu integration
  - Desktop shortcut
  - Uninstall support
  - Auto-updater ready
- **Install**: Double-click the .exe file
- **Uninstall**: Control Panel > Programs

## Customization

### Update Version
Edit `package.json`:
```json
{
  "version": "1.0.1"
}
```

### Update Metadata
Edit `forge.config.ts`:
```typescript
// Update app version, description, etc.
appVersion: '1.0.1',
appCopyright: '© 2025 Byzand MSSQL Client',
```

### Code Signing (Windows)
For production releases, set environment variables:
```bash
export WINDOWS_CERTIFICATE_FILE="path/to/certificate.p12"
export WINDOWS_CERTIFICATE_PASSWORD="certificate_password"
```

## Troubleshooting

### Common Issues

1. **Missing Icons**
   - Ensure `assets/icon.png` and `assets/icon.ico` exist
   - Check file permissions

2. **Build Failures**
   - Clear cache: `rm -rf out/`
   - Reinstall dependencies: `npm install`

3. **Linux Dependencies**
   - Install required packages:
   ```bash
   sudo apt install fakeroot dpkg-dev
   ```

4. **Windows Build Issues**
   - Ensure you're on Windows or using Wine
   - Install Windows build tools

### Debug Mode
```bash
# Verbose output
DEBUG=electron-forge:* npm run make:deb
```

## Distribution

### Linux
- Upload `.deb` file to your website
- Consider creating a PPA for Ubuntu
- Submit to Snap Store or Flatpak

### Windows
- Upload `.exe` file to your website
- Consider Microsoft Store submission
- Use auto-updater for updates

## Next Steps

1. Create professional icon files
2. Test installers on target systems
3. Set up automated builds (GitHub Actions)
4. Implement auto-updater
5. Code signing for production releases

## Support

For issues with the build process:
1. Check the troubleshooting section
2. Review Electron Forge documentation
3. Check the application logs in `out/` directory


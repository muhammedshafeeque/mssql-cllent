#!/bin/bash

# Space-efficient installer build script for Byzand MSSQL Client
# This script builds installers using /tmp for temporary files

set -e

echo "🚀 Byzand MSSQL Client - Space-Efficient Installer Builder"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set environment variables to use /tmp for temporary files
export TMPDIR=/tmp
export TEMP=/tmp
export TMP=/tmp

# Create output directory in /tmp
OUTPUT_DIR="/tmp/byzand-build"
mkdir -p "$OUTPUT_DIR"

print_status "Using temporary directory: $OUTPUT_DIR"
print_status "Available space in /tmp: $(df -h /tmp | tail -1 | awk '{print $4}')"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf out/
rm -rf "$OUTPUT_DIR"

# Create a custom forge config that outputs to /tmp
cat > forge.config.tmp.ts << 'EOF'
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    name: 'Byzand',
    executableName: 'byzand',
    appVersion: '1.0.0',
    appCopyright: '© 2025 Byzand MSSQL Client',
    appBundleId: 'com.byzand.mssql-client',
    appCategoryType: 'public.app-category.developer-tools',
    icon: './assets/icon',
    out: '/tmp/byzand-build',
    win32metadata: {
      CompanyName: 'Byzand',
      ProductName: 'Byzand MSSQL Client',
      FileDescription: 'A beautiful MSSQL database client application',
      OriginalFilename: 'byzand.exe',
      InternalName: 'byzand',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'byzand',
      setupExe: 'Byzand-Setup.exe',
      setupIcon: './assets/icon.ico',
      noMsi: true,
      remoteReleases: '',
      authors: 'Byzand Team',
      description: 'A beautiful MSSQL database client application',
      exe: 'byzand.exe',
      iconUrl: 'https://raw.githubusercontent.com/your-repo/byzand/main/assets/icon.ico',
      setupIcon: './assets/icon.ico',
    }),
    new MakerDeb({
      options: {
        maintainer: 'Byzand Team',
        name: 'byzand',
        productName: 'Byzand MSSQL Client',
        description: 'A beautiful MSSQL database client application',
        version: '1.0.0',
        section: 'devel',
        arch: 'amd64',
        depends: [
          'libgtk-3-0',
          'libnotify4',
          'libnss3',
          'libxss1',
          'libxtst6',
          'xdg-utils',
        ],
        categories: ['Development', 'Database'],
        icon: './assets/icon.png',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
      electronArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
EOF

# Backup original config
cp forge.config.ts forge.config.original.ts

# Use temporary config
cp forge.config.tmp.ts forge.config.ts

print_status "Building Linux .deb installer..."

# Build Linux installer
npm run make:linux

print_status "Building Windows .exe installer..."

# Build Windows installer
npm run make:exe

# Restore original config
cp forge.config.original.ts forge.config.ts
rm -f forge.config.tmp.ts forge.config.original.ts

# Copy results to current directory
print_status "Copying installers to current directory..."
mkdir -p final-installers
cp -r "$OUTPUT_DIR/make"/* final-installers/ 2>/dev/null || true

# Show results
print_status "Build results:"
echo ""
if [ -d "final-installers" ]; then
    find final-installers -name "*.deb" -o -name "*.exe" -o -name "*.rpm" | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "📦 $(basename "$file") ($size)"
    done
else
    print_warning "No build output found"
fi

# Clean up temporary files
print_status "Cleaning up temporary files..."
rm -rf "$OUTPUT_DIR"

print_success "Installers created successfully!"
echo ""
echo "🎉 Your Byzand MSSQL Client installers are ready!"
echo "   - Check the 'final-installers' directory for your installers"



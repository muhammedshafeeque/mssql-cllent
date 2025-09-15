#!/bin/bash

# Create Proper Installers for Byzand MSSQL Client
# This script creates a Windows .exe installer and Linux .deb installer

set -e

echo "🚀 Creating Proper Installers for Byzand MSSQL Client"
echo "====================================================="

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

# Create output directory
mkdir -p proper-installers
cd proper-installers

print_status "Building Windows .exe installer..."

# Try to build Windows installer
if npx electron-forge make --platform=win32 --arch=x64; then
    print_success "Windows .exe installer created successfully!"
    
    # Find the created installer
    WINDOWS_INSTALLER=$(find ../out/make -name "*.exe" -type f | head -1)
    if [ -n "$WINDOWS_INSTALLER" ]; then
        cp "$WINDOWS_INSTALLER" ./Byzand-Setup.exe
        print_success "Windows installer copied: Byzand-Setup.exe"
    fi
else
    print_warning "Windows installer build failed. Creating portable version instead..."
    
    # Create portable Windows version
    mkdir -p Byzand-Windows-Portable
    cp -r ../out/Byzand-win32-x64/* Byzand-Windows-Portable/
    
    # Create README for Windows
    cat > Byzand-Windows-Portable/README.txt << 'EOF'
Byzand MSSQL Client - Windows Portable

INSTRUCTIONS:
1. Extract this folder to any location on your computer
2. Double-click "byzand.exe" to run the application
3. No installation required - completely portable!

SYSTEM REQUIREMENTS:
- Windows 10 or later
- No additional software required

FEATURES:
- Connect to MSSQL databases
- Browse tables and data
- Export data to CSV, Excel, JSON
- Import data from files
- Create database dumps
- Modern, user-friendly interface
EOF

    # Create ZIP for Windows
    zip -r Byzand-Windows-Portable.zip Byzand-Windows-Portable/
    print_success "Windows portable package created: Byzand-Windows-Portable.zip"
fi

print_status "Building Linux .deb installer..."

# Try to build Linux .deb installer
if npx electron-forge make --platform=linux --arch=x64; then
    print_success "Linux .deb installer created successfully!"
    
    # Find the created .deb file
    LINUX_INSTALLER=$(find ../out/make -name "*.deb" -type f | head -1)
    if [ -n "$LINUX_INSTALLER" ]; then
        cp "$LINUX_INSTALLER" ./byzand_1.0.0_amd64.deb
        print_success "Linux installer copied: byzand_1.0.0_amd64.deb"
    fi
else
    print_warning "Linux .deb installer build failed. Creating manual .deb package..."
    
    # Create .deb package structure manually
    mkdir -p byzand-deb/opt/byzand
    mkdir -p byzand-deb/usr/share/applications
    mkdir -p byzand-deb/usr/share/pixmaps
    mkdir -p byzand-deb/usr/bin
    mkdir -p byzand-deb/DEBIAN

    # Copy application files
    cp -r ../out/Byzand-linux-x64/* byzand-deb/opt/byzand/

    # Create desktop file
    cat > byzand-deb/usr/share/applications/byzand.desktop << 'EOF'
[Desktop Entry]
Name=Byzand MSSQL Client
Comment=A beautiful MSSQL database client application
Exec=/opt/byzand/byzand
Icon=/usr/share/pixmaps/byzand.png
Terminal=false
Type=Application
Categories=Development;Database;
StartupWMClass=Byzand
EOF

    # Copy icon
    cp ../assets/icon.png byzand-deb/usr/share/pixmaps/byzand.png

    # Create launcher script
    cat > byzand-deb/usr/bin/byzand << 'EOF'
#!/bin/bash
exec /opt/byzand/byzand "$@"
EOF
    chmod +x byzand-deb/usr/bin/byzand

    # Create control file
    cat > byzand-deb/DEBIAN/control << 'EOF'
Package: byzand
Version: 1.0.0
Section: devel
Priority: optional
Architecture: amd64
Maintainer: Byzand Team
Description: A beautiful MSSQL database client application
 Byzand is a modern, user-friendly MSSQL database client.
Depends: libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils
EOF

    # Build the .deb package
    dpkg-deb --build byzand-deb byzand_1.0.0_amd64.deb
    print_success "Linux .deb package created: byzand_1.0.0_amd64.deb"
fi

# Show results
print_status "Installation packages created:"
echo ""
if [ -f "Byzand-Setup.exe" ]; then
    echo "📦 Windows: Byzand-Setup.exe (Professional installer)"
    echo "   - Double-click to install"
    echo "   - Creates Start Menu shortcut"
    echo "   - Proper uninstall support"
elif [ -f "Byzand-Windows-Portable.zip" ]; then
    echo "📦 Windows: Byzand-Windows-Portable.zip (Portable version)"
    echo "   - Extract and run byzand.exe"
    echo "   - No installation required"
fi

if [ -f "byzand_1.0.0_amd64.deb" ]; then
    echo "📦 Linux: byzand_1.0.0_amd64.deb (Professional installer)"
    echo "   - Install with: sudo dpkg -i byzand_1.0.0_amd64.deb"
    echo "   - Uninstall with: sudo apt remove byzand"
    echo "   - Creates desktop shortcut"
fi

echo ""

# Show file sizes
echo "File sizes:"
ls -lh *.exe *.deb *.zip 2>/dev/null || true

print_success "Proper installers created successfully!"
echo ""
echo "🎉 Your Byzand MSSQL Client is ready for professional distribution!"


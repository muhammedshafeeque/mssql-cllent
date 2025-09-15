#!/bin/bash

# Create Single Installers for Byzand MSSQL Client
# This script creates a single .exe file and a single .deb file

set -e

echo "🚀 Creating Single Installers for Byzand MSSQL Client"
echo "=================================================="

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
mkdir -p single-installers
cd single-installers

print_status "Creating Windows Portable Executable..."

# Create Windows portable package
mkdir -p Byzand-Windows-Portable
cp -r ../out/Byzand-win32-x64/* Byzand-Windows-Portable/

# Create a simple launcher script for Windows
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

For support, visit: https://github.com/your-repo/byzand
EOF

# Create ZIP for Windows
zip -r Byzand-Windows-Portable.zip Byzand-Windows-Portable/
print_success "Windows portable package created: Byzand-Windows-Portable.zip"

print_status "Creating Linux .deb Package..."

# Create .deb package structure
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
Keywords=database;sql;mssql;client;development;
MimeType=application/x-sql;
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
Maintainer: Byzand Team <team@byzand.com>
Description: A beautiful MSSQL database client application
 Byzand is a modern, user-friendly MSSQL database client that provides
 an intuitive interface for managing your SQL Server databases.
 .
 Features:
 - Connect to MSSQL databases
 - Browse tables and data with pagination
 - Export data to CSV, Excel, JSON formats
 - Import data from files
 - Create and restore database dumps
 - Column-wise filtering
 - Modern, responsive UI with glassmorphism design
 - Session management and auto-reconnection
Depends: libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libdrm2, libxcomposite1
Homepage: https://github.com/your-repo/byzand
EOF

# Create postinst script
cat > byzand-deb/DEBIAN/postinst << 'EOF'
#!/bin/bash
set -e

# Update desktop database
if [ -x /usr/bin/update-desktop-database ]; then
    update-desktop-database -q /usr/share/applications
fi

# Update icon cache
if [ -x /usr/bin/gtk-update-icon-cache ]; then
    gtk-update-icon-cache -q /usr/share/pixmaps
fi

exit 0
EOF
chmod +x byzand-deb/DEBIAN/postinst

# Create prerm script
cat > byzand-deb/DEBIAN/prerm << 'EOF'
#!/bin/bash
set -e

# Remove desktop database entries
if [ -x /usr/bin/update-desktop-database ]; then
    update-desktop-database -q /usr/share/applications
fi

exit 0
EOF
chmod +x byzand-deb/DEBIAN/prerm

# Build the .deb package
dpkg-deb --build byzand-deb byzand_1.0.0_amd64.deb
print_success "Linux .deb package created: byzand_1.0.0_amd64.deb"

# Show results
print_status "Installation packages created:"
echo ""
echo "📦 Windows: Byzand-Windows-Portable.zip"
echo "   - Extract and run byzand.exe"
echo "   - No installation required"
echo ""
echo "📦 Linux: byzand_1.0.0_amd64.deb"
echo "   - Install with: sudo dpkg -i byzand_1.0.0_amd64.deb"
echo "   - Uninstall with: sudo apt remove byzand"
echo ""

# Show file sizes
echo "File sizes:"
ls -lh Byzand-Windows-Portable.zip byzand_1.0.0_amd64.deb

print_success "Single installers created successfully!"
echo ""
echo "🎉 Your Byzand MSSQL Client is ready for distribution!"
echo "   - Windows users: Extract and run Byzand-Windows-Portable.zip"
echo "   - Linux users: Install byzand_1.0.0_amd64.deb"


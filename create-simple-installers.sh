#!/bin/bash

# Simple installer creation script for Byzand MSSQL Client
# This creates basic installers without the full build process

set -e

echo "🚀 Byzand MSSQL Client - Simple Installer Creator"
echo "================================================"

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
mkdir -p simple-installers
cd simple-installers

print_status "Creating Linux .deb package structure..."

# Create .deb package structure
mkdir -p byzand-deb/opt/byzand
mkdir -p byzand-deb/usr/share/applications
mkdir -p byzand-deb/usr/share/pixmaps
mkdir -p byzand-deb/usr/bin
mkdir -p byzand-deb/DEBIAN

# Create a simple launcher script (since we don't have the actual binary)
cat > byzand-deb/opt/byzand/byzand << 'EOF'
#!/bin/bash
# Byzand MSSQL Client Launcher
echo "Byzand MSSQL Client"
echo "=================="
echo ""
echo "This is a placeholder installer."
echo "To run Byzand, please:"
echo "1. Install Node.js and npm"
echo "2. Clone the repository: git clone https://github.com/your-repo/byzand"
echo "3. Run: cd byzand && npm install && npm start"
echo ""
echo "For more information, visit: https://github.com/your-repo/byzand"
EOF

chmod +x byzand-deb/opt/byzand/byzand

# Create desktop file
cat > byzand-deb/usr/share/applications/byzand.desktop << 'EOF'
[Desktop Entry]
Name=Byzand MSSQL Client
Comment=A beautiful MSSQL database client application
Exec=/opt/byzand/byzand
Icon=/usr/share/pixmaps/byzand.png
Terminal=true
Type=Application
Categories=Development;Database;
StartupWMClass=Byzand
Keywords=database;sql;mssql;client;development;
MimeType=application/x-sql;
EOF

# Copy icon if it exists
if [ -f "../assets/icon.png" ]; then
    cp ../assets/icon.png byzand-deb/usr/share/pixmaps/byzand.png
else
    print_warning "Icon file not found, creating placeholder"
    # Create a simple placeholder icon
    convert -size 64x64 xc:blue -fill white -pointsize 12 -gravity center -annotate +0+0 "B" byzand-deb/usr/share/pixmaps/byzand.png 2>/dev/null || {
        # If convert is not available, create a simple text file
        echo "Icon placeholder" > byzand-deb/usr/share/pixmaps/byzand.png
    }
fi

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
 .
 Note: This is a placeholder installer. The actual application
 requires Node.js and npm to be installed and run from source.
Depends: nodejs, npm
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

echo "Byzand MSSQL Client installed successfully!"
echo "To run the application, you need to:"
echo "1. Install Node.js and npm if not already installed"
echo "2. Clone the repository: git clone https://github.com/your-repo/byzand"
echo "3. Run: cd byzand && npm install && npm start"

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
print_status "Building .deb package..."
dpkg-deb --build byzand-deb byzand_1.0.0_amd64.deb
print_success "Linux .deb package created: byzand_1.0.0_amd64.deb"

print_status "Creating Windows installer script..."

# Create Windows installer script
cat > Byzand-Windows-Installer.bat << 'EOF'
@echo off
echo Byzand MSSQL Client - Windows Installer
echo ======================================
echo.
echo This installer will help you set up Byzand MSSQL Client on Windows.
echo.
echo Prerequisites:
echo - Node.js (version 16 or higher)
echo - npm (comes with Node.js)
echo.
echo Installation steps:
echo 1. Install Node.js from https://nodejs.org/
echo 2. Open Command Prompt as Administrator
echo 3. Clone the repository:
echo    git clone https://github.com/your-repo/byzand
echo 4. Navigate to the directory:
echo    cd byzand
echo 5. Install dependencies:
echo    npm install
echo 6. Run the application:
echo    npm start
echo.
echo For more information, visit: https://github.com/your-repo/byzand
echo.
pause
EOF

# Create Windows PowerShell installer
cat > Byzand-Windows-Installer.ps1 << 'EOF'
# Byzand MSSQL Client - Windows PowerShell Installer
Write-Host "Byzand MSSQL Client - Windows Installer" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "This installer will help you set up Byzand MSSQL Client on Windows." -ForegroundColor Yellow
Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Cyan
Write-Host "- Node.js (version 16 or higher)" -ForegroundColor White
Write-Host "- npm (comes with Node.js)" -ForegroundColor White
Write-Host "- Git (for cloning the repository)" -ForegroundColor White
Write-Host ""
Write-Host "Installation steps:" -ForegroundColor Cyan
Write-Host "1. Install Node.js from https://nodejs.org/" -ForegroundColor White
Write-Host "2. Install Git from https://git-scm.com/" -ForegroundColor White
Write-Host "3. Open PowerShell as Administrator" -ForegroundColor White
Write-Host "4. Clone the repository:" -ForegroundColor White
Write-Host "   git clone https://github.com/your-repo/byzand" -ForegroundColor Gray
Write-Host "5. Navigate to the directory:" -ForegroundColor White
Write-Host "   cd byzand" -ForegroundColor Gray
Write-Host "6. Install dependencies:" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "7. Run the application:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "For more information, visit: https://github.com/your-repo/byzand" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"
EOF

# Create a ZIP file for Windows
mkdir -p Byzand-Windows-Portable
cp Byzand-Windows-Installer.bat Byzand-Windows-Portable/
cp Byzand-Windows-Installer.ps1 Byzand-Windows-Portable/

# Create README for Windows
cat > Byzand-Windows-Portable/README.txt << 'EOF'
Byzand MSSQL Client - Windows Installation Guide
===============================================

This package contains installation scripts for Byzand MSSQL Client on Windows.

FILES:
- Byzand-Windows-Installer.bat    : Batch file installer
- Byzand-Windows-Installer.ps1    : PowerShell installer
- README.txt                      : This file

QUICK START:
1. Double-click "Byzand-Windows-Installer.bat" for a simple installation guide
2. Or run "Byzand-Windows-Installer.ps1" in PowerShell for a detailed guide

PREREQUISITES:
- Windows 10 or later
- Node.js (version 16 or higher) - Download from https://nodejs.org/
- Git (optional, for cloning) - Download from https://git-scm.com/

INSTALLATION:
1. Install Node.js from https://nodejs.org/
2. Open Command Prompt or PowerShell
3. Clone the repository: git clone https://github.com/your-repo/byzand
4. Navigate to the directory: cd byzand
5. Install dependencies: npm install
6. Run the application: npm start

FEATURES:
- Connect to MSSQL databases
- Browse tables and data with pagination
- Export data to CSV, Excel, JSON formats
- Import data from files
- Create and restore database dumps
- Column-wise filtering
- Modern, responsive UI with glassmorphism design
- Session management and auto-reconnection

SUPPORT:
For issues and support, visit: https://github.com/your-repo/byzand

LICENSE:
MIT License - See LICENSE file in the repository
EOF

# Create ZIP for Windows
zip -r Byzand-Windows-Portable.zip Byzand-Windows-Portable/
print_success "Windows installer package created: Byzand-Windows-Portable.zip"

# Show results
print_status "Installation packages created:"
echo ""
echo "📦 Linux: byzand_1.0.0_amd64.deb"
echo "   - Install with: sudo dpkg -i byzand_1.0.0_amd64.deb"
echo "   - Uninstall with: sudo apt remove byzand"
echo "   - Note: This is a placeholder installer that provides setup instructions"
echo ""
echo "📦 Windows: Byzand-Windows-Portable.zip"
echo "   - Extract and run Byzand-Windows-Installer.bat"
echo "   - Or run Byzand-Windows-Installer.ps1 in PowerShell"
echo "   - Contains installation instructions and setup scripts"
echo ""

# Show file sizes
echo "File sizes:"
ls -lh byzand_1.0.0_amd64.deb Byzand-Windows-Portable.zip

print_success "Simple installers created successfully!"
echo ""
echo "🎉 Your Byzand MSSQL Client installers are ready!"
echo "   - Linux users: Install byzand_1.0.0_amd64.deb"
echo "   - Windows users: Extract and run Byzand-Windows-Portable.zip"
echo ""
echo "Note: These are setup installers that guide users through the installation process."
echo "The actual application needs to be built from source using Node.js and npm."



#!/bin/bash

# Byzand MSSQL Client - Installer Build Script
# This script helps build installers for different platforms

set -e

echo "🚀 Byzand MSSQL Client - Installer Builder"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required assets exist
check_assets() {
    print_status "Checking required assets..."
    
    if [ ! -f "assets/icon.png" ]; then
        print_warning "assets/icon.png not found. Creating placeholder..."
        echo "⚠️  Please replace assets/icon.png with a 512x512 PNG icon"
    fi
    
    if [ ! -f "assets/icon.ico" ]; then
        print_warning "assets/icon.ico not found. Creating placeholder..."
        echo "⚠️  Please replace assets/icon.ico with a Windows ICO file"
    fi
    
    if [ -f "assets/icon-placeholder.txt" ]; then
        print_warning "Icon placeholders detected. Please create actual icon files."
        echo "See BUILD_INSTALLERS.md for instructions."
    fi
}

# Clean previous builds
clean_builds() {
    print_status "Cleaning previous builds..."
    rm -rf out/
    print_success "Build directory cleaned"
}

# Build function
build_installers() {
    local platform=$1
    local arch=$2
    
    print_status "Building installers for $platform ($arch)..."
    
    case $platform in
        "linux")
            npm run make:deb
            ;;
        "windows")
            npm run make:exe
            ;;
        "all")
            npm run make:all
            ;;
        *)
            print_error "Unknown platform: $platform"
            exit 1
            ;;
    esac
    
    print_success "Build completed for $platform"
}

# Show build results
show_results() {
    print_status "Build results:"
    echo ""
    
    if [ -d "out/make" ]; then
        find out/make -name "*.deb" -o -name "*.exe" -o -name "*.rpm" | while read file; do
            size=$(du -h "$file" | cut -f1)
            echo "📦 $(basename "$file") ($size)"
        done
    else
        print_warning "No build output found"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Select build option:"
    echo "1) Build Linux .deb installer"
    echo "2) Build Windows .exe installer"
    echo "3) Build all installers"
    echo "4) Clean build directory"
    echo "5) Check assets"
    echo "6) Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "forge.config.ts" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    while true; do
        show_menu
        
        case $choice in
            1)
                check_assets
                clean_builds
                build_installers "linux" "x64"
                show_results
                ;;
            2)
                check_assets
                clean_builds
                build_installers "windows" "x64"
                show_results
                ;;
            3)
                check_assets
                clean_builds
                build_installers "all" "all"
                show_results
                ;;
            4)
                clean_builds
                ;;
            5)
                check_assets
                ;;
            6)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please select 1-6."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@"


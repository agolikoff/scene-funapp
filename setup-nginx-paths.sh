#!/bin/bash

# Script to setup Nginx paths for basketball-scene-proxy
# This script updates the nginx.conf with the correct project paths

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get current project directory
PROJECT_DIR=$(pwd)
print_status "Project directory: $PROJECT_DIR"

# Check if nginx.conf exists
if [ ! -f "nginx.conf" ]; then
    print_error "nginx.conf not found in current directory"
    exit 1
fi

# Create backup of original nginx.conf
cp nginx.conf nginx.conf.backup
print_status "Created backup: nginx.conf.backup"

# Update nginx.conf with correct paths
print_status "Updating nginx.conf with project paths..."

# Replace placeholder paths with actual project path
sed -i "s|/path/to/your/project|$PROJECT_DIR|g" nginx.conf

print_status "Updated nginx.conf with correct paths:"
print_status "  - All static files: /3d/external/view/ → $PROJECT_DIR/"
print_status "  - Includes: js/, img/, fonts/, tex/, preview/, *.html, etc."
print_status "  - Security: Blocks access to .env, .log, .sh, .conf files"

# Test nginx configuration
print_status "Testing Nginx configuration..."
if sudo nginx -t; then
    print_status "✓ Nginx configuration is valid"
else
    print_error "✗ Nginx configuration is invalid"
    print_warning "Restoring backup..."
    cp nginx.conf.backup nginx.conf
    exit 1
fi

print_status "🎉 Nginx paths setup completed successfully!"
print_status ""
print_status "Next steps:"
print_status "1. Copy updated nginx.conf to Nginx sites:"
print_status "   sudo cp nginx.conf /etc/nginx/sites-available/basketball-proxy"
print_status ""
print_status "2. Reload Nginx:"
print_status "   sudo systemctl reload nginx"
print_status ""
print_status "3. Test static files access:"
print_status "   curl http://your-domain.com/3d/external/view/js/app.js"
print_status "   curl http://your-domain.com/3d/external/view/img/logo.svg"
print_status "   curl http://your-domain.com/3d/external/view/index.html"

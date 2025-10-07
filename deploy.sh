#!/bin/bash

# Basketball Scene Proxy Deployment Script
# This script sets up the application with PM2 and Nginx

set -e

echo "🚀 Starting Basketball Scene Proxy deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx is not installed. Please install Nginx first."
    print_status "On Ubuntu/Debian: sudo apt update && sudo apt install nginx"
    print_status "On CentOS/RHEL: sudo yum install nginx"
    exit 1
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Install dependencies
print_status "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp env.example .env
    print_warning "Please edit .env file with your configuration before starting the application"
fi

# Setup PM2
print_status "Setting up PM2..."
pm2 delete basketball-scene-proxy 2>/dev/null || true
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

print_status "PM2 setup completed!"

# Setup Nginx
print_status "Setting up Nginx..."

# Update nginx.conf with correct project paths
print_status "Updating Nginx configuration with project paths..."
./setup-nginx-paths.sh

# Create Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/basketball-proxy

# Create symlink to enable site
sudo ln -sf /etc/nginx/sites-available/basketball-proxy /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
    sudo systemctl reload nginx
    print_status "Nginx reloaded successfully"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Enable services to start on boot
sudo systemctl enable nginx

print_status "🎉 Deployment completed successfully!"
print_status "Application is running on port 3000"
print_status "Nginx is configured to proxy requests"
print_status ""
print_status "Useful commands:"
print_status "  pm2 status                    - Check application status"
print_status "  pm2 logs basketball-scene-proxy - View application logs"
print_status "  pm2 restart basketball-scene-proxy - Restart application"
print_status "  sudo systemctl status nginx  - Check Nginx status"
print_status "  sudo systemctl reload nginx  - Reload Nginx configuration"

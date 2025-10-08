#!/bin/bash

# Basketball Scene Proxy Management Script
# This script provides easy management commands for the application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[BASKETBALL PROXY]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Basketball Scene Proxy Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       - Start the application"
    echo "  stop        - Stop the application"
    echo "  restart     - Restart the application"
    echo "  status      - Show application status"
    echo "  logs        - Show application logs"
    echo "  logs-follow - Follow application logs"
    echo "  reload      - Reload application (zero-downtime)"
    echo "  deploy      - Deploy application"
    echo "  nginx-reload - Reload Nginx configuration"
    echo "  nginx-test  - Test Nginx configuration"
    echo "  health      - Check application health"
    echo "  help        - Show this help message"
}

# Function to start application
start_app() {
    print_header "Starting application..."
    pm2 start ecosystem.config.cjs --env production
    print_status "Application started successfully"
}

# Function to stop application
stop_app() {
    print_header "Stopping application..."
    pm2 stop basketball-scene-proxy
    print_status "Application stopped successfully"
}

# Function to restart application
restart_app() {
    print_header "Restarting application..."
    pm2 restart basketball-scene-proxy
    print_status "Application restarted successfully"
}

# Function to show status
show_status() {
    print_header "Application Status:"
    pm2 status
    echo ""
    print_header "Nginx Status:"
    sudo systemctl status nginx --no-pager -l
}

# Function to show logs
show_logs() {
    print_header "Application Logs:"
    pm2 logs basketball-scene-proxy --lines 50
}

# Function to follow logs
follow_logs() {
    print_header "Following application logs (Ctrl+C to exit):"
    pm2 logs basketball-scene-proxy --follow
}

# Function to reload application
reload_app() {
    print_header "Reloading application (zero-downtime)..."
    pm2 reload basketball-scene-proxy
    print_status "Application reloaded successfully"
}

# Function to deploy
deploy_app() {
    print_header "Deploying application..."
    ./deploy.sh
}

# Function to reload Nginx
reload_nginx() {
    print_header "Reloading Nginx configuration..."
    if sudo nginx -t; then
        sudo systemctl reload nginx
        print_status "Nginx reloaded successfully"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
}

# Function to test Nginx
test_nginx() {
    print_header "Testing Nginx configuration..."
    if sudo nginx -t; then
        print_status "Nginx configuration is valid"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
}

# Function to check health
check_health() {
    print_header "Checking application health..."
    
    # Check if PM2 process is running
    if pm2 describe basketball-scene-proxy > /dev/null 2>&1; then
        print_status "✓ PM2 process is running"
    else
        print_error "✗ PM2 process is not running"
        return 1
    fi
    
    # Check if application responds
    if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
        print_status "✓ Application is responding"
    else
        print_warning "✗ Application is not responding on port 3000"
    fi
    
    # Check Nginx status
    if sudo systemctl is-active --quiet nginx; then
        print_status "✓ Nginx is running"
    else
        print_error "✗ Nginx is not running"
        return 1
    fi
    
    # Check if Nginx can reach the application
    if curl -s -f http://localhost/health > /dev/null 2>&1; then
        print_status "✓ Nginx can reach the application"
    else
        print_warning "✗ Nginx cannot reach the application"
    fi
}

# Main script logic
case "$1" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    logs-follow)
        follow_logs
        ;;
    reload)
        reload_app
        ;;
    deploy)
        deploy_app
        ;;
    nginx-reload)
        reload_nginx
        ;;
    nginx-test)
        test_nginx
        ;;
    health)
        check_health
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac

# Basketball Scene Proxy Server

This proxy server handles incoming requests, extracts authorization headers and validates them through an external API.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp env.example .env
```

3. Edit `.env` file with your configuration values.

## Running

### Normal startup:
```bash
npm start
```

### Development mode (with auto-reload):
```bash
npm run dev
```

## How it works

1. **Nginx** receives requests and handles them based on type:
   - **Static files** (`.js`, `.css`, `.png`, etc.) → served directly from project directory
   - **API requests** (non-static files) → proxied to Node.js application
2. **Node.js server** processes only API requests (skips static files)
3. **Bypass check**: If `?bypass=secret-key` parameter matches `BYPASS_KEY` → shows `index.html` directly
4. Extracts `Authorization` and `X-Date` headers from incoming request
5. If headers are missing - shows `403.html`
6. If headers are present - makes PUT request to validation endpoint
7. On successful validation (status 200-299) shows `index.html`
8. On failed validation or error shows `403.html`

### URL Structure:
- **Direct access**: `http://localhost:3000/any-path`
- **Through Nginx**: `http://your-domain.com/3d/external/view/any-path`
- **Root redirect**: `http://your-domain.com/` → `http://your-domain.com/3d/external/view/`
- **Static files**: `http://your-domain.com/3d/external/view/js/`, `http://your-domain.com/3d/external/view/img/`, etc.

## Configuration

All configuration is done through environment variables in `.env` file:

- **PORT**: Server port (default: 3000)
- **VALIDATION_URL**: Validation endpoint URL
- **X_FORWARDED_FOR**: Value for X-Forwarded-For header
- **VALIDATION_HOST**: Host value in validation request body
- **VALIDATION_PATH**: Path value in validation request body
- **REQUEST_TIMEOUT**: Request timeout in milliseconds (default: 10000)
- **BYPASS_KEY**: Secret key for bypassing validation (optional, for development/testing)

### Example .env file:
```
VALIDATION_URL=http://event-api-dev.shottracker-internal.com/v1/data/auth/_validate
X_FORWARDED_FOR=event-api-dev.shottracker.com
VALIDATION_HOST=hype-dev.shottracker.com
VALIDATION_PATH=3d/external/view
PORT=3000
REQUEST_TIMEOUT=10000
BYPASS_KEY=your-secret-bypass-key-here
```

## Validation request structure

```javascript
PUT http://event-api-dev.shottracker-internal.com/v1/data/auth/_validate

Headers:
- Authorization: [from incoming request]
- X-Date: [from incoming request]
- X-Forwarded-For: event-api-dev.shottracker.com
- Content-Type: application/json

Body:
{
  "host": "hype-dev.shottracker.com",
  "path": "3d/external/view"
}
```

## Testing

You can use curl for testing:

```bash
# Test with headers (direct to Node.js app)
curl -X GET http://localhost:3000/test \
  -H "Authorization: Bearer your-token" \
  -H "X-Date: 2024-01-01T00:00:00Z"

# Test without headers (should show 403.html)
curl -X GET http://localhost:3000/test

# Test through Nginx proxy (recommended)
curl -X GET http://your-domain.com/3d/external/view/test \
  -H "Authorization: Bearer your-token" \
  -H "X-Date: 2024-01-01T00:00:00Z"

# Test without headers through Nginx (should show 403.html)
curl -X GET http://your-domain.com/3d/external/view/test

# Test static files access
curl -X GET http://your-domain.com/3d/external/view/js/app.js
curl -X GET http://your-domain.com/3d/external/view/img/logo.svg
curl -X GET http://your-domain.com/3d/external/view/fonts/stylesheet.css

# Test bypass key (if configured)
curl -X GET "http://your-domain.com/3d/external/view/test?bypass=your-secret-bypass-key-here"
```

## Production Deployment with PM2 and Nginx

### Prerequisites

1. **Node.js** (v16 or higher)
2. **PM2** - Process manager for Node.js
3. **Nginx** - Web server and reverse proxy

### Installation

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Install Nginx:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### Quick Deployment

1. **Run the deployment script:**
```bash
./deploy.sh
```

This script will:
- Install dependencies
- Create logs directory
- Setup PM2 configuration
- Configure Nginx
- Start the application

### Manual Setup

#### 1. PM2 Configuration

The application includes `ecosystem.config.js` for PM2 configuration:

```bash
# Start with PM2
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart application
npm run pm2:restart
```

#### 2. Nginx Configuration

1. **Setup project paths in Nginx configuration:**
```bash
./setup-nginx-paths.sh
```

2. **Copy Nginx configuration:**
```bash
sudo cp nginx.conf /etc/nginx/sites-available/basketball-proxy
```

3. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/basketball-proxy /etc/nginx/sites-enabled/
```

4. **Remove default site:**
```bash
sudo rm /etc/nginx/sites-enabled/default
```

5. **Test and reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Management Commands

Use the management script for easy operations:

```bash
# Start application
./manage.sh start

# Stop application
./manage.sh stop

# Restart application
./manage.sh restart

# Check status
./manage.sh status

# View logs
./manage.sh logs

# Follow logs in real-time
./manage.sh logs-follow

# Reload application (zero-downtime)
./manage.sh reload

# Check health
./manage.sh health

# Reload Nginx
./manage.sh nginx-reload
```

### NPM Scripts

```bash
# PM2 commands
npm run pm2:start      # Start with PM2
npm run pm2:stop       # Stop application
npm run pm2:restart    # Restart application
npm run pm2:reload     # Reload application
npm run pm2:status     # Show status
npm run pm2:logs       # Show logs
npm run pm2:monit      # Open PM2 monitoring

# Deployment
npm run deploy         # Run deployment script
npm run manage         # Run management script
```

### Configuration

#### Environment Variables

Create `.env` file with your configuration:

```bash
cp env.example .env
# Edit .env with your values
```

#### Nginx Customization

Edit `/etc/nginx/sites-available/basketball-proxy`:

1. **Change domain name:**
```nginx
server_name your-domain.com www.your-domain.com;
```

2. **Enable HTTPS (recommended):**
```bash
# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. **Adjust rate limiting:**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

4. **Static files configuration:**
The Nginx configuration serves ALL static files from your project directory under `/3d/external/view/` path:
- **All files and folders** in your project are accessible
- **Security**: Sensitive files (`.env`, `.log`, `.sh`, `.conf`) are blocked
- **SPA support**: Falls back to `index.html` for client-side routing
- **Caching**: All static files are cached for 1 year

5. **Add additional paths:**
```nginx
# Serve custom static files
location /static/ {
    alias /path/to/your/static/files/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Proxy other API endpoints
location /api/ {
    proxy_pass http://other-backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Monitoring

#### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Show detailed status
pm2 show basketball-scene-proxy

# View logs with timestamps
pm2 logs basketball-scene-proxy --timestamp
```

#### System Monitoring

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/basketball_proxy_access.log
sudo tail -f /var/log/nginx/basketball_proxy_error.log

# Check application logs
tail -f logs/combined.log
```

### Troubleshooting

#### Common Issues

1. **Application not starting:**
```bash
# Check PM2 logs
pm2 logs basketball-scene-proxy

# Check if port is in use
sudo netstat -tlnp | grep :3000
```

2. **Nginx not proxying:**
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

3. **Permission issues:**
```bash
# Fix log directory permissions
sudo chown -R $USER:$USER logs/

# Fix Nginx permissions
sudo chown -R www-data:www-data /var/log/nginx/
```

### Security Considerations

1. **Firewall setup:**
```bash
# Allow only HTTP/HTTPS traffic
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. **SSL/TLS:**
- Use Let's Encrypt for free SSL certificates
- Enable HTTPS redirect in Nginx
- Use strong SSL ciphers

3. **Rate limiting:**
- Adjust rate limits based on your needs
- Monitor for abuse patterns
- Consider IP whitelisting for trusted sources

### Performance Tuning

1. **PM2 cluster mode:**
- Uses all CPU cores by default
- Adjust `instances` in `ecosystem.config.js`

2. **Nginx optimization:**
- Enable gzip compression
- Adjust buffer sizes
- Use keepalive connections

3. **Application optimization:**
- Monitor memory usage
- Set appropriate timeouts
- Use connection pooling

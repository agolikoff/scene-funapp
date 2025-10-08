module.exports = {
  apps: [{
    name: 'basketball-scene-proxy',
    script: 'proxy.js',
    instances: 1, // Use all available CPU cores
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 8008
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8008
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart settings
    watch: false, // Set to true for development
    ignore_watch: ['node_modules', 'logs', '.git'],
    max_memory_restart: '1G',
    
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Environment variables
    env_file: '.env'
  }]
};

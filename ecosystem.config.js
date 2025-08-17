module.exports = {
  apps: [{
    name: 'bms360',
    script: './main.js',
    
    // Basic configuration
    instances: process.env.PM2_INSTANCES || 'max',
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000
    },
    
    // Performance & Memory
    max_memory_restart: '512M',
    node_args: '--max-old-space-size=512',
    
    // Logging
    log_file: './logs/pm2-combined.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Process management
    autorestart: true,
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git',
      'uploads',
      'temp'
    ],
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10,
    
    // Clustering
    instance_var: 'INSTANCE_ID',
    
    // Advanced options
    source_map_support: false,
    disable_source_map_support: true,
    
    // Custom environment variables
    env_vars: {
      'INSTANCE_ID': 0
    }
  }],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/bms360.git',
      path: '/var/www/bms360',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
};

module.exports = {
  apps: [{
    name: 'vtop-backend',
    script: './backend/server.js',
    cwd: '/var/www/vtop-portal',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Auto restart
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    
    // Memory management
    max_memory_restart: '1G',
    
    // Graceful shutdown
    kill_timeout: 5000,
    
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10,
    
    // Environment variables
    env_file: './backend/.env'
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/vtop-portal.git',
      path: '/var/www/vtop-portal',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
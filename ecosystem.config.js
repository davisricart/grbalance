module.exports = {
  apps: [
    {
      name: 'backend-server',
      script: 'server.cjs',
      env: { NODE_ENV: 'development', PORT: 3001 },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true,
      autorestart: true
    },
    {
      name: 'file-watcher',
      script: 'robust-ai-watcher.cjs',
      env: { NODE_ENV: 'development' },
      error_file: './logs/watcher-error.log',
      out_file: './logs/watcher-out.log',
      time: true,
      autorestart: true
    }
  ]
};
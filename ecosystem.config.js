// PM2 설정 파일 (선택사항)
module.exports = {
  apps: [
    {
      name: "washer-app",
      script: "/var/www/html/server.js",
      cwd: "/var/www/html",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/pm2/washer-app-error.log",
      out_file: "/var/log/pm2/washer-app-out.log",
      log_file: "/var/log/pm2/washer-app.log",
      time: true,
    },
  ],
}

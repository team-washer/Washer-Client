module.exports = {
  apps: [
    {
      name: "washer-client",
      script: "pnpm",
      args: "start",
      cwd: "./",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
module.exports = {
  apps: [
    {
      name: "chessthan-server",
      script: "./server/dist/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    },
    {
      name: "chessthan-client",
      script: "node_modules/next/dist/bin/next",
      args: "start ./client",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};

module.exports = {
  apps: [
    {
      name: 'benettpapir-backend',
      script: 'server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}

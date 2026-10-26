module.exports = {
  apps: [
    {
      name: "deskflow-backend",
      cwd: "C:/Git/deskflowcrm/backend",
      script: "src/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "deskflow-frontend",
      cwd: "C:/Git/deskflowcrm/frontend",
      script: "node_modules/@craco/craco/dist/bin/craco.js",
      args: "start",
      interpreter: "node",
      env: {
        PORT: "3000",
        BROWSER: "none",
      },
    },
    {
      name: "deskflow-storefront",
      cwd: "C:/Git/deskflowcrm/storefront",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3002",
      interpreter: "node",
    },
  ],
};

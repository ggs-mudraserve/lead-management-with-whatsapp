module.exports = {
  apps: [
    {
      name: 'lead-management-with-whatsapp',
      cwd: '/home/server/lead-management-with-whatsapp',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production'
        // yahan apne secrets / DB URLs bhi daal sakte ho
      },
      // optional hard limits
      max_memory_restart: '600M'
    }
  ]
};

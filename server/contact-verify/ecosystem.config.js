/* pm2 process definition for the contact-form verifier.
   Env (secret + webhook URL) is loaded from ~/contact-verify/.env by server.js's
   process.env — pm2 reads this file for the process shape, the .env for secrets.
   Start:  pm2 start ecosystem.config.js && pm2 save
   The existing @reboot 'pm2 resurrect' cron brings it back after a reboot. */
module.exports = {
  apps: [{
    name: 'contact-verify',
    script: 'server.js',
    cwd: '/usr/home/mlgwcy/contact-verify',
    node_args: '--env-file=/usr/home/mlgwcy/contact-verify/.env',
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    max_memory_restart: '120M',
    env: { NODE_ENV: 'production' },
  }],
};

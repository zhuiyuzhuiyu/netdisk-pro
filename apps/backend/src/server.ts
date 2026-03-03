import { app } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { ensureDir } from './utils/filesystem.js';

await ensureDir(config.uploadRoot);

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'server_started');
});

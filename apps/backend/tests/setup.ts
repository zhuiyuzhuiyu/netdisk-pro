import fs from 'node:fs/promises';
import path from 'node:path';

process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'file:./test.db';
process.env.UPLOAD_ROOT = './uploads-test';
process.env.MAX_QUOTA_BYTES = '10000000';

await fs.mkdir(path.resolve(process.cwd(), 'uploads-test/.tmp'), { recursive: true });

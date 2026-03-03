import crypto from 'node:crypto';

export const makeToken = () => crypto.randomBytes(24).toString('hex');

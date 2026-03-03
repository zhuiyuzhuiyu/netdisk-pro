import dotenv from 'dotenv';

dotenv.config();

const parseQuota = (value: string | undefined) => {
  const parsed = Number(value ?? 1073741824);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1073741824;
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  uploadRoot: process.env.UPLOAD_ROOT ?? './uploads',
  maxQuotaBytes: parseQuota(process.env.MAX_QUOTA_BYTES)
};

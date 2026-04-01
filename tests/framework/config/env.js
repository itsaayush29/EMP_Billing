import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const env = {
  authFile: 'selenium/.auth/user.json',
  baseUrl: process.env.BASE_URL || 'https://test-billing.empcloud.com',
  headless: process.env.HEADLESS !== 'false',
  timeout: Number.parseInt(process.env.TIMEOUT ?? '60000', 10),
};

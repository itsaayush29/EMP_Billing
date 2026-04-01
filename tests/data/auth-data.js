import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const authData = {
  login: {
    email: process.env.ADMIN_EMAIL || 'admin@acme.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
  invalidLogin: {
    email: process.env.INVALID_ADMIN_EMAIL || 'invalid.admin@example.com',
    password: process.env.INVALID_ADMIN_PASSWORD || 'Invalid@123',
  },
};

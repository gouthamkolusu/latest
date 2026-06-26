import 'dotenv/config';

export default {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  EASYPOST_API_KEY: process.env.EASYPOST_API_KEY ?? '',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
};

import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const configuredSecret = process.env.REALTIME_INTERNAL_SECRET;
if (!configuredSecret && process.env.NODE_ENV === 'production') {
  throw new Error('REALTIME_INTERNAL_SECRET é obrigatório em produção');
}
export const realtimeSecret = configuredSecret || 'cronos-local-realtime';

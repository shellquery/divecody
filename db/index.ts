import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const dbUrl =
  process.env.DATABASE_URL ??
  process.env.divecody_DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.divecody_POSTGRES_URL;

if (!dbUrl) throw new Error('No DATABASE_URL environment variable set');

export const db = drizzle(neon(dbUrl), { schema });

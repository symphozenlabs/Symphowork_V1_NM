import { db, sql } from '@/db/client';
import * as schema from './schema';

export function database() {
  return db;
}

export { sql };

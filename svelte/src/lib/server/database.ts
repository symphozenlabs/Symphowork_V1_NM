import { env } from '$env/dynamic/private';
import postgres from 'postgres';
import {sessionDatabaseURL} from './integration-configuration';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
let connection: ReturnType<typeof postgres> | undefined;
export function database() {
  // Lazy: importing, building and unit testing never opens a database connection.
  const url=sessionDatabaseURL(env);
  if (!url) throw new Error('Session database is not configured.');
  connection ??= postgres(url, { max: 10, prepare: false, idle_timeout: 30, connect_timeout: 10 });
  return drizzle(connection, { schema });
}


import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

async function main() {
  const pg = new PGlite({ extensions: { pgcrypto } });

  await pg.exec(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
    CREATE ROLE neondb_owner LOGIN CREATEROLE BYPASSRLS;
    GRANT ALL ON DATABASE postgres TO neondb_owner;
    CREATE ROLE sympowork_app LOGIN NOSUPERUSER NOBYPASSRLS;
    GRANT sympowork_app TO neondb_owner WITH SET TRUE, INHERIT FALSE;
  `);

  await pg.exec('SET SESSION AUTHORIZATION neondb_owner;');

  // Cutover
  await pg.exec('BEGIN;');
  await pg.exec(`
    CREATE ROLE sympowork_context_owner NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
    GRANT sympowork_context_owner TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;

    CREATE SCHEMA IF NOT EXISTS app_private;
    GRANT ALL ON SCHEMA app_private TO sympowork_context_owner;
    ALTER SCHEMA app_private OWNER TO sympowork_context_owner;

    SET LOCAL ROLE sympowork_context_owner;
    REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
    CREATE FUNCTION app_private.test_fn() RETURNS text LANGUAGE sql AS 'SELECT 1::text';
    REVOKE ALL ON FUNCTION app_private.test_fn() FROM PUBLIC;

    -- Grant usage and execute as context owner
    GRANT USAGE ON SCHEMA app_private TO sympowork_app;
    GRANT EXECUTE ON FUNCTION app_private.test_fn() TO sympowork_app;
    RESET ROLE;
  `);

  await pg.exec('COMMIT;');
  console.log('Cutover with grants as context owner succeeded!');

  // Test sympowork_app can call function
  await pg.exec('SET ROLE sympowork_app;');
  const res = await pg.query('SELECT app_private.test_fn()');
  console.log('Result for sympowork_app:', res.rows[0]);
}

main().catch(console.error);

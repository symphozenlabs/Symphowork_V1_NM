import {describe,it,expect} from 'vitest';
import {sessionDatabaseURL,IntegrationConfigurationError} from './integration-configuration';
describe('explicit direct database configuration',()=>{
 it('returns undefined when DATABASE_URL is not provided',()=>{
  expect(sessionDatabaseURL({})).toBeUndefined();
  expect(sessionDatabaseURL({DATABASE_URL:''})).toBeUndefined();
 });
 it('preserves an explicitly supplied valid DATABASE_URL',()=>{
  expect(sessionDatabaseURL({DATABASE_URL:'postgresql://user:pass@localhost:5432/symphowork'})).toBe('postgresql://user:pass@localhost:5432/symphowork');
  expect(sessionDatabaseURL({DATABASE_URL:'postgres://user:pass@ep-cool-db.neon.tech/symphowork?sslmode=require'})).toBe('postgres://user:pass@ep-cool-db.neon.tech/symphowork?sslmode=require');
 });
 it('throws sanitized IntegrationConfigurationError for invalid URLs',()=>{
  expect(()=>sessionDatabaseURL({DATABASE_URL:'http://not-postgres.invalid'})).toThrow(IntegrationConfigurationError);
  expect(()=>sessionDatabaseURL({DATABASE_URL:'not-a-valid-url'})).toThrow(IntegrationConfigurationError);
 });
});

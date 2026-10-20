import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "./schema";

/**
 * SQLite connection built on Node's native `node:sqlite` driver.
 *
 * Using the built-in avoids native compilation (no prebuilds, no node-gyp) and
 * keeps the dependency tree free of a database binary.
 *
 * Schema changes are applied through numbered migrations tracked with
 * SQLite's `user_version`, so an existing database upgrades in place.
 */

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "cancha.db");

declare global {
  var __canchaDb: DatabaseSync | undefined;
}

function migrate(db: DatabaseSync) {
  const current = db.prepare("PRAGMA user_version").get() as { user_version: number };
  let version = current?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= version) continue;
    db.exec(migration.sql);
    db.exec(`PRAGMA user_version = ${migration.version}`);
    version = migration.version;
  }
}

function connect(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA busy_timeout = 5000;");
  migrate(database);
  return database;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__canchaDb) {
    globalThis.__canchaDb = connect();
  }
  return globalThis.__canchaDb;
}

/** Run a statement and return the inserted id. */
export function insert(sql: string, ...params: unknown[]): number {
  const result = getDb()
    .prepare(sql)
    .run(...(params as never[]));
  return Number(result.lastInsertRowid);
}

export function run(sql: string, ...params: unknown[]): void {
  getDb()
    .prepare(sql)
    .run(...(params as never[]));
}

export function all<T>(sql: string, ...params: unknown[]): T[] {
  // `node:sqlite` returns null-prototype rows; React refuses to serialise
  // those to client components, so every row is copied into a plain object.
  return getDb()
    .prepare(sql)
    .all(...(params as never[]))
    .map((row) => ({ ...row })) as T[];
}

export function one<T>(sql: string, ...params: unknown[]): T | undefined {
  const row = getDb()
    .prepare(sql)
    .get(...(params as never[]));
  return row === undefined ? undefined : ({ ...row } as T);
}

/** Run `fn` inside a transaction, rolling back on error. */
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

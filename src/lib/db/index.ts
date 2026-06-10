import "pg-cloudflare";

import { drizzle } from "drizzle-orm/node-postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

type HyperdriveBinding = {
  connectionString: string;
};

declare global {
  interface CloudflareEnv {
    HYPERDRIVE?: HyperdriveBinding;
  }
}

function getConnectionString() {
  try {
    const hyperdrive = getCloudflareContext().env.HYPERDRIVE as HyperdriveBinding | undefined;

    if (hyperdrive?.connectionString) {
      return hyperdrive.connectionString;
    }
  } catch {
    // getCloudflareContext is only available inside the OpenNext Cloudflare runtime.
  }

  return process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/eguchi_pitch_training";
}

const globalForDb = globalThis as typeof globalThis & {
  pgPool?: Pool;
  db?: NodePgDatabase<typeof schema>;
};

function getPool() {
  if (globalForDb.pgPool) {
    return globalForDb.pgPool;
  }

  const pool = new Pool({
    connectionString: getConnectionString(),
  });

  globalForDb.pgPool = pool;
  return pool;
}

function getDb() {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const db = drizzle(getPool(), { schema });
  globalForDb.db = db;
  return db;
}

export const pool = new Proxy({} as Pool, {
  get(_target, property, receiver) {
    return Reflect.get(getPool(), property, receiver);
  },
});

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

export { schema };

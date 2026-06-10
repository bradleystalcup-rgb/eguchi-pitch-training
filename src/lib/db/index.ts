import { drizzle } from "drizzle-orm/node-postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Pool } from "pg";

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

const connectionString = getConnectionString();

const globalForDb = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };

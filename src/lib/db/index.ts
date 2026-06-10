import "pg-cloudflare";

import { drizzle } from "drizzle-orm/node-postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Pool } from "pg";
import { cache } from "react";
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

export const getDb = cache((): NodePgDatabase<typeof schema> => {
  const pool = new Pool({
    connectionString: getConnectionString(),
    max: 1,
    maxUses: 1,
  });

  return drizzle({ client: pool, schema });
});

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

export { schema };

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Schema = typeof schema;
export type Database = PostgresJsDatabase<Schema>;

interface CloudflareEnv {
  DATABASE_URL?: string;
  HYPERDRIVE?: {
    connectionString?: string;
  };
}

let localDbSingleton: Database | null = null;

function getRuntimeConnection(): {
  connectionString: string;
  isWorkers: boolean;
} {
  let cfEnv: CloudflareEnv | undefined;
  let isWorkers = false;

  try {
    const ctx = getCloudflareContext();
    if (ctx?.env) {
      cfEnv = ctx.env as CloudflareEnv;
      isWorkers = true;
    }
  } catch {
    // Running outside OpenNext Cloudflare context (local Node.js dev / build)
  }

  if (
    !isWorkers &&
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  ) {
    isWorkers = true;
  }

  const connectionString =
    cfEnv?.HYPERDRIVE?.connectionString ||
    cfEnv?.DATABASE_URL ||
    process.env.DATABASE_URL ||
    "";

  return { connectionString, isWorkers };
}

function getLocalDb(connectionString: string): Database {
  if (!localDbSingleton) {
    const client = postgres(connectionString, {
      prepare: false,
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    localDbSingleton = drizzle(client, { schema });
  }
  return localDbSingleton;
}

function createWorkerDbClient(connectionString: string): {
  instance: Database;
  cleanup: () => Promise<void>;
} {
  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  });
  const instance = drizzle(client, { schema });
  const cleanup = async () => {
    await client.end({ timeout: 0 }).catch(() => undefined);
  };
  return { instance, cleanup };
}

function wrapWithCleanup<T extends object>(
  target: T,
  cleanup: () => Promise<void>
): T {
  return new Proxy(target, {
    get(obj, prop) {
      if (prop === "then") {
        const thenFn = Reflect.get(obj, "then", obj);
        if (typeof thenFn === "function") {
          return (
            onFulfilled?: ((value: unknown) => unknown) | null,
            onRejected?: ((reason: unknown) => unknown) | null
          ) => {
            const promise = new Promise((resolve, reject) => {
              thenFn.call(obj, resolve, reject);
            }).finally(cleanup);
            return promise.then(onFulfilled, onRejected);
          };
        }
      }

      const value = Reflect.get(obj, prop, obj);
      if (typeof value === "function") {
        return (...args: unknown[]) => {
          const result = (value as (...a: unknown[]) => unknown).apply(
            obj,
            args
          );
          if (result !== null && typeof result === "object") {
            return wrapWithCleanup(result, cleanup);
          }
          return result;
        };
      }

      if (value !== null && typeof value === "object") {
        return wrapWithCleanup(value, cleanup);
      }

      return value;
    },
  });
}

function createWorkerQueryProxy(): Database["query"] {
  return new Proxy({} as Database["query"], {
    get(_target, tableName) {
      return new Proxy(
        {},
        {
          get(_tableTarget, methodName) {
            return (...args: unknown[]) => {
              const { connectionString } = getRuntimeConnection();
              if (!connectionString) {
                throw new Error(
                  "DATABASE_URL is not configured in Cloudflare Workers environment."
                );
              }
              const { instance, cleanup } =
                createWorkerDbClient(connectionString);
              const tableQuery = Reflect.get(instance.query, tableName);
              const method = Reflect.get(
                tableQuery as object,
                methodName
              ) as (...a: unknown[]) => object;
              const result = method.apply(tableQuery, args);
              return wrapWithCleanup(result, cleanup);
            };
          },
        }
      );
    },
  });
}

/**
 * Request-safe Drizzle database instance.
 * - On Cloudflare Workers: creates an isolated single-use postgres connection per query/transaction
 *   and closes the TCP socket immediately after completion to prevent cross-request I/O errors.
 * - On local Node.js: reuses a pooled singleton connection.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const { connectionString, isWorkers } = getRuntimeConnection();

    if (!isWorkers) {
      if (!connectionString) {
        throw new Error(
          "DATABASE_URL is not configured in environment variables."
        );
      }
      const localDb = getLocalDb(connectionString);
      const value = Reflect.get(localDb, prop, localDb);
      if (typeof value === "function") {
        return (value as (...a: unknown[]) => unknown).bind(localDb);
      }
      return value;
    }

    if (prop === "query") {
      return createWorkerQueryProxy();
    }

    return (...args: unknown[]) => {
      if (!connectionString) {
        throw new Error(
          "DATABASE_URL is not configured in Cloudflare Workers environment."
        );
      }
      const { instance, cleanup } = createWorkerDbClient(connectionString);
      const method = Reflect.get(instance, prop, instance);
      if (typeof method !== "function") {
        throw new Error(`Unsupported db property access: ${String(prop)}`);
      }
      const result = (method as (...a: unknown[]) => unknown).apply(
        instance,
        args
      );
      if (result !== null && typeof result === "object") {
        return wrapWithCleanup(result, cleanup);
      }
      return result;
    };
  },
});

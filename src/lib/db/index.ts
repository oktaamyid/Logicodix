import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

/**
 * Singleton postgres client untuk runtime Next.js server.
 * prepare: false wajib digunakan saat terhubung ke Transaction Pooler Supabase (Port 6543 / PgBouncer).
 */
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

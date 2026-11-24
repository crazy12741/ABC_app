import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';

// Cloudflare Workers cannot share a TCP/WebSocket pool between requests, so:
//  - normal queries go over Neon's stateless HTTP driver (safe to reuse globally)
//  - transactions open a short-lived WebSocket pool and close it afterwards

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  return url;
}

type HttpDb = ReturnType<typeof drizzleHttp>;
let httpDb: HttpDb | undefined;

function getHttpDb(): HttpDb {
  httpDb ??= drizzleHttp(neon(connectionString()));
  return httpDb;
}

export const db: HttpDb = new Proxy({} as HttpDb, {
  get(_target, prop) {
    if (prop === 'transaction') {
      return async (fn: any, config?: any) => {
        const txPool = new Pool({ connectionString: connectionString() });
        try {
          return await drizzleWs(txPool).transaction(fn, config);
        } finally {
          await txPool.end();
        }
      };
    }
    const target = getHttpDb() as any;
    const value = target[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

// Used only by the Node/Bun scripts in /scripts (seed, verify).
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

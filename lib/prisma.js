import { PrismaClient } from '../src/generated/prisma/client.ts';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function dbOptions(){
  const required=['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD'];
  const missing=required.filter(k=>!process.env[k]);
  if(missing.length) throw new Error(`Missing GoDaddy database variables: ${missing.join(', ')}`);
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    allowPublicKeyRetrieval: true,
    connectionLimit: 5,
    acquireTimeout: 15000,
    connectTimeout: 10000
  };
}

function getClient(){
  if(globalThis.__otePrisma) return globalThis.__otePrisma;
  const adapter=new PrismaMariaDb(dbOptions());
  const client=new PrismaClient({adapter});
  globalThis.__oteAdapter=adapter;
  globalThis.__otePrisma=client;
  return client;
}

// Lazy proxy keeps GoDaddy's build step database-independent. The actual
// DB_* variables are only required when a request or startup seed uses Prisma.
export const prisma=new Proxy({}, {
  get(_target, prop){
    const client=getClient();
    const value=client[prop];
    return typeof value==='function' ? value.bind(client) : value;
  }
});

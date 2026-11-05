const env = require("../config/env");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const mariadb = require("mariadb");

const globalForPrisma = global;

function createPrismaClient() {
  const u = new URL(env.TIDB_DATABASE_URL);
  const pool = mariadb.createPool({
    host: u.hostname,
    port: Number(u.port) || 4000,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1) || undefined,
    ssl: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
    connectTimeout: 15000,
    acquireTimeout: 15000,
    idleTimeout: 10000,
  });

  const adapter = new PrismaMariaDb(pool);

  const client = new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  const originalDisconnect = client.$disconnect.bind(client);
  client.$disconnect = async function () {
    try {
      await originalDisconnect();
    } catch (_) {}
    try {
      if (pool && !pool.isClosed && pool.end) {
        await pool.end();
      }
    } catch (_) {}
  };
  client.$pool = pool;

  return client;
}

const prisma = globalForPrisma.prisma || createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

module.exports = prisma;

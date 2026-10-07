const env = require("../config/env");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const globalForPrisma = global;

function createPrismaClient() {
  const adapter = new PrismaMariaDb(env.TIDB_DATABASE_URL);
  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const prisma = globalForPrisma.prisma || createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

module.exports = prisma;

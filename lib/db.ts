import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = {
  get booking() { return getPrismaClient().booking },
  get $connect() { return getPrismaClient().$connect.bind(getPrismaClient()) },
  get $disconnect() { return getPrismaClient().$disconnect.bind(getPrismaClient()) },
}

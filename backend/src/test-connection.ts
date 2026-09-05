// src/test-connection.ts
import prisma from "./utils/prisma";

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 + 1 AS result`;
    console.log("✅ Connection successful:", result);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
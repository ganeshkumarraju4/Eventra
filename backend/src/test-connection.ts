import prisma from "./utils/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("Prisma connected successfully.");

    console.log("Testing raw query...");
    const result = await prisma.$queryRaw`SELECT 1 AS result`;
    console.log("Raw query successful:", result);

    console.log("Testing User model...");
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);
  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


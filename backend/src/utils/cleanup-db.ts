import prisma from "./prisma";

async function main() {
  const idsToDelete = [
    "0ad626bb-f41d-4713-95a8-bb489ca642e8",
    "d9760557-7493-4521-a06e-9695be786bfa",
  ];

  const result = await prisma.event.deleteMany({
    where: {
      id: {
        in: idsToDelete,
      },
    },
  });

  console.log("Deleted duplicate events:", result.count);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
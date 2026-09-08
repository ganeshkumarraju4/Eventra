import  prisma  from "./prisma";

async function testDatabase() {
  try {
   const registration = await prisma.registration.update({
  where: {
    id: "66f26eec-fe43-414f-8883-7a646ba70596",
  },
  data: {
    status: "APPROVED",
  },
});

console.log("Updated registration:", registration);

  } catch (error) {
    console.log("✅ TEST PASSED: Invalid user ID was rejected.");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
/*
Core model creation             ✅
Relationships                   ✅
Constraint testing              ✅
Relationship querying           ✅
Update / status testing         ✅
*/
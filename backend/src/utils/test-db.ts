import prisma from "./prisma";

async function testDatabase() {
  try {
    // Existing user
    const existingUser = await prisma.user.findFirst();

    if (!existingUser) {
      console.log("No existing user found.");
      return;
    }

    // Create two temporary users
    const user2 = await prisma.user.create({
      data: {
        name: "Capacity Test User 2",
        email: "capacity-test-2@example.com",
        password: "test-password",
        role: "USER",
      },
    });

    const user3 = await prisma.user.create({
      data: {
        name: "Capacity Test User 3",
        email: "capacity-test-3@example.com",
        password: "test-password",
        role: "USER",
      },
    });

    console.log("Created temporary users.");

    // Create event with maximum 2 participants
    const event = await prisma.event.create({
      data: {
        title: "Participant Limit Test",
        description: "Testing maximum participant business rule",
        startTime: new Date("2026-10-05T10:00:00+05:30"),
        endTime: new Date("2026-10-05T12:00:00+05:30"),
        category: "WORKSHOP",
        type: "PUBLIC",
        registrationMode: "OPEN",
        maxParticipants: 2,
        organizerId: existingUser.id,
      },
    });

    console.log("Created event:", event);

    // Registration 1
    const registration1 = await prisma.registration.create({
      data: {
        userId: existingUser.id,
        eventId: event.id,
        status: "APPROVED",
      },
    });

    console.log("Registration 1:", registration1.status);

    // Registration 2
    const registration2 = await prisma.registration.create({
      data: {
        userId: user2.id,
        eventId: event.id,
        status: "APPROVED",
      },
    });

    console.log("Registration 2:", registration2.status);

    // Registration 3 - should be rejected by business rule
    const registration3 = await prisma.registration.create({
      data: {
        userId: user3.id,
        eventId: event.id,
        status: "APPROVED",
      },
    });

    console.log("⚠️ Registration 3 was created:", registration3);
    console.log(
      "❌ BUSINESS RULE NOT ENFORCED: Event exceeded maxParticipants."
    );

  } catch (error) {
    console.log("Registration was rejected:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
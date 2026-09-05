import prisma from "./prisma";

async function testDatabase() {
  try {
    // Find existing user
    const user = await prisma.user.findUnique({
      where: {
        email: "test@example.com",
      },
    });

    console.log("Found user:", user);

    if (!user) {
      throw new Error("Test user not found");
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title: "Annual Coding Contest",
        description: "A college-wide competitive programming contest.",

        startTime: new Date("2026-09-20T10:00:00"),
        endTime: new Date("2026-09-20T16:00:00"),

        category: "WORKSHOP",
        type: "PUBLIC",

        registrationMode: "APPROVAL_REQUIRED",
        maxParticipants: 100,

        organizerId: user.id,
      },
    });

    console.log("Created event:", event);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        eventId: event.id,
        venueId: "4c39b588-8462-4c1e-913e-296d417e6fce",

        startTime: new Date("2026-09-20T10:00:00"),
        endTime: new Date("2026-09-20T16:00:00"),

        status: "PENDING",
      },
    });

    console.log("Created booking:", booking);
    const registration = await prisma.registration.create({
  data: {
    userId: user.id,
    eventId: event.id,
    status: "PENDING",
  },
});

console.log("Created registration:", registration);

  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
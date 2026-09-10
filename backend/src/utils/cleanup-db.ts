import prisma from "./prisma";

async function cleanupTestData() {
  try {
    // 1. Delete test registrations
    const deletedRegistrations =
      await prisma.registration.deleteMany({
        where: {
          id: {
            in: [
              "c6f96694-2c5f-4a25-9558-1f42557cf891",
              "c7f6955e-06e0-402f-910a-9c83bbf945be",
              "2f3cd6dd-acb0-4683-8010-3a0c2f3ba329",
              "dce20047-9084-4602-9dfb-4873d2339b45",
            ],
          },
        },
      });

    console.log(
      "Deleted registrations:",
      deletedRegistrations.count
    );

    // 2. Delete test bookings
    const deletedBookings =
      await prisma.booking.deleteMany({
        where: {
          id: {
            in: [
              "0cdf9dce-31cb-40ea-83e2-14584f2bc0f3",
              "779c5c2b-cea3-47cb-9a45-507f939b26ce",
            ],
          },
        },
      });

    console.log(
      "Deleted bookings:",
      deletedBookings.count
    );

    // 3. Delete test events
    const deletedEvents =
      await prisma.event.deleteMany({
        where: {
          id: {
            in: [
              "2e70d08c-6fa1-4d2d-a85a-4d6a991aff71",
              "2f7b66f5-2523-4d57-aac9-8d0303b11561",
              "473a2288-bb54-4ff2-ae27-1d03dd2bddd9",
              "8e177d0a-af0c-4bf9-9e75-db82ab12f79a",
              "ce3af62d-8906-4421-8378-4eda1647a583",
            ],
          },
        },
      });

    console.log(
      "Deleted events:",
      deletedEvents.count
    );

    // 4. Delete temporary users
    const deletedUsers =
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [
              "3d486669-1660-4426-89ce-daa608affd44",
              "2d704164-edf5-4de0-97d9-b5a2c5437fe1",
            ],
          },
        },
      });

    console.log(
      "Deleted users:",
      deletedUsers.count
    );

  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
import prisma from "./prisma";

async function testDatabase() {
  try {
    const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
  },
});

const venues = await prisma.venue.findMany({
  select: {
    id: true,
    name: true,
    location: true,
    capacity: true,
  },
});

const events = await prisma.event.findMany({
  select: {
    id: true,
    title: true,
    organizerId: true,
    maxParticipants: true,
  },
});


const bookings = await prisma.booking.findMany({
    select: {
        id: true,
        eventId: true,
        venueId: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
    },
});


const registrations = await prisma.registration.findMany({
  select: {
    id: true,
    userId: true,
    eventId: true,
    status: true,
  },
});

console.log("USERS:", users);
console.log("VENUES:", venues);
console.log("EVENTS:", events);
console.log("BOOKINGS:", bookings);
console.log("REGISTRATIONS:", registrations);
  } catch (error) {
    console.log("Registration was rejected:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
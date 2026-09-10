import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/utils/prisma";

async function main() {
  console.log("🌱 Starting database seed...");

  // =========================
  // PASSWORD
  // =========================

  const password = await bcrypt.hash("password123", 10);

  // =========================
  // USERS
  // =========================

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: {
      email: "user@example.com",
    },
    update: {},
    create: {
      name: "Normal User",
      email: "user@example.com",
      password,
      role: "USER",
    },
  });

  // =========================
  // VENUE
  // =========================

  const venue = await prisma.venue.upsert({
    where: {
      id: "11111111-1111-1111-1111-111111111111",
    },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Main Auditorium",
      location: "College Campus",
      capacity: 500,
    },
  });

  // =========================
  // EVENT
  // =========================

  const event = await prisma.event.upsert({
    where: {
      id: "22222222-2222-2222-2222-222222222222",
    },
    update: {},
    create: {
      id: "22222222-2222-2222-2222-222222222222",
      title: "Annual Coding Contest",
      description: "Annual programming competition for students.",
      startTime: new Date("2026-10-10T10:00:00+05:30"),
      endTime: new Date("2026-10-10T16:00:00+05:30"),
      category: "CONFERENCE",
      type: "PUBLIC",
      registrationMode: "OPEN",
      maxParticipants: 100,
      organizerId: admin.id,
    },
  });

  // =========================
  // BOOKING
  // =========================

  await prisma.booking.upsert({
    where: {
      eventId: event.id,
    },
    update: {},
    create: {
      userId: admin.id,
      eventId: event.id,
      venueId: venue.id,
      startTime: event.startTime,
      endTime: event.endTime,
      status: "APPROVED",
    },
  });

  // =========================
  // REGISTRATION
  // =========================

  await prisma.registration.upsert({
    where: {
      userId_eventId: {
        userId: user.id,
        eventId: event.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      eventId: event.id,
      status: "APPROVED",
    },
  });

  console.log("✅ Database seed completed!");

  console.log("\nSeeded records:");
  console.log("Admin:", admin.email, admin.id);
  console.log("User:", user.email, user.id);
  console.log("Venue:", venue.name, venue.id);
  console.log("Event:", event.title, event.id);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
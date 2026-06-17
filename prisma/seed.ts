// Seed script to initialize default routes and times
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with default routes and times...");

  // Define default routes
  const defaultRoutes = [
    { name: "Gaborone to OR Tambo Airport", origin: "Gaborone", destination: "OR Tambo Airport" },
    { name: "OR Tambo Airport to Gaborone", origin: "OR Tambo Airport", destination: "Gaborone" },
    { name: "Gaborone to Rustenburg", origin: "Gaborone", destination: "Rustenburg" },
    { name: "Rustenburg to Gaborone", origin: "Rustenburg", destination: "Gaborone" },
    { name: "Rustenburg to OR Tambo Airport", origin: "Rustenburg", destination: "OR Tambo Airport" },
    { name: "OR Tambo Airport to Rustenburg", origin: "OR Tambo Airport", destination: "Rustenburg" },
  ];

  // Define default departure times
  const defaultTimes = ["07:00", "08:00", "09:30", "10:30", "15:00", "17:00", "17:30", "19:30"];

  // Seed routes
  for (const route of defaultRoutes) {
    const existing = await prisma.route.findUnique({
      where: { name: route.name },
    });

    if (!existing) {
      await prisma.route.create({
        data: {
          ...route,
          active: true,
        },
      });
      console.log(`✅ Created route: ${route.name}`);
    } else {
      console.log(`⏭️  Route already exists: ${route.name}`);
    }
  }

  // Seed departure times
  for (const time of defaultTimes) {
    const existing = await prisma.departureTime.findUnique({
      where: { time },
    });

    if (!existing) {
      await prisma.departureTime.create({
        data: {
          time,
          active: true,
        },
      });
      console.log(`✅ Created time: ${time}`);
    } else {
      console.log(`⏭️  Time already exists: ${time}`);
    }
  }

  console.log("✨ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

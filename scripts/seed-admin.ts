import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const userType = "admin";
  const name = "System Administrator";
  const email = "admin@coleague.internal";

  console.log(`Seeding admin user '${username}'...`);

  const hashedPassword = hashPassword(password);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      userType,
      name,
      email,
    },
    create: {
      username,
      password: hashedPassword,
      userType,
      name,
      email,
    },
  });

  console.log("Admin user seeded successfully!");
  console.log(`ID: ${user.id}`);
  console.log(`Username: ${user.username}`);
  console.log(`Role / User Type: ${user.userType}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("Error seeding admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

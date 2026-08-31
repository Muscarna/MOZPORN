import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@mozporn.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error("Defina ADMIN_PASSWORD no .env com pelo menos 12 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: "Administrador",
      role: Role.ADMIN,
    },
    create: {
      email,
      passwordHash,
      name: "Administrador",
      role: Role.ADMIN,
    },
  });

  if (email !== "admin@mozporn.local") {
    await prisma.user.updateMany({
      where: {
        email: "admin@mozporn.local",
        id: { not: admin.id },
      },
      data: { role: Role.USER },
    });
  }

  console.log(`Admin criado/atualizado: ${admin.email}`);
  console.log("A palavra-passe do administrador foi atualizada a partir de ADMIN_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

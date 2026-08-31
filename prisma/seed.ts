import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@mozporn.local";
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Defina ADMIN_PASSWORD no .env com pelo menos 12 caracteres.");
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: {
      email,
      passwordHash,
      name: "Administrador",
      role: Role.ADMIN,
    },
  });

  console.log(`Admin criado/atualizado: ${admin.email}`);
  console.log("A palavra-passe do administrador foi lida de ADMIN_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

/**
 * İstifadə: npx tsx scripts/create-admin.ts admin@bestofset.az MəxfiŞifrə123 "Admin Adı"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [, , email, password, name] = process.argv;
  if (!email || !password) {
    console.error(
      "İstifadə: npx tsx scripts/create-admin.ts <email> <şifrə> [ad]"
    );
    process.exit(1);
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role: "ADMIN", name: name || "Admin" },
    create: {
      email,
      password: hashed,
      name: name || "Admin",
      role: "ADMIN",
    },
  });
  console.log("Admin istifadəçi hazırdır:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

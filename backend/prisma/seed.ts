import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const aditya = await prisma.user.upsert({
    where: { email: "imadeaditya4@gmail.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Aditya",
      password: bcrypt.hashSync("password"),
      email_verified_at: new Date(),
      balance: 100000,
      currency: 'id-ID IDR'
    },
  });
  console.log({ aditya });
}
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
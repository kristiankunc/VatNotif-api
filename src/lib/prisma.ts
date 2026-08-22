import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../prisma/generated/client/client";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

export const prisma = new PrismaClient({ adapter });

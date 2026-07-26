import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function ensureInitialAdmin(): Promise<{
  created: boolean;
  email?: string;
  message: string;
}> {
  try {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return {
        created: false,
        message: "O banco de dados já possui usuários cadastrados.",
      };
    }

    const name = process.env.ADMIN_NAME || "Lucas Admin";
    const email = process.env.ADMIN_EMAIL || "admin@cgconstrucoes.com.br";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        department: "Gestão / TI",
        isActive: true,
      },
    });

    console.log(`[HelpDesk Seed] Administrador inicial criado com sucesso: ${admin.email}`);

    return {
      created: true,
      email: admin.email,
      message: "Primeiro administrador criado com sucesso no banco de dados.",
    };
  } catch (error) {
    console.error("[HelpDesk Seed] Erro ao verificar ou criar administrador inicial:", error);
    throw error;
  }
}
